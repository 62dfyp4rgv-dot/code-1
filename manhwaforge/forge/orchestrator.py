"""The orchestrator: runs the four agents end to end, with zero human intervention, and enforces
the 95% completion rule.

    ingest -> Director (script) -> Artist style analysis + character bank
           -> per-panel [Artist -> Critic loop -> Typesetter]   (parallel)
           -> Assembler (layout, reader)  ->  95%  ->  HARD SAVE and HALT

After the halt nothing runs until a human sends an instruction (finalize / cancel).
"""
from __future__ import annotations

import json
import shutil
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional

from PIL import Image

from . import config
from .agents.artist import Artist, CharacterBank, ImageProvider, get_provider, slug
from .agents.assembler import Assembler, Layout
from .agents.critic import Critic
from .agents.director import Director
from .agents.typesetter import Typesetter
from .ingest import ingest
from .models import Critique, PanelStatus
from .packaging import make_zip, write_reader, write_summary
from .progress import HaltSignal, ProgressTracker
from .store import JobRecord, JobStore
from .styles import choose_style, stable_seed


class Cancelled(Exception):
    pass


class Orchestrator:
    def __init__(self, store: JobStore, provider: Optional[ImageProvider] = None, director: Optional[Director] = None,
                 critic: Optional[Critic] = None, job_workers: int = config.JOB_WORKERS, panel_workers: int = config.PANEL_WORKERS,
                 max_attempts: int = config.MAX_REFINE_ATTEMPTS):
        self.store = store
        self.provider = provider or get_provider()
        self.director = director or Director()
        self.critic = critic or Critic()
        self.panel_workers = panel_workers
        self.max_attempts = max_attempts
        self.pool = ThreadPoolExecutor(job_workers, thread_name_prefix="forge-job")

    # ------------------------------------------------------------------ public
    def submit(self, rec: JobRecord) -> None:
        rec.log("Orchestrator", "job queued")
        self.pool.submit(self._guard, rec, self._run)

    def resume(self, rec: JobRecord, instruction: str, action: str = "finalize") -> None:
        """Manual instruction after a halt. Only the instruction starts anything; nothing auto-resumes."""
        with rec.lock:
            if rec.state.status != "halted":
                raise ValueError(f"job is '{rec.state.status}', only a halted job accepts a resume instruction")
            if action == "cancel":
                rec.state.status, rec.state.stage = "cancelled", "cancelled"
                rec.state.resume_note = instruction
                rec._persist()
                rec.log("Orchestrator", "cancelled by manual instruction; the 95% package stays downloadable")
                return
            rec.state.status, rec.state.stage = "running", "polish"
            rec.state.resume_note = instruction
            rec._persist()
        rec.log("Orchestrator", f"manual instruction received: {instruction or 'finalize'}")
        self.pool.submit(self._guard, rec, self._finalize, instruction)

    def shutdown(self) -> None:
        self.pool.shutdown(wait=False, cancel_futures=True)

    # ------------------------------------------------------------------ plumbing
    def _guard(self, rec: JobRecord, fn, *a) -> None:
        try:
            fn(rec, *a)
        except Cancelled:
            rec.mutate(lambda s: (setattr(s, "status", "cancelled"), setattr(s, "stage", "cancelled")))
            rec.log("Orchestrator", "job cancelled", "warn")
        except Exception as e:   # noqa: BLE001
            rec.log("Orchestrator", f"job failed: {type(e).__name__}: {e}", "error")
            rec.log("Orchestrator", traceback.format_exc(limit=6), "debug")
            rec.mutate(lambda s: (setattr(s, "status", "failed"), setattr(s, "stage", "failed"), setattr(s, "error", f"{type(e).__name__}: {e}")))

    def _tracker(self, rec: JobRecord) -> ProgressTracker:
        def sync(t: ProgressTracker) -> None:
            snap = t.snapshot()
            rec.mutate(lambda s: (setattr(s, "progress", snap["progress"]), setattr(s, "confidence", snap["confidence"]),
                                  setattr(s, "stage_progress", snap["stage_progress"]), setattr(s, "mean_amazement", snap["mean_amazement"])))
        tr = ProgressTracker(on_change=sync)
        rec.tracker = tr
        return tr

    @staticmethod
    def _stage(rec: JobRecord, name: str) -> None:
        rec.mutate(lambda s: setattr(s, "stage", name))

    # ------------------------------------------------------------------ main pipeline
    def _run(self, rec: JobRecord) -> None:
        st = rec.state
        tr = self._tracker(rec)
        rec.mutate(lambda s: setattr(s, "status", "running"))
        t0 = time.time()
        rec.log("Orchestrator", f"starting end-to-end generation (format={st.format}, target ≈{st.target_panels} panels). No approvals will be requested.")
        script = None
        layout: Optional[Layout] = None
        try:
            def check() -> None:
                if rec.cancel.is_set():
                    raise Cancelled()
                tr.checkpoint()

            # ---------------- 1. Director
            self._stage(rec, "director")
            pkg = ingest("", st.title, rec.inputs_dir)
            for n in pkg.notes:
                rec.log("Director", n)
            rec.mutate(lambda s: setattr(s, "inputs", pkg.files))
            script = self.director.plan(pkg, st.target_panels, lambda m: rec.log("Director", m))
            if not st.title.strip():
                rec.mutate(lambda s: setattr(s, "title", pkg.title or script.title))
            elif not script.title:
                script.title = st.title
            script.title = rec.state.title
            known = {c.name for c in script.characters}
            for p in script.panels:
                p.characters = [c for c in p.characters if c.name in known]
            (rec.work_dir / "script.json").write_text(script.model_dump_json(indent=2), encoding="utf-8")
            rec.mutate(lambda s: (setattr(s, "director_source", script.source),
                                  setattr(s, "panels", [PanelStatus(index=p.index, shot=p.shot, summary=p.summary) for p in script.panels]),
                                  setattr(s, "characters", [c.name for c in script.characters])))
            for p in script.panels[:50]:
                rec.log("Director", f"panel {p.index + 1}: {p.shot.replace('_', ' ')} · {p.location} · {p.mood}"
                        + (f" · {', '.join(c.name for c in p.characters)}" if p.characters else ""), "debug")
            tr.advance("director", 1, 1)
            check()

            # ---------------- 2. Artist: style analysis + character bank
            self._stage(rec, "style")
            style = choose_style(st.style_request, pkg.text, pkg.sketches)
            rec.mutate(lambda s: setattr(s, "style", style))
            rec.log("Artist", f"style: {style.name} - {'; '.join(style.reasons)}")
            tr.advance("style", 1, 2)
            series_key = st.series.strip() or f"job-{st.id}"
            bank = CharacterBank(series_key)
            sheets = bank.ensure(script.characters, style, lambda m: rec.log("Artist", m))
            tr.advance("style", 2, 2)
            check()

            # ---------------- 3. parallel panel pipeline: Artist <-> Critic loop, then Typesetter
            self._stage(rec, "art")
            artist = Artist(self.provider, self.critic, self.max_attempts)
            typesetter = Typesetter()
            N = len(script.panels)
            job_seed = stable_seed("job", st.id)
            art_dir, thumb_dir, panel_dir = rec.work_dir / "art", rec.work_dir / "thumbs", rec.out_dir / "panels"
            for d in (art_dir, thumb_dir, panel_dir):
                d.mkdir(parents=True, exist_ok=True)
            counters = {"art": 0, "ts": 0}
            clock = threading.Lock()
            prompts: dict[int, list[str]] = {}
            results: dict[int, Image.Image] = {}

            def set_panel(idx: int, **kw) -> None:
                def f(s):
                    ps = s.panels[idx]
                    for k, v in kw.items():
                        setattr(ps, k, v)
                rec.mutate(f)

            def thumb(img: Image.Image, idx: int) -> None:
                t = img.convert("RGB")
                t.thumbnail((360, 360))
                t.save(thumb_dir / f"panel_{idx + 1:02d}.jpg", quality=80)

            def on_attempt(idx: int, attempt: int, c: Critique, result) -> None:
                thumb(result.image, idx)
                hist = list(rec.state.panels[idx].history) + [c.amazement]
                set_panel(idx, state="rendering", attempts=attempt, score=c.amazement, anatomy=c.anatomy, lighting=c.lighting,
                          lines=c.lines, history=hist, below_threshold=not c.passed)
                parts = f"lighting {c.lighting:.1f}, lines {c.lines:.1f}" + (f", anatomy {c.anatomy:.1f}" if c.anatomy is not None else "")
                if c.passed:
                    rec.log("Critic", f"panel {idx + 1} attempt {attempt}: amazement {c.amazement:.2f} ({parts}) ✓ clears {config.AMAZEMENT_THRESHOLD}")
                else:
                    why = c.notes[0] if c.notes else "below threshold"
                    rec.log("Critic", f"panel {idx + 1} attempt {attempt}: amazement {c.amazement:.2f} ({parts}) ✗ {why}")
                    if attempt < self.max_attempts:
                        rec.log("Artist", f"re-prompting panel {idx + 1} (refinement round {attempt})")

            def panel_task(spec) -> None:
                check()
                set_panel(spec.index, state="rendering")
                art = artist.paint_panel(spec, style, sheets, st.format, job_seed, on_attempt, check)
                check()
                art.result.image.save(art_dir / f"panel_{spec.index + 1:02d}.png")
                prompts[spec.index] = art.prompts
                tr.record_score(spec.index, art.critique.amazement)
                if art.below_threshold:
                    rec.log("Artist", f"panel {spec.index + 1} stayed below {config.AMAZEMENT_THRESHOLD} after {art.attempts} attempts; "
                            f"keeping the best ({art.critique.amazement:.2f}) and flagging it", "warn")
                set_panel(spec.index, state="typesetting", score=art.critique.amazement, below_threshold=art.below_threshold,
                          attempts=art.attempts, anatomy=art.critique.anatomy, lighting=art.critique.lighting, lines=art.critique.lines)
                with clock:
                    counters["art"] += 1
                    tr.advance("art", counters["art"], N)
                ts = typesetter.typeset(art.result, spec, st.format)
                if ts.extended_by:
                    rec.log("Typesetter", f"panel {spec.index + 1}: dialogue load was high, added a {ts.extended_by}px caption band")
                ts.image.save(panel_dir / f"panel_{spec.index + 1:02d}.png")
                thumb(ts.image, spec.index)
                results[spec.index] = ts.image
                set_panel(spec.index, state="done")
                with clock:
                    counters["ts"] += 1
                    tr.advance("typeset", counters["ts"], N)
                    if counters["ts"] == N:
                        rec.log("Typesetter", f"all {N} panels lettered")

            rec.log("Orchestrator", f"rendering {N} panels in parallel ({self.panel_workers} workers)")
            with ThreadPoolExecutor(self.panel_workers, thread_name_prefix="forge-panel") as ex:
                futs = [ex.submit(panel_task, sp) for sp in script.panels]
                try:
                    for f in futs:
                        f.result()
                except BaseException:
                    for f in futs:
                        f.cancel()
                    rec.cancel.set()      # stops running siblings at their next checkpoint
                    raise
            (rec.work_dir / "prompts.json").write_text(json.dumps({str(k): v for k, v in sorted(prompts.items())}, indent=1), encoding="utf-8")
            check()

            # ---------------- 4. Assembly
            self._stage(rec, "assembly")
            images = [results[sp.index] for sp in script.panels]
            layout = Assembler().assemble(script.panels, images, st.format, rec.out_dir)
            rec.log("Assembler", f"{'vertical strip' if st.format == 'webtoon' else 'slide deck'} assembled: {layout.width}x{layout.height}px")
            tr.advance("assembly", 1, 4)
            (rec.out_dir / "script.json").write_text(script.model_dump_json(indent=2), encoding="utf-8")
            (rec.out_dir / "layout.json").write_text(json.dumps(layout.to_json(), indent=1), encoding="utf-8")
            chars_out = rec.out_dir / "characters"
            chars_out.mkdir(exist_ok=True)
            for sh in sheets.values():
                for ext in (".json", ".png"):
                    src = bank.dir / f"{slug(sh.name)}{ext}"
                    if src.exists():
                        shutil.copy2(src, chars_out / src.name)
            tr.advance("assembly", 2, 4)
            write_reader(rec.out_dir, script, layout, rec.state.title)
            rec.log("Assembler", "reader built (reader/index.html)")
            tr.advance("assembly", 3, 4)
            rec.mutate(lambda s: s.outputs.update({"format": st.format, "strip": layout.strip_path, "slides": layout.slide_paths,
                                                    "pdf": layout.pdf_path, "reader": "reader/index.html", "panel_count": N}))
            rec.log("Orchestrator", f"pipeline finished in {time.time() - t0:.1f}s; closing assembly")
            tr.advance("assembly", 4, 4)       # -> exactly 95%: raises HaltSignal
            # unreachable while the 95% rule is armed (it always fires here); kept so a re-configured threshold still finishes
            self._finish(rec, tr, script, layout)
        except HaltSignal as h:
            self._hard_save(rec, tr, h, script, layout)

    # ------------------------------------------------------------------ 95% hard save
    def _hard_save(self, rec: JobRecord, tr: ProgressTracker, h: HaltSignal, script, layout: Optional[Layout]) -> None:
        rec.log("Orchestrator", f"HALT: {h.reason}. Executing hard save.", "warn")
        halted = {"reason": h.reason, "progress": float(h.progress), "confidence": float(h.confidence), "at": time.time()}
        notes = ["Final polish (last 5%) was intentionally not run: the 95% rule halts execution until a human instructs otherwise."]
        if layout is None:
            notes.append("Layout was not assembled before the halt; the package contains the panels rendered so far.")
        self._package(rec, script, layout, halted, finalized=False, notes=notes)
        rec.mutate(lambda s: (setattr(s, "status", "halted"), setattr(s, "stage", "halted"), setattr(s, "halt_reason", h.reason),
                              s.outputs.update({"halted_at": halted["at"]})))
        rec.log("Orchestrator", "hard save complete (chapter.zip + completion summary written). Execution is HALTED; awaiting manual instruction.", "warn")

    def _package(self, rec: JobRecord, script, layout, halted: Optional[dict], finalized: bool, notes: list[str]) -> None:
        st = rec.state
        events = [e.model_dump() for e in rec.events]
        if script is None:     # halted before a script existed (should not happen); nothing to summarise beyond state
            from .models import Script
            script = Script(title=st.title)
        if layout is None:
            layout = Layout(st.format, config.STRIP_WIDTH, 0)
        write_summary(rec.out_dir, st, script, layout, events, halted, finalized, notes)
        name = f"{slug(st.title, 'chapter')}-chapter"
        z = make_zip(rec.dir, rec.out_dir, name)
        rec.mutate(lambda s: s.outputs.update({"zip": z.name, "zip_bytes": z.stat().st_size, "summary": "completion_summary.md"}))

    # ------------------------------------------------------------------ manual finalize (the last 5%)
    def _finalize(self, rec: JobRecord, instruction: str) -> None:
        st = rec.state
        tr = self._tracker(rec)
        tr.restore(st.stage_progress, {p.index: p.score for p in st.panels if p.score is not None})
        tr.disarm()
        rec.log("Orchestrator", "running final polish (last 5%)")
        script = json.loads((rec.out_dir / "script.json").read_text(encoding="utf-8"))
        from .models import Script
        script = Script.model_validate(script)
        lay = json.loads((rec.out_dir / "layout.json").read_text(encoding="utf-8"))
        layout = Layout(lay["format"], lay["width"], lay["height"], [], lay.get("strip", ""), lay.get("slides", []), lay.get("pdf", ""))
        issues: list[str] = []

        # 1. optimise images
        pngs = sorted((rec.out_dir / "panels").glob("*.png"))
        for i, p in enumerate(pngs):
            Image.open(p).convert("RGB").save(p, optimize=True)
            tr.advance("polish", i + 1, len(pngs) * 3)
        rec.log("Orchestrator", f"polish 1/3: optimised {len(pngs)} panel files")
        # 2. validate the package
        need = [rec.out_dir / "reader" / "index.html", rec.out_dir / "script.json", rec.out_dir / "layout.json"]
        need += [rec.out_dir / (lay.get("strip") or "")] if lay.get("strip") else [rec.out_dir / s for s in lay.get("slides", [])]
        for p in need:
            if not p.exists() or p.stat().st_size == 0:
                issues.append(f"missing or empty: {p.relative_to(rec.out_dir)}")
        for e in lay.get("panels", []):
            if not (rec.out_dir / "panels" / f"panel_{e['index'] + 1:02d}.png").exists():
                issues.append(f"missing panel {e['index'] + 1}")
        tr.advance("polish", len(pngs) * 2, len(pngs) * 3)
        rec.log("Orchestrator", "polish 2/3: package validated" + (f" ({len(issues)} issue(s): {'; '.join(issues)})" if issues else " (no issues)"), "warn" if issues else "info")
        # 3. readme + final summary + zip
        (rec.out_dir / "README.txt").write_text(
            f"{st.title}\n{'=' * len(st.title)}\n\nOpen reader/index.html in a browser to read the chapter.\n"
            f"{'strip.jpg is the full vertical-scroll image.' if st.format == 'webtoon' else 'slides/ and slides.pdf hold the deck.'}\n"
            "panels/ holds each lettered panel; characters/ holds the reference sheets used for consistency; script.json is the panel script.\n"
            "completion_summary.md records scores and the generation log.\n", encoding="utf-8")
        tr.advance("polish", max(len(pngs), 1) * 3, max(len(pngs), 1) * 3)
        notes = [f"Manual instruction: {instruction or 'finalize'}", "Final polish completed after the 95% halt."] + issues
        self._package(rec, script, layout, {"reason": st.halt_reason}, finalized=True, notes=notes)
        self._finish_state(rec, tr)

    def _finish(self, rec, tr, script, layout) -> None:
        self._package(rec, script, layout, None, finalized=True, notes=[])
        self._finish_state(rec, tr)

    def _finish_state(self, rec: JobRecord, tr: ProgressTracker) -> None:
        tr.advance("polish", 1, 1)
        rec.mutate(lambda s: (setattr(s, "status", "completed"), setattr(s, "stage", "completed")))
        rec.log("Orchestrator", "chapter complete (100%)")
