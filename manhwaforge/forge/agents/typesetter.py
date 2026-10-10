"""Agent 3 (part 1): the Typesetter. Letters a finished panel: speech / thought / shout / whisper
bubbles with tails to the speaker, caption boxes, and sound-effect typography.

Placement is collision-aware: bubbles are scored against the face boxes reported by the renderer,
against each other, and against the speaker's position, in reading order. If a panel simply has no
room for its text, the panel is extended with a caption band rather than covering a face.
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from typing import Optional

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from ..models import Dialogue, PanelSpec
from ..render.panel import FigureMeta, RenderResult
from ..render.util import get_font

Box = tuple[float, float, float, float]

SFX_COLORS = {
    "hit": ((255, 72, 40), (40, 6, 6)),
    "slash": ((250, 250, 250), (20, 20, 60)),
    "magic": ((120, 220, 255), (10, 30, 80)),
    "soft": ((255, 255, 255), (50, 50, 70)),
    "default": ((255, 214, 64), (40, 20, 6)),
}
_SFX_KIND = {
    "hit": ("boom", "crash", "bang", "smash", "thud", "slam", "wham", "crack", "thump", "explo", "kaboom", "pow"),
    "slash": ("slash", "swish", "swoosh", "shing", "clang", "whoosh", "zip", "slice", "clash"),
    "magic": ("zap", "hum", "glow", "spark", "whirr", "fwoom", "crackle", "ding"),
    "soft": ("tap", "drip", "creak", "click", "rustle", "pat", "tick", "sigh", "step", "whisper", "knock", "patter"),
}


def sfx_kind(text: str) -> str:
    t = text.lower()
    for k, words in _SFX_KIND.items():
        if any(w in t for w in words):
            return k
    return "default"


@dataclass
class Placed:
    kind: str
    box: Box
    text: str = ""


@dataclass
class TypesetResult:
    image: Image.Image
    placed: list[Placed] = field(default_factory=list)
    extended_by: int = 0


def _overlap(a: Box, b: Box) -> float:
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    return ix * iy


def _wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_w: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


class Typesetter:
    name = "Typesetter"

    def typeset(self, art: RenderResult | Image.Image, spec: PanelSpec, fmt: str = "webtoon") -> TypesetResult:
        if isinstance(art, Image.Image):
            image, figs = art, []
        else:
            image, figs = art.image, art.figures
        img = image.convert("RGB").copy()
        W, H = img.size
        scale = W / 800.0 if fmt == "webtoon" else W / 1280.0 * 1.25
        base_font = max(15, int(round(21 * scale)))
        rng = random.Random(spec.index * 7919 + 13)
        placed: list[Placed] = []
        faces = [f.head_box for f in figs]
        extended = 0

        # captions first (top / bottom edges), then dialogue in reading order, then SFX
        captions = [d for d in spec.dialogue if d.kind == "caption"]
        talk = [d for d in spec.dialogue if d.kind != "caption"]
        items: list[tuple[Dialogue, str]] = [(d, "caption") for d in captions] + [(d, d.kind) for d in talk]

        # estimate whether everything can fit; if the text load is high, reserve a band up-front
        band = self._band_needed(img, items, base_font, W, H)
        if band:
            img = self._extend(img, band)
            extended = band
            H = img.height
        draw = ImageDraw.Draw(img, "RGBA")

        prev_center: Optional[tuple[float, float]] = None
        cap_top = 0
        cap_bottom = 0
        for d, kind in items:
            if not d.text:
                continue
            # Text is never dropped: if there is no room, the panel grows a caption band and we try again.
            for _ in range(8):
                if kind == "caption":
                    box = self._caption(draw, d.text, base_font, W, H, cap_top, cap_bottom, H - extended)
                    if box:
                        placed.append(Placed("caption", box, d.text))
                        if box[1] < (H - extended) * 0.5:
                            cap_top = int(box[3]) - 14 + 6
                        else:
                            cap_bottom = int(H - box[1]) - 14 + 6
                        break
                else:
                    speaker = next((f for f in figs if f.name == d.speaker), None) if d.speaker else None
                    pbox = self._bubble(draw, d, kind, base_font, W, H, faces, [p.box for p in placed], speaker,
                                        prev_center, cap_top, rng)
                    if pbox:
                        placed.append(Placed(kind, pbox, d.text))
                        prev_center = ((pbox[0] + pbox[2]) / 2, (pbox[1] + pbox[3]) / 2)
                        break
                grow = max(int(base_font * 6), 140)
                img = self._extend(img, grow)
                extended += grow
                H = img.height
                draw = ImageDraw.Draw(img, "RGBA")

        sfx_font_base = int(round(78 * scale * (1.25 if spec.pacing == "impact" else 1.0)))
        for i, text in enumerate(spec.sfx[:3]):
            box = None
            for shrink in (1.0, 0.78, 0.6):     # an effect is never silently dropped: retry smaller first
                box = self._sfx(img, text, int(sfx_font_base * shrink), W, H - extended, faces, [p.box for p in placed], rng, i, spec.pacing)
                if box:
                    break
            if box:
                placed.append(Placed("sfx", box, text))
        return TypesetResult(img, placed, extended)

    # ------------------------------------------------------------------ band
    def _band_needed(self, img: Image.Image, items, font_px: int, W: int, H: int) -> int:
        """Rough capacity check: if the dialogue would cover more than ~30% of the panel, add a caption band."""
        if not items:
            return 0
        d = ImageDraw.Draw(img)
        font = get_font("bold", font_px)
        area = 0.0
        for dlg, kind in items:
            lines = _wrap(d, dlg.text, font, W * 0.4)
            w = max(d.textlength(l, font=font) for l in lines) * 1.3 + 30
            h = len(lines) * font_px * 1.22 * 1.38 + 30
            area += w * h
        if area <= 0.42 * W * H:
            return 0
        return int(min(H * 0.5, (area - 0.42 * W * H) / W + font_px * 3))

    @staticmethod
    def _extend(img: Image.Image, band: int) -> Image.Image:
        W, H = img.size
        out = Image.new("RGB", (W, H + band), (14, 12, 22))
        out.paste(img, (0, 0))
        return out

    # ------------------------------------------------------------------ captions
    def _caption(self, draw, text, font_px, W, H, cap_top, cap_bottom, orig_h) -> Optional[Box]:
        font = get_font("regular", int(font_px * 0.95))
        lines = _wrap(draw, text, font, W * 0.62 - 28)
        tw = max(draw.textlength(l, font=font) for l in lines)
        lh = font_px * 1.25
        bw, bh = tw + 28, len(lines) * lh + 18
        if 14 + cap_top + bh <= orig_h * 0.42:
            x0, y0 = 14, 14 + cap_top
        else:
            x0, y0 = 14, H - bh - 14 - cap_bottom
        if y0 + bh > H or y0 < 0:
            return None
        draw.rectangle([x0 + 3, y0 + 3, x0 + bw + 3, y0 + bh + 3], fill=(0, 0, 0, 90))
        draw.rectangle([x0, y0, x0 + bw, y0 + bh], fill=(252, 247, 220, 255), outline=(20, 18, 28, 255), width=2)
        for i, l in enumerate(lines):
            draw.text((x0 + 14, y0 + 9 + i * lh), l, font=font, fill=(24, 22, 30, 255))
        return (x0, y0, x0 + bw, y0 + bh)

    # ------------------------------------------------------------------ bubbles
    def _bubble(self, draw: ImageDraw.ImageDraw, d: Dialogue, kind: str, font_px: int, W: int, H: int, faces: list[Box],
                taken: list[Box], speaker: Optional[FigureMeta], prev_center, cap_top: int,
                rng: random.Random) -> Optional[Box]:
        text = d.text.upper() if kind == "shout" else d.text
        fkind = {"shout": "heavy", "whisper": "regular", "thought": "regular"}.get(kind, "bold")
        size = font_px * (1.15 if kind == "shout" else 0.86 if kind == "whisper" else 1.0)
        font = get_font(fkind, int(size))
        # shrink-to-fit
        for _ in range(6):
            lines = _wrap(draw, text, font, W * (0.42 if kind != "shout" else 0.5))
            tw = max(draw.textlength(l, font=font) for l in lines)
            lh = size * 1.22
            th = len(lines) * lh
            if tw <= W * 0.5 and th <= H * 0.4:
                break
            size *= 0.88
            font = get_font(fkind, max(11, int(size)))
        pad = size * 0.6
        if kind in ("speech", "whisper", "thought"):
            bw, bh = tw * 1.30 + pad * 1.6, th * 1.38 + pad * 1.4
        elif kind == "shout":
            bw, bh = tw * 1.42 + pad * 2.0, th * 1.6 + pad * 2.0
        else:
            bw, bh = tw + pad * 2, th + pad * 2
        margin = 10
        step = max(10, int(min(W, H) / 40))
        target = None
        if speaker is not None:
            fb = speaker.face_box
            target = ((fb[0] + fb[2]) / 2, fb[1] + (fb[3] - fb[1]) * 0.72)
        best, best_score = None, 1e18
        avail_top = cap_top + margin
        y_range = range(int(avail_top + bh / 2), int(max(H, bh + 2 * margin) - bh / 2 - margin + 1), step) or range(int(H / 2), int(H / 2) + 1)
        x_range = range(int(margin + bw / 2), int(W - margin - bw / 2) + 1, step) or range(int(W / 2), int(W / 2) + 1)
        for cy in y_range:
            for cx in x_range:
                box = (cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2)
                score = 0.0
                if any(_overlap(box, t) > 0 or self._near(box, t, 6) for t in taken):
                    continue
                for f in faces:
                    score += 9.0 * _overlap(box, f) / max(1.0, (f[2] - f[0]) * (f[3] - f[1]))
                if score > 0.6:
                    continue
                score += 0.0012 * cy                      # prefer the upper part of the panel
                if target is not None:
                    dist = math.hypot(cx - target[0], cy - target[1])
                    score += 0.009 * dist
                    if cy > target[1]:
                        score += 1.5                      # bubble should sit above the speaker's mouth
                if prev_center is not None:               # reading order: later bubbles below / right of earlier ones
                    if cy < prev_center[1] - 8:
                        score += 2.0
                    if abs(cy - prev_center[1]) < bh * 0.8 and cx < prev_center[0]:
                        score += 1.0
                if score < best_score:
                    best, best_score = box, score
        if best is None:
            return None
        self._draw_bubble(draw, best, kind, lines, font, size, target)
        return best

    @staticmethod
    def _near(a: Box, b: Box, gap: float) -> bool:
        return not (a[2] + gap < b[0] or b[2] + gap < a[0] or a[3] + gap < b[1] or b[3] + gap < a[1])

    def _draw_bubble(self, draw: ImageDraw.ImageDraw, box: Box, kind: str, lines: list[str], font, size: float,
                     target: Optional[tuple[float, float]]) -> None:
        x0, y0, x1, y1 = box
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        rx, ry = (x1 - x0) / 2, (y1 - y0) / 2
        ink = (16, 14, 24, 255)
        lw = max(3, int(size * 0.14))
        white = (255, 255, 255, 255)

        def tail_polygon(inflate: float):
            """Short stub from the bubble edge toward the speaker; it stops before the head, never crosses it."""
            if target is None:
                return None
            ang = math.atan2(target[1] - cy, target[0] - cx)
            ca, sa = math.cos(ang), math.sin(ang)
            edge_r = rx * ry / math.sqrt((ry * ca) ** 2 + (rx * sa) ** 2)     # ellipse radius along this direction
            dist = math.hypot(target[0] - cx, target[1] - cy)
            length = max(size * 0.7, min(size * 1.5, dist - edge_r - size * 1.4))
            bx, by = cx + ca * (edge_r - size * 0.25), cy + sa * (edge_r - size * 0.25)
            tipx, tipy = cx + ca * (edge_r + length), cy + sa * (edge_r + length)
            nx, ny = -sa, ca
            hw = size * 0.42 + inflate
            return [(bx + nx * hw, by + ny * hw), (tipx, tipy), (bx - nx * hw, by - ny * hw)]

        if kind in ("speech", "whisper"):
            dashed = kind == "whisper"
            tail_b, tail_w = tail_polygon(lw), tail_polygon(0)
            if not dashed:
                draw.ellipse([x0 - lw, y0 - lw, x1 + lw, y1 + lw], fill=ink)
                if tail_b:
                    draw.polygon(tail_b, fill=ink)
                draw.ellipse([x0, y0, x1, y1], fill=white)
                if tail_w:
                    draw.polygon(tail_w, fill=white)
            else:
                draw.ellipse([x0, y0, x1, y1], fill=(255, 255, 255, 235))
                if tail_w:
                    draw.polygon(tail_w, fill=(255, 255, 255, 235))
                for a in range(0, 360, 14):
                    a0, a1 = math.radians(a), math.radians(a + 8)
                    pts = [(cx + math.cos(t) * rx, cy + math.sin(t) * ry) for t in (a0, (a0 + a1) / 2, a1)]
                    draw.line(pts, fill=ink, width=max(2, lw - 1))
        elif kind == "thought":
            n = 14
            for i in range(n):
                a = 2 * math.pi * i / n
                px, py = cx + math.cos(a) * rx * 0.88, cy + math.sin(a) * ry * 0.88
                r = size * 0.62
                draw.ellipse([px - r - lw, py - r - lw, px + r + lw, py + r + lw], fill=ink)
            draw.ellipse([x0 + size * 0.2 - lw, y0 + size * 0.2 - lw, x1 - size * 0.2 + lw, y1 - size * 0.2 + lw], fill=ink)
            for i in range(n):
                a = 2 * math.pi * i / n
                px, py = cx + math.cos(a) * rx * 0.88, cy + math.sin(a) * ry * 0.88
                r = size * 0.62
                draw.ellipse([px - r, py - r, px + r, py + r], fill=white)
            draw.ellipse([x0 + size * 0.2, y0 + size * 0.2, x1 - size * 0.2, y1 - size * 0.2], fill=white)
            if target is not None:
                ang = math.atan2(target[1] - cy, target[0] - cx)
                for k, r in enumerate((size * 0.42, size * 0.3, size * 0.2)):
                    dd = max(rx, ry) + size * (0.9 + 0.95 * k)
                    px, py = cx + math.cos(ang) * dd, cy + math.sin(ang) * dd
                    draw.ellipse([px - r - lw * 0.7, py - r - lw * 0.7, px + r + lw * 0.7, py + r + lw * 0.7], fill=ink)
                    draw.ellipse([px - r, py - r, px + r, py + r], fill=white)
        elif kind == "shout":
            n = 18
            outer, inner = [], []
            for i in range(n * 2):
                a = math.pi * i / n
                f = 1.0 if i % 2 == 0 else 0.78
                outer.append((cx + math.cos(a) * rx * 1.08 * f, cy + math.sin(a) * ry * 1.08 * f))
                inner.append((cx + math.cos(a) * rx * 1.08 * f, cy + math.sin(a) * ry * 1.08 * f))
            draw.polygon(outer, fill=ink)
            shrunk = [(cx + (px - cx) * 0.94, cy + (py - cy) * 0.94) for px, py in outer]
            draw.polygon(shrunk, fill=(255, 252, 235, 255))
        # text
        lh = size * 1.22
        total = len(lines) * lh
        ty = cy - total / 2 + (size * 0.04)
        for l in lines:
            tw = draw.textlength(l, font=font)
            col = (24, 22, 30, 255) if kind != "whisper" else (80, 80, 96, 255)
            draw.text((cx - tw / 2, ty), l, font=font, fill=col)
            ty += lh

    # ------------------------------------------------------------------ sound effects
    def _sfx(self, img: Image.Image, text: str, font_px: int, W: int, H: int, faces: list[Box], taken: list[Box],
             rng: random.Random, i: int, pacing: str) -> Optional[Box]:
        text = text.strip().upper()
        if not text:
            return None
        kind = sfx_kind(text)
        fill, edge = SFX_COLORS[kind]
        size = int(font_px * (0.62 if kind == "soft" else 1.0) * (1.0 if len(text) < 8 else 8.0 / len(text) * 1.2))
        size = max(24, min(size, int(W * 0.24)))
        font = get_font("heavy", size)
        probe = ImageDraw.Draw(img)
        tw = probe.textlength(text, font=font)
        pad = int(size * 0.35)
        tile = Image.new("RGBA", (int(tw + pad * 2 + size * 0.3), int(size * 1.35 + pad * 0.6)), (0, 0, 0, 0))
        td = ImageDraw.Draw(tile)
        sw = max(3, size // 9)
        x, y = pad, int(size * 0.02)
        td.text((x + sw, y + sw), text, font=font, fill=(0, 0, 0, 150), stroke_width=sw, stroke_fill=(0, 0, 0, 150))  # drop shadow
        td.text((x, y), text, font=font, fill=fill + (255,), stroke_width=sw, stroke_fill=edge + (255,))
        if kind in ("hit", "slash"):   # stretch for punch
            tile = tile.resize((int(tile.width * 1.12), int(tile.height * 0.94)), Image.LANCZOS)
        ang = rng.uniform(-14, 14) if kind != "soft" else rng.uniform(-6, 6)
        tile = tile.rotate(ang, expand=True, resample=Image.BICUBIC)
        tw2, th2 = tile.size
        best, best_score = None, 1e18
        step = max(12, int(min(W, H) / 30))
        for cy in range(int(th2 / 2), int(max(H - th2 / 2, th2 / 2 + 1)), step):
            for cx in range(int(tw2 / 2), int(max(W - tw2 / 2, tw2 / 2 + 1)), step):
                box = (cx - tw2 / 2, cy - th2 / 2, cx + tw2 / 2, cy + th2 / 2)
                if any(_overlap(box, t) > 0 for t in taken):
                    continue
                score = sum(12.0 * _overlap(box, f) / max(1.0, (f[2] - f[0]) * (f[3] - f[1])) for f in faces)
                # SFX likes the lower half and the edges (it frames the action instead of hiding it)
                score += 0.5 * (1 - cy / H) + 0.4 * (1 - abs(cx - W / 2) / (W / 2)) + 0.1 * i
                if score < best_score:
                    best, best_score = box, score
        if best is None:
            return None
        img.paste(tile, (int(best[0]), int(best[1])), tile)
        return best
