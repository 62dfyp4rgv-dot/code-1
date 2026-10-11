"""ManhwaForge Studio HTTP API + dashboard host.  Run:  uvicorn forge.app:app"""
from __future__ import annotations

import io
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

from . import __version__, config
from .ingest import safe_filename
from .orchestrator import Orchestrator
from .store import JobStore
from .styles import PRESETS

SERVED_PREFIXES = ("output/", "work/thumbs/", "work/art/")


class ResumeBody(BaseModel):
    instruction: str = ""
    action: str = "finalize"        # finalize | cancel


def create_app(store: Optional[JobStore] = None, orchestrator: Optional[Orchestrator] = None) -> FastAPI:
    store = store or JobStore()
    orch = orchestrator or Orchestrator(store)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        yield
        orch.shutdown()

    app = FastAPI(title="ManhwaForge Studio", version=__version__, lifespan=lifespan)

    # ------------------------------------------------------------------ meta
    @app.get("/api/health")
    def health():
        return {"ok": True, "version": __version__, "amazement_threshold": config.AMAZEMENT_THRESHOLD, "halt_at": config.HALT_AT,
                "max_refine_attempts": config.MAX_REFINE_ATTEMPTS, "llm_director": bool(config.ANTHROPIC_API_KEY),
                "image_provider": orch.provider.name, "jobs": len(store.list())}

    @app.get("/api/styles")
    def styles():
        return [{"key": k, "name": s.name, "description": s.description} for k, s in PRESETS.items()]

    # ------------------------------------------------------------------ jobs
    @app.post("/api/jobs")
    async def create_job(story: str = Form(""), title: str = Form(""), format: str = Form("webtoon"), style: str = Form("auto"),
                         panels: int = Form(12), series: str = Form(""), files: list[UploadFile] = File(default=[])):
        if format not in ("webtoon", "slides"):
            raise HTTPException(400, "format must be 'webtoon' or 'slides'")
        if style != "auto" and style not in PRESETS:
            raise HTTPException(400, f"style must be 'auto' or one of: {', '.join(PRESETS)}")
        panels = max(config.MIN_PANELS, min(config.MAX_PANELS, panels))
        files = [f for f in files if f and f.filename]
        if len(files) > config.MAX_FILES:
            raise HTTPException(400, f"too many files (max {config.MAX_FILES})")

        blobs: list[tuple[str, bytes]] = []
        total = 0
        for f in files:
            ext = Path(f.filename).suffix.lower()
            if ext not in config.TEXT_EXTS | config.IMAGE_EXTS:
                raise HTTPException(400, f"unsupported file type '{ext or f.filename}'. Supported: text/markdown/json scripts and "
                                         f"png/jpg/webp/gif/bmp sketches")
            data = await f.read(config.MAX_FILE_BYTES + 1)
            if len(data) > config.MAX_FILE_BYTES:
                raise HTTPException(413, f"{f.filename} is larger than {config.MAX_FILE_BYTES // 1024 // 1024} MB")
            total += len(data)
            if total > config.MAX_TOTAL_BYTES:
                raise HTTPException(413, "total upload too large")
            if ext in config.IMAGE_EXTS:
                try:
                    with Image.open(io.BytesIO(data)) as im:
                        im.verify()
                except Exception:
                    raise HTTPException(400, f"{f.filename} is not a valid image")
            blobs.append((safe_filename(f.filename), data))

        has_text = bool(story.strip()) or any(Path(n).suffix.lower() in config.TEXT_EXTS and d.strip() for n, d in blobs)
        if not has_text:
            raise HTTPException(400, "give the Director something to work from: a story description or a script file. "
                                     "Sketches steer composition, palette and style but cannot replace the story.")

        rec = store.create(title=title.strip()[:120], format=format, style_request=style, series=series.strip()[:60], target_panels=panels)
        if story.strip():
            (rec.inputs_dir / "00_story.txt").write_text(story.strip(), encoding="utf-8")
        for i, (name, data) in enumerate(blobs, 1):
            (rec.inputs_dir / f"{i:02d}_{name}").write_bytes(data)
        orch.submit(rec)
        return {"id": rec.state.id}

    @app.get("/api/jobs")
    def list_jobs():
        out = []
        for r in store.list():
            s = r.snapshot()
            out.append({k: s[k] for k in ("id", "title", "status", "stage", "format", "progress", "confidence", "created", "mean_amazement")}
                       | {"panels": len(s["panels"])})
        return out

    def _rec(jid: str):
        r = store.get(jid)
        if r is None:
            raise HTTPException(404, "no such job")
        return r

    @app.get("/api/jobs/{jid}")
    def get_job(jid: str):
        r = _rec(jid)
        snap = r.snapshot()
        snap["event_count"] = len(r.events)
        return snap

    @app.get("/api/jobs/{jid}/events")
    def get_events(jid: str, since: int = 0):
        r = _rec(jid)
        return {"events": r.events_since(max(0, since))}

    @app.post("/api/jobs/{jid}/resume")
    def resume(jid: str, body: ResumeBody):
        r = _rec(jid)
        if body.action not in ("finalize", "cancel"):
            raise HTTPException(400, "action must be 'finalize' or 'cancel'")
        try:
            orch.resume(r, body.instruction.strip()[:500], body.action)
        except ValueError as e:
            raise HTTPException(409, str(e))
        return {"ok": True, "status": r.state.status}

    @app.get("/api/jobs/{jid}/download")
    def download(jid: str):
        r = _rec(jid)
        name = r.state.outputs.get("zip")
        path = (r.dir / name) if name else None
        if not path or not path.exists():
            raise HTTPException(404, "no package yet: the hard save has not happened")
        return FileResponse(path, media_type="application/zip", filename=path.name)

    @app.get("/api/jobs/{jid}/files/{path:path}")
    def get_file(jid: str, path: str):
        r = _rec(jid)
        if not path.startswith(SERVED_PREFIXES) or ".." in path.replace("\\", "/").split("/"):
            raise HTTPException(404, "not found")
        target = (r.dir / path).resolve()
        # confine to the *allowed* folders after resolving (symlinks, encoded dots, anything), not merely to the job dir
        roots = [(r.dir / p.rstrip("/")).resolve() for p in SERVED_PREFIXES]
        if not any(target.is_relative_to(root) for root in roots) or not target.is_file():
            raise HTTPException(404, "not found")
        return FileResponse(target, headers={"Cache-Control": "no-cache"})

    @app.exception_handler(Exception)
    async def unhandled(_, exc: Exception):   # never leak a traceback to the client
        return JSONResponse({"detail": "internal error"}, status_code=500)

    if config.WEB_DIR.exists():
        app.mount("/", StaticFiles(directory=config.WEB_DIR, html=True), name="web")
    return app


def __getattr__(name: str):
    """`uvicorn forge.app:app` builds the app lazily, so importing this module has no side effects."""
    if name == "app":
        global _app
        try:
            return _app
        except NameError:
            _app = create_app()
            return _app
    raise AttributeError(name)
