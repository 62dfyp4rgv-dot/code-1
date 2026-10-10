"""Agent 3 (part 2): the Assembly editor. Stitches typeset panels into the final reading layout.

webtoon: one continuous vertical strip, 800px wide, with pacing-driven gutters (a breath of space
         before a reveal, tight cuts through action) and occasional inset panels for rhythm.
slides:  a 16:9 deck, one panel per slide, letterboxed.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, ImageDraw

from .. import config
from ..models import PanelSpec

PAPER = (250, 249, 246)


@dataclass
class LayoutEntry:
    index: int
    y: int
    x: int
    w: int
    h: int
    gutter_after: int
    inset: bool = False


@dataclass
class Layout:
    format: str
    width: int
    height: int
    entries: list[LayoutEntry] = field(default_factory=list)
    strip_path: str = ""
    slide_paths: list[str] = field(default_factory=list)
    pdf_path: str = ""

    def to_json(self) -> dict:
        return {"format": self.format, "width": self.width, "height": self.height, "strip": self.strip_path,
                "slides": self.slide_paths, "pdf": self.pdf_path,
                "panels": [e.__dict__ for e in self.entries]}


def _gutter(spec: PanelSpec, nxt: PanelSpec | None) -> int:
    base = {"slow": 190, "impact": 36, "beat": 22, "normal": 64}.get(spec.pacing, 64)
    if nxt is not None:
        if nxt.location != spec.location or nxt.time_of_day != spec.time_of_day:
            base = max(base, 230)          # scene change: let the page breathe
        if nxt.pacing == "impact" and spec.pacing != "impact":
            base = max(base, 120)          # silence before the hit
    return base


class Assembler:
    name = "Assembler"

    def assemble(self, specs: list[PanelSpec], images: list[Image.Image], fmt: str, out_dir: Path) -> Layout:
        out_dir.mkdir(parents=True, exist_ok=True)
        if fmt == "slides":
            return self._slides(specs, images, out_dir)
        return self._strip(specs, images, out_dir)

    # ------------------------------------------------------------------ webtoon
    def _strip(self, specs, images, out_dir: Path) -> Layout:
        W = config.STRIP_WIDTH
        top_pad, bottom_pad = 40, 260
        placed: list[tuple[Image.Image, LayoutEntry]] = []
        y = top_pad
        inset_side = 1
        for i, (spec, img) in enumerate(zip(specs, images)):
            img = img.convert("RGB")
            inset = spec.pacing == "beat" and i not in (0, len(specs) - 1) and spec.shot not in ("establishing", "wide")
            if img.width != W:
                img = img.resize((W, round(img.height * W / img.width)), Image.LANCZOS)
            x = 0
            if inset:
                nw = int(W * 0.8)
                img = img.resize((nw, round(img.height * nw / img.width)), Image.LANCZOS)
                x = (W - nw) if inset_side > 0 else 0
                inset_side *= -1
            g = _gutter(spec, specs[i + 1] if i + 1 < len(specs) else None)
            entry = LayoutEntry(spec.index, y, x, img.width, img.height, g, inset)
            placed.append((img, entry))
            y += img.height + g
        H = y - (placed[-1][1].gutter_after if placed else 0) + bottom_pad
        canvas = Image.new("RGB", (W, H), PAPER)
        d = ImageDraw.Draw(canvas)
        for img, e in placed:
            canvas.paste(img, (e.x, e.y))
            if e.inset:
                d.rectangle([e.x, e.y, e.x + e.w - 1, e.y + e.h - 1], outline=(20, 18, 28), width=3)
        lay = Layout("webtoon", W, H, [e for _, e in placed])
        strip = out_dir / "strip.jpg"
        canvas.save(strip, quality=92, optimize=True)
        lay.strip_path = strip.name
        return lay

    # ------------------------------------------------------------------ slides
    def _slides(self, specs, images, out_dir: Path) -> Layout:
        SW, SH = config.SLIDE_SIZE
        sl_dir = out_dir / "slides"
        sl_dir.mkdir(exist_ok=True)
        lay = Layout("slides", SW, SH)
        slides: list[Image.Image] = []
        for i, (spec, img) in enumerate(zip(specs, images)):
            img = img.convert("RGB")
            scale = min(SW / img.width, SH / img.height)
            if abs(scale - 1.0) > 1e-3:
                img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
            canvas = Image.new("RGB", (SW, SH), (12, 11, 18))
            canvas.paste(img, ((SW - img.width) // 2, (SH - img.height) // 2))
            ImageDraw.Draw(canvas).rectangle([0, SH - 6, int(SW * (i + 1) / len(images)), SH], fill=(255, 190, 70))
            path = sl_dir / f"slide_{i + 1:02d}.jpg"
            canvas.save(path, quality=92)
            lay.slide_paths.append(f"slides/{path.name}")
            lay.entries.append(LayoutEntry(spec.index, 0, 0, SW, SH, 0))
            slides.append(canvas)
        if slides:
            pdf = out_dir / "slides.pdf"
            slides[0].save(pdf, save_all=True, append_images=slides[1:], resolution=96.0)
            lay.pdf_path = pdf.name
        lay.height = SH
        return lay
