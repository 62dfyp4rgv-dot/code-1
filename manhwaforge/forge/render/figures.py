"""Procedural character illustration driven by a persistent CharacterSheet.

Every panel redraws the character from the same sheet, which is what keeps hair, skin,
outfit, eyes and proportions identical from panel to panel.
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from ..models import CharacterSheet, StyleProfile
from .util import RGB, mix, shade, smooth_closed, smooth_open

INK: RGB = (18, 16, 28)

# --------------------------------------------------------------------------- expressions
EXPRESSIONS: dict[str, dict] = {
    "neutral":    dict(eye=1.0, tilt=0.0, lift=0.0, mouth="flat"),
    "smile":      dict(eye=0.92, tilt=-0.05, lift=0.01, mouth="smile"),
    "laugh":      dict(eye="arc_up", tilt=-0.1, lift=0.03, mouth="open_big"),
    "angry":      dict(eye=0.72, tilt=0.55, lift=-0.01, mouth="grit", veins=True),
    "sad":        dict(eye=0.88, tilt=-0.5, lift=0.02, mouth="frown", tear=True),
    "cry":        dict(eye="arc_down", tilt=-0.55, lift=0.02, mouth="frown_open", tear=True),
    "shock":      dict(eye=1.28, tilt=-0.15, lift=0.04, mouth="o", small_pupil=True, sweat=True),
    "fear":       dict(eye=1.2, tilt=-0.4, lift=0.03, mouth="wavy", small_pupil=True, sweat=True),
    "smirk":      dict(eye=0.82, tilt=0.18, lift=0.0, mouth="smirk", brow_one=True),
    "determined": dict(eye=0.78, tilt=0.3, lift=-0.01, mouth="firm"),
    "shy":        dict(eye=0.95, tilt=-0.2, lift=0.01, mouth="small_smile", blush=True, look=-0.6),
    "sleepy":     dict(eye="arc_down", tilt=0.0, lift=0.0, mouth="flat"),
    "worried":    dict(eye=0.95, tilt=-0.35, lift=0.02, mouth="wavy_small", sweat=True),
    "cold":       dict(eye=0.7, tilt=0.12, lift=0.0, mouth="flat"),
}
_EXPR_KEYS = {
    "smile": ("smil", "happy", "grin", "warm", "joy", "cheer", "gentle", "kind", "relieved"),
    "laugh": ("laugh", "giggl", "cackl", "chuckl"),
    "angry": ("angr", "furious", "rage", "glare", "scowl", "snarl", "enrag", "yell", "shout", "growl"),
    "sad": ("sad", "sorrow", "grief", "mourn", "lonely", "melanchol", "heartbr", "despair", "dejected"),
    "cry": ("cry", "weep", "sob", "tears", "tearful"),
    "shock": ("shock", "surpris", "stun", "gasp", "astonish", "startl", "wide-eyed", "stare"),
    "fear": ("fear", "afraid", "terrif", "scared", "panic", "horror", "dread", "trembl"),
    "smirk": ("smirk", "smug", "sly", "sneer", "confident", "cocky", "amused", "mocking"),
    "determined": ("determin", "resolv", "focus", "serious", "steel", "vow", "fierce", "brave", "resolute"),
    "shy": ("shy", "blush", "embarrass", "flustered", "bashful", "nervous"),
    "sleepy": ("sleep", "tired", "weary", "exhaust", "drowsy", "yawn", "faint", "unconscious"),
    "worried": ("worr", "anxious", "uneasy", "concern", "hesitat", "doubt", "uncertain"),
    "cold": ("cold", "stoic", "emotionless", "impassive", "calm", "indifferent", "aloof"),
}


def canonical_expression(text: str) -> str:
    t = (text or "").lower()
    if t in EXPRESSIONS:
        return t
    for key, words in _EXPR_KEYS.items():
        if any(w in t for w in words):
            return key
    return "neutral"


# --------------------------------------------------------------------------- pen
class Pen:
    """Draws to an RGBA layer and a silhouette mask at once, with ink outlines."""

    def __init__(self, layer: Image.Image, mask: Image.Image, lw: int, ink: RGB = INK):
        self.layer, self.mask = layer, mask
        self.d = ImageDraw.Draw(layer)
        self.m = ImageDraw.Draw(mask)
        self.lw, self.ink = lw, ink

    def poly(self, pts, fill: RGB, line: bool = True, alpha: int = 255):
        self.d.polygon(pts, fill=fill + (alpha,))
        self.m.polygon(pts, fill=255)
        if line:
            self.d.line(list(pts) + [pts[0]], fill=self.ink + (255,), width=self.lw, joint="curve")

    def ellipse(self, box, fill: RGB, line: bool = True):
        self.d.ellipse(box, fill=fill + (255,), outline=self.ink + (255,) if line else None, width=self.lw)
        self.m.ellipse(box, fill=255)

    def stroke(self, pts, fill: RGB, width: float, line: bool = True):
        """Thick rounded polyline (limbs) with an ink border."""
        w = max(1, int(width))
        if line:
            ow = w + 2 * self.lw
            self.d.line(pts, fill=self.ink + (255,), width=ow, joint="curve")
            for p in ((pts[-1],) if getattr(self, "no_start_cap", False) else (pts[0], pts[-1])):
                self.d.ellipse([p[0] - ow / 2, p[1] - ow / 2, p[0] + ow / 2, p[1] + ow / 2], fill=self.ink + (255,))
        self.d.line(pts, fill=fill + (255,), width=w, joint="curve")
        for p in ((pts[-1],) if getattr(self, "no_start_cap", False) else (pts[0], pts[-1])):
            self.d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=fill + (255,))
        self.m.line(pts, fill=255, width=w, joint="curve")

    def line(self, pts, fill: RGB, width: float):
        self.d.line(pts, fill=fill + (255,), width=max(1, int(width)), joint="curve")


def _shadow(pen: Pen, poly, side: int, color: RGB, strength: float, soft: float, shading: str):
    """Paste a half-lit shadow onto `poly` (side = which side is in shadow: -1 left, +1 right)."""
    if shading == "flat" or strength <= 0.01:
        return
    xs, ys = [p[0] for p in poly], [p[1] for p in poly]
    x0, y0, x1, y1 = int(min(xs)) - 2, int(min(ys)) - 2, int(max(xs)) + 3, int(max(ys)) + 3
    w, h = x1 - x0, y1 - y0
    if w < 4 or h < 4 or w > 6000 or h > 6000:
        return
    shape = Image.new("L", (w, h), 0)
    ImageDraw.Draw(shape).polygon([(x - x0, y - y0) for x, y in poly], fill=255)
    half = Image.new("L", (w, h), 0)
    cut = w * 0.5 + side * -w * 0.12
    if side > 0:
        ImageDraw.Draw(half).polygon([(cut, 0), (w, 0), (w, h), (cut - h * 0.22, h)], fill=255)
    else:
        ImageDraw.Draw(half).polygon([(0, 0), (cut, 0), (cut + h * 0.22, h), (0, h)], fill=255)
    blur = soft if shading in ("soft", "depth") else max(0.0, soft * 0.15)
    if blur > 0.5:
        half = half.filter(ImageFilter.GaussianBlur(blur))
    m = ImageChops.multiply(shape, half).point(lambda v: int(v * strength))
    pen.layer.paste(Image.new("RGBA", (w, h), color + (255,)), (x0, y0), m)


# --------------------------------------------------------------------------- result
@dataclass
class FigureResult:
    name: str
    head_box: tuple[float, float, float, float]
    face_box: tuple[float, float, float, float]
    body_box: tuple[float, float, float, float]
    samples: dict[str, tuple[float, float, RGB]] = field(default_factory=dict)


# --------------------------------------------------------------------------- figure
def draw_figure(layer: Image.Image, mask: Image.Image, sheet: CharacterSheet, expression: str, pose: str,
                hx: float, hy: float, h: float, facing: int, style: StyleProfile, lw: int,
                light_side: int, back_view: bool = False, look_up: bool = False, ss: int = 2) -> FigureResult:
    if style.figure == "semi":
        from .figures_semi import draw_figure_semi
        return draw_figure_semi(layer, mask, sheet, expression, pose, hx, hy, h, facing, style, lw, light_side, back_view, look_up, ss)
    pen = Pen(layer, mask, lw)
    f = 1 if facing >= 0 else -1
    yaw = 0.0 if back_view else 0.38 * f
    sh = style.shading
    soft = h * 0.06
    shadow_strength = {"flat": 0.0, "soft": 0.42, "cel": 0.55, "depth": 0.5}.get(sh, 0.4)
    sw = {"slim": 0.92, "average": 1.08, "broad": 1.3}.get(sheet.build, 1.08)
    sy = hy + 0.56 * h                       # shoulder line
    wy = sy + 1.55 * h                       # waist
    hip = wy + 0.55 * h
    feet = hy - 0.5 * h + sheet.head_units * h
    pose = pose if pose in ("standing", "fight", "crossed", "pointing", "slumped", "running", "sit") else "standing"
    if pose == "slumped":
        hy += 0.12 * h
        sy += 0.06 * h
    skin, skin_sh = sheet.skin, shade(sheet.skin, 0.8)
    pants = shade(sheet.outfit_shade, 0.75)

    # --- long hair behind everything
    if sheet.hair_style == "long":
        back = smooth_closed([(hx - 0.56 * h, hy - 0.25 * h), (hx - 0.66 * h, hy + 0.5 * h), (hx - 0.6 * h, hy + 1.7 * h),
                              (hx, hy + 1.8 * h), (hx + 0.6 * h, hy + 1.7 * h), (hx + 0.66 * h, hy + 0.5 * h),
                              (hx + 0.56 * h, hy - 0.25 * h), (hx, hy - 0.62 * h)], 6)
        pen.poly(back, sheet.hair_shade)
    if sheet.hair_style == "ponytail":
        s = -f
        tail = smooth_closed([(hx + s * 0.4 * h, hy - 0.35 * h), (hx + s * 0.95 * h, hy - 0.1 * h),
                              (hx + s * 1.05 * h, hy + 0.9 * h), (hx + s * 0.75 * h, hy + 1.25 * h),
                              (hx + s * 0.7 * h, hy + 0.5 * h), (hx + s * 0.4 * h, hy + 0.0 * h)], 6)
        pen.poly(tail, sheet.hair)

    # --- legs
    stance = 0.32 if pose in ("fight", "running") else 0.16
    leg_w = 0.46 * h * sw
    for s in (-1, 1):
        lx0 = hx + s * 0.28 * h * sw
        lx1 = hx + s * (stance + 0.2) * h * sw * (1.6 if pose in ("fight", "running") else 1.0)
        pen.stroke([(lx0, hip), (lx1, (hip + feet) / 2), (lx1 + s * 0.03 * h, feet - 0.1 * h)], pants, leg_w)
        pen.ellipse([lx1 - 0.34 * h + s * 0.04 * h, feet - 0.16 * h, lx1 + 0.4 * h + s * 0.04 * h, feet + 0.12 * h],
                    shade(sheet.outfit_shade, 0.4))

    # --- torso
    if sheet.outfit_style == "coat":
        flare = 0.5
        torso = [(hx - sw * h, sy), (hx + sw * h, sy), (hx + sw * h * 0.8, wy), (hx + (0.9 + flare) * sw * h, hip + 0.9 * h),
                 (hx - (0.9 + flare) * sw * h, hip + 0.9 * h), (hx - sw * h * 0.8, wy)]
    else:
        torso = [(hx - sw * h, sy), (hx + sw * h, sy), (hx + 0.72 * sw * h, wy), (hx + 0.8 * sw * h, hip + 0.1 * h),
                 (hx - 0.8 * sw * h, hip + 0.1 * h), (hx - 0.72 * sw * h, wy)]
    torso = smooth_closed(torso, 4)
    # keep the corners crisp: re-add the straight top edge
    pen.poly(torso, sheet.outfit)
    _shadow(pen, torso, -light_side, shade(sheet.outfit, 0.55), shadow_strength, soft, sh)
    _outfit_details(pen, sheet, hx, sy, wy, hip, h, sw, light_side)

    # --- arms
    _arms(pen, sheet, pose, hx, sy, wy, h, sw, f, skin)

    # --- neck
    neck = [(hx - 0.17 * h, hy + 0.35 * h), (hx + 0.17 * h, hy + 0.35 * h), (hx + 0.2 * h, sy + 0.08 * h), (hx - 0.2 * h, sy + 0.08 * h)]
    pen.poly(neck, skin_sh)
    if sheet.outfit_style in ("uniform", "casual"):
        col = [(hx - 0.24 * h, sy - 0.02 * h), (hx + 0.24 * h, sy - 0.02 * h), (hx, sy + 0.3 * h)]
        pen.poly(col, (240, 240, 245) if sheet.outfit_style == "uniform" else shade(sheet.outfit, 0.7))

    # --- head
    unit = [(0, -0.5), (0.30, -0.46), (0.39, -0.25), (0.385, 0.0), (0.34, 0.2), (0.21, 0.38), (0.07, 0.49), (0, 0.5)]
    right = [(x, y) for x, y in unit]
    left = [(-x, y) for x, y in reversed(unit[1:-1])]
    face_pts = smooth_closed([(hx + x * h, hy + y * h) for x, y in right + left], 6)
    for s in (-1, 1):  # ears
        pen.ellipse([hx + s * 0.42 * h - 0.07 * h, hy - 0.02 * h, hx + s * 0.42 * h + 0.07 * h, hy + 0.2 * h], skin_sh)
    pen.poly(face_pts, skin)
    _shadow(pen, face_pts, -light_side, shade(skin, 0.74), shadow_strength, soft, sh)
    fx = hx + yaw * 0.10 * h

    if not back_view:
        _face(pen, sheet, expression, hx, hy, h, fx, f, look_up, style, lw)

    # --- hair (front)
    _hair_front(pen, sheet, hx, hy, h, yaw, f, back_view, light_side, shadow_strength, soft, sh, lw)

    # boxes + colour sample points for the critic
    head_box = (hx - 0.62 * h, hy - 0.7 * h, hx + 0.62 * h, hy + 0.52 * h)
    face_box = (hx - 0.4 * h, hy - 0.3 * h, hx + 0.4 * h, hy + 0.5 * h)
    body_box = (hx - (sw + 0.6) * h, hy - 0.7 * h, hx + (sw + 0.6) * h, feet + 0.15 * h)
    samples = {
        "skin": (hx, hy + 0.42 * h, sheet.skin),
        "hair": (hx, hy - 0.56 * h, sheet.hair),
        "outfit": (hx - 0.4 * sw * h, sy + 0.95 * h, sheet.outfit),
    }
    return FigureResult(sheet.name, head_box, face_box, body_box, samples)


def _outfit_details(pen: Pen, sheet: CharacterSheet, hx, sy, wy, hip, h, sw, light_side):
    st = sheet.outfit_style
    acc = sheet.accent
    if st == "uniform":
        pen.poly([(hx - 0.24 * h, sy), (hx, sy + 0.36 * h), (hx + 0.24 * h, sy)], (240, 240, 246))
        pen.poly([(hx - 0.07 * h, sy + 0.2 * h), (hx + 0.07 * h, sy + 0.2 * h), (hx + 0.1 * h, sy + 1.0 * h), (hx, sy + 1.15 * h),
                  (hx - 0.1 * h, sy + 1.0 * h)], acc)
        pen.line([(hx, sy + 0.5 * h), (hx, wy + 0.4 * h)], shade(sheet.outfit, 0.5), pen.lw)
    elif st == "coat":
        pen.poly([(hx - 0.34 * h, sy), (hx, sy + 0.9 * h), (hx + 0.34 * h, sy)], shade(sheet.outfit_shade, 0.6))
        pen.line([(hx, sy + 0.9 * h), (hx, wy + 1.4 * h)], shade(sheet.outfit, 0.5), pen.lw)
        pen.poly([(hx - 0.36 * h, sy - 0.02 * h), (hx - 0.12 * h, sy + 0.55 * h), (hx - 0.5 * h, sy + 0.5 * h)], sheet.outfit_shade)
        pen.poly([(hx + 0.36 * h, sy - 0.02 * h), (hx + 0.12 * h, sy + 0.55 * h), (hx + 0.5 * h, sy + 0.5 * h)], sheet.outfit_shade)
        pen.d.rectangle([hx - 0.9 * sw * h * 0.8, wy - 0.05 * h, hx + 0.9 * sw * h * 0.8, wy + 0.1 * h], fill=acc + (255,))
    elif st == "armor":
        pen.poly([(hx - 0.7 * sw * h, sy + 0.1 * h), (hx + 0.7 * sw * h, sy + 0.1 * h), (hx + 0.55 * sw * h, wy - 0.1 * h),
                  (hx - 0.55 * sw * h, wy - 0.1 * h)], mix(sheet.outfit, (190, 195, 205), 0.45))
        pen.line([(hx, sy + 0.1 * h), (hx, wy - 0.1 * h)], shade(sheet.outfit, 0.5), pen.lw)
        for s in (-1, 1):
            pen.ellipse([hx + s * sw * h - 0.38 * h, sy - 0.16 * h, hx + s * sw * h + 0.38 * h, sy + 0.34 * h], mix(sheet.outfit, (200, 205, 215), 0.5))
        pen.d.rectangle([hx - 0.55 * sw * h, wy - 0.04 * h, hx + 0.55 * sw * h, wy + 0.1 * h], fill=acc + (255,))
    elif st == "robe":
        pen.poly([(hx - 0.34 * h, sy), (hx + 0.12 * h, sy + 1.9 * h), (hx + 0.34 * h, sy + 1.9 * h), (hx + 0.1 * h, sy)],
                 shade(sheet.outfit, 0.82))
        pen.d.rectangle([hx - 0.75 * sw * h, wy - 0.12 * h, hx + 0.75 * sw * h, wy + 0.16 * h], fill=acc + (255,))
    else:  # casual
        pen.line([(hx - 0.7 * sw * h, sy + 0.6 * h), (hx + 0.7 * sw * h, sy + 0.6 * h)], acc, pen.lw * 3)
        pen.line([(hx - 0.65 * sw * h, sy + 0.78 * h), (hx + 0.65 * sw * h, sy + 0.78 * h)], acc, pen.lw * 2)


def _arms(pen: Pen, sheet: CharacterSheet, pose: str, hx, sy, wy, h, sw, f, skin, aw_scale: float = 1.0):
    aw = 0.36 * h * aw_scale
    sleeve = sheet.outfit
    lsh = (hx - sw * h * 0.92, sy + 0.18 * h)
    rsh = (hx + sw * h * 0.92, sy + 0.18 * h)
    fs, bs = (rsh, lsh) if f > 0 else (lsh, rsh)   # front shoulder = the one on the facing side
    fsd = f

    def hand(p, fist=False):
        r = 0.2 * h if fist else 0.17 * h
        pen.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], skin)

    if pose == "crossed":
        for s, sh_ in ((-1, lsh), (1, rsh)):
            e = (hx + s * 0.55 * sw * h, sy + 1.25 * h)
            p = (hx - s * 0.5 * sw * h, sy + 0.95 * h)
            pen.stroke([sh_, e, p], sleeve, aw)
            hand(p)
    elif pose == "fight":
        e1 = (fs[0] + fsd * 0.65 * h, fs[1] + 0.85 * h)
        p1 = (fs[0] + fsd * 1.15 * h, fs[1] - 0.05 * h)
        e2 = (bs[0] - fsd * 0.25 * h, bs[1] + 1.1 * h)
        p2 = (bs[0] + fsd * 0.2 * h, bs[1] + 0.35 * h)
        pen.stroke([bs, e2, p2], shade(sleeve, 0.85), aw)
        hand(p2, True)
        pen.stroke([fs, e1, p1], sleeve, aw)
        hand(p1, True)
    elif pose == "pointing":
        p = (fs[0] + fsd * 2.1 * h, fs[1] - 0.1 * h)
        pen.stroke([fs, (fs[0] + fsd * 1.0 * h, fs[1] + 0.05 * h), p], sleeve, aw)
        pen.stroke([p, (p[0] + fsd * 0.4 * h, p[1] - 0.02 * h)], skin, 0.14 * h)
        sp = (bs[0] - fsd * 0.08 * h, bs[1] + 2.1 * h)
        pen.stroke([bs, (bs[0] - fsd * 0.12 * h, bs[1] + 1.1 * h), sp], shade(sleeve, 0.85), aw)
        hand(sp)
    elif pose == "running":
        pen.stroke([bs, (bs[0] - fsd * 0.7 * h, bs[1] + 0.9 * h), (bs[0] - fsd * 1.1 * h, bs[1] + 0.2 * h)], shade(sleeve, 0.85), aw)
        e = (fs[0] + fsd * 0.8 * h, fs[1] + 0.9 * h)
        p = (fs[0] + fsd * 1.3 * h, fs[1] + 0.2 * h)
        pen.stroke([fs, e, p], sleeve, aw)
        hand(p, True)
    else:  # standing / slumped / sit
        for s, sh_ in ((-1, lsh), (1, rsh)):
            e = (sh_[0] + s * 0.12 * h, sh_[1] + 1.15 * h)
            p = (sh_[0] + s * 0.06 * h, sh_[1] + 2.25 * h)
            pen.stroke([sh_, e, p], sleeve if s == fsd else shade(sleeve, 0.88), aw)
            hand(p)


def _face(pen: Pen, sheet: CharacterSheet, expression: str, hx, hy, h, fx, f, look_up, style, lw):
    ex = EXPRESSIONS[canonical_expression(expression)]
    skin = sheet.skin
    spacing, ey = 0.205 * h, hy + 0.06 * h
    shape_h = {"round": 0.215, "sharp": 0.15, "soft": 0.18}.get(sheet.eye_shape, 0.18) * h
    ewh = 0.105 * h
    ink = INK
    look = ex.get("look", 0.0) * 0.03 * h * f
    if look_up:
        look_y = -0.03 * h
    else:
        look_y = 0.0

    blush = ex.get("blush")
    if blush:
        for s in (-1, 1):
            bx = fx + s * 0.25 * h
            pen.d.ellipse([bx - 0.1 * h, ey + 0.1 * h, bx + 0.1 * h, ey + 0.2 * h], fill=(255, 110, 130, 95))

    for s in (-1, 1):
        cx = fx + s * spacing
        eye_mode = ex["eye"]
        # perspective: the far eye is a little narrower
        far = (s == -f)
        w = ewh * (0.88 if far else 1.0)
        if isinstance(eye_mode, str):
            # closed / happy arcs
            up = eye_mode == "arc_up"
            pts = [(cx - w, ey + (0.02 if up else -0.01) * h), (cx, ey + (-0.07 if up else 0.05) * h), (cx + w, ey + (0.02 if up else -0.01) * h)]
            pen.line(smooth_open(pts, 8), ink, max(lw * 1.6, 0.03 * h))
        else:
            eh = shape_h * float(eye_mode)
            box = [cx - w, ey - eh / 2, cx + w, ey + eh / 2]
            # sclera + iris clipped to the eye shape
            x0, y0, x1, y1 = int(box[0]) - 2, int(box[1]) - 2, int(box[2]) + 3, int(box[3]) + 3
            tile = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
            td = ImageDraw.Draw(tile)
            td.ellipse([box[0] - x0, box[1] - y0, box[2] - x0, box[3] - y0], fill=(246, 246, 252, 255))
            ir = min(eh * 0.54, w * 0.82)
            ix, iy = cx + look + s * 0.0 + (0.012 * h * f), ey + 0.02 * h + look_y
            iris = sheet.eye
            td.ellipse([ix - ir * 0.92 - x0, iy - ir - y0, ix + ir * 0.92 - x0, iy + ir - y0], fill=shade(iris, 0.7) + (255,))
            td.ellipse([ix - ir * 0.8 - x0, iy - ir * 0.55 - y0, ix + ir * 0.8 - x0, iy + ir * 0.95 - y0], fill=iris + (255,))
            td.ellipse([ix - ir * 0.8 - x0, iy + ir * 0.05 - y0, ix + ir * 0.8 - x0, iy + ir * 0.95 - y0], fill=mix(iris, (255, 255, 255), 0.25) + (255,))
            pr = ir * (0.28 if ex.get("small_pupil") else 0.46)
            td.ellipse([ix - pr - x0, iy - pr - y0, ix + pr - x0, iy + pr - y0], fill=(14, 12, 22, 255))
            td.ellipse([ix - ir * 0.5 - x0, iy - ir * 0.62 - y0, ix - ir * 0.1 - x0, iy - ir * 0.22 - y0], fill=(255, 255, 255, 255))
            td.ellipse([ix + ir * 0.22 - x0, iy + ir * 0.3 - y0, ix + ir * 0.42 - x0, iy + ir * 0.5 - y0], fill=(255, 255, 255, 220))
            clip = Image.new("L", tile.size, 0)
            ImageDraw.Draw(clip).ellipse([box[0] - x0, box[1] - y0, box[2] - x0, box[3] - y0], fill=255)
            tile.putalpha(ImageChops.multiply(tile.getchannel("A"), clip))
            pen.layer.alpha_composite(tile, (x0, y0))
            # lids
            top = smooth_open([(box[0], ey + eh * 0.1), (cx - w * 0.5, ey - eh * 0.5), (cx + w * 0.4, ey - eh * 0.54), (box[2], ey + eh * 0.05)], 8)
            pen.line(top, ink, max(lw * 1.8, 0.038 * h))
            outer = (box[0] if s == -1 else box[2])
            pen.line([(outer, ey + eh * 0.02), (outer + s * 0.05 * h, ey - eh * 0.38)], ink, max(lw * 1.4, 0.026 * h))
            low = smooth_open([(box[0] + w * 0.15, ey + eh * 0.42), (cx, ey + eh * 0.52), (box[2] - w * 0.15, ey + eh * 0.42)], 6)
            pen.line(low, shade(sheet.skin, 0.45), max(lw * 0.8, 0.012 * h))
        # brows
        tilt = ex["tilt"] * 0.06 * h
        lift = ex["lift"] * h
        by = ey - 0.2 * h - lift
        if ex.get("brow_one") and s == -f:
            by -= 0.045 * h
        outer_x, inner_x = cx + s * 0.12 * h, cx - s * 0.08 * h
        pen.line([(inner_x, by + tilt), ((outer_x + inner_x) / 2, by - 0.02 * h), (outer_x, by + 0.012 * h - tilt * 0.3)],
                 sheet.hair_shade, max(lw * 1.6, 0.032 * h))

    # nose
    pen.line([(fx + 0.01 * h * f, hy + 0.16 * h), (fx + 0.03 * h * f, hy + 0.2 * h), (fx - 0.005 * h * f, hy + 0.21 * h)], shade(skin, 0.55), max(lw * 0.9, 0.014 * h))
    # mouth
    my = hy + 0.325 * h
    m = ex["mouth"]
    mc = shade(skin, 0.36)
    mw = 0.075 * h
    if m == "flat":
        pen.line([(fx - mw, my), (fx + mw, my)], mc, max(lw, 0.018 * h))
    elif m in ("smile", "small_smile"):
        k = 0.05 if m == "smile" else 0.03
        pen.line(smooth_open([(fx - mw, my - 0.01 * h), (fx, my + k * h), (fx + mw, my - 0.01 * h)], 8), mc, max(lw, 0.02 * h))
    elif m == "smirk":
        pen.line(smooth_open([(fx - mw * 0.8, my + 0.01 * h), (fx + mw * 0.3, my + 0.02 * h), (fx + mw * f * 1.2 + (mw * 0.2 * f), my - 0.03 * h)] if f > 0 else
                             [(fx + mw * 0.8, my + 0.01 * h), (fx - mw * 0.3, my + 0.02 * h), (fx + mw * f * 1.2 + (mw * 0.2 * f), my - 0.03 * h)], 8), mc, max(lw, 0.02 * h))
    elif m == "frown":
        pen.line(smooth_open([(fx - mw, my + 0.02 * h), (fx, my - 0.015 * h), (fx + mw, my + 0.02 * h)], 8), mc, max(lw, 0.02 * h))
    elif m in ("open_big", "frown_open", "grit", "o"):
        if m == "o":
            box = [fx - 0.045 * h, my - 0.03 * h, fx + 0.045 * h, my + 0.07 * h]
        else:
            box = [fx - 0.1 * h, my - 0.035 * h, fx + 0.1 * h, my + (0.1 if m != "grit" else 0.06) * h]
        pen.d.ellipse(box, fill=(96, 24, 36, 255), outline=INK + (255,), width=lw)
        if m == "open_big":
            pen.d.pieslice([box[0] + 0.02 * h, box[1] + (box[3] - box[1]) * 0.5, box[2] - 0.02 * h, box[3] + 0.02 * h], 0, 180, fill=(236, 110, 120, 255))
            pen.d.rectangle([box[0] + 0.03 * h, box[1] + 0.012 * h, box[2] - 0.03 * h, box[1] + 0.04 * h], fill=(250, 250, 250, 255))
        if m == "grit":
            pen.d.rectangle([box[0] + 0.012 * h, box[1] + 0.015 * h, box[2] - 0.012 * h, box[3] - 0.015 * h], fill=(250, 250, 250, 255))
            for k in range(1, 4):
                xx = box[0] + (box[2] - box[0]) * k / 4
                pen.line([(xx, box[1] + 0.015 * h), (xx, box[3] - 0.015 * h)], INK, max(1, lw * 0.6))
    elif m in ("wavy", "wavy_small", "firm"):
        if m == "firm":
            pen.line([(fx - mw, my), (fx + mw, my)], mc, max(lw * 1.3, 0.024 * h))
        else:
            n = 5 if m == "wavy" else 4
            pts = [(fx - mw + (2 * mw) * i / (n - 1), my + (0.018 * h if i % 2 else -0.018 * h)) for i in range(n)]
            pen.line(pts, mc, max(lw, 0.018 * h))

    if ex.get("tear"):
        for s in (-1, 1):
            tx = fx + s * spacing + s * 0.03 * h
            pen.d.polygon([(tx, ey + 0.1 * h), (tx - 0.025 * h, ey + 0.18 * h), (tx, ey + 0.23 * h), (tx + 0.025 * h, ey + 0.18 * h)], fill=(170, 215, 255, 215))
    if ex.get("sweat"):
        tx, ty = hx + f * 0.36 * h, hy - 0.2 * h
        pen.d.polygon([(tx, ty - 0.07 * h), (tx - 0.04 * h, ty + 0.02 * h), (tx, ty + 0.07 * h), (tx + 0.04 * h, ty + 0.02 * h)],
                      fill=(190, 225, 255, 235), outline=INK + (255,))
    if ex.get("veins"):
        vx, vy = hx - f * 0.3 * h, hy - 0.34 * h
        pen.line([(vx - 0.05 * h, vy), (vx, vy + 0.03 * h)], (200, 40, 50), max(2, lw))
        pen.line([(vx, vy - 0.05 * h), (vx + 0.03 * h, vy)], (200, 40, 50), max(2, lw))


def _hair_front(pen: Pen, sheet: CharacterSheet, hx, hy, h, yaw, f, back_view, light_side, strength, soft, sh, lw):
    st = sheet.hair_style
    col, dark = sheet.hair, sheet.hair_shade
    P = lambda x, y: (hx + x * h, hy + y * h)  # noqa: E731

    if back_view:  # whole head is hair
        cap = smooth_closed([P(-0.44, 0.1), P(-0.5, -0.3), P(-0.3, -0.58), P(0, -0.66), P(0.3, -0.58), P(0.5, -0.3), P(0.44, 0.1), P(0.3, 0.4), P(0, 0.46), P(-0.3, 0.4)], 6)
        pen.poly(cap, col)
        _shadow(pen, cap, -light_side, dark, strength, soft, sh)
        return

    cap = smooth_closed([P(-0.44, 0.1), P(-0.52, -0.28), P(-0.34, -0.6), P(0, -0.68), P(0.34, -0.6), P(0.52, -0.28), P(0.44, 0.1),
                         P(0.38, -0.1), P(0.0, -0.3), P(-0.38, -0.1)], 5)
    if st == "spiky":
        srng = random.Random(sheet.seed)
        spikes = []
        n = 7
        for i in range(n):
            ang = math.radians(-170 + 160 * (i + srng.uniform(-0.3, 0.3)) / (n - 1))
            r1 = srng.uniform(0.74, 1.0)
            half = srng.uniform(0.15, 0.24)
            a0, a1 = ang - half, ang + half
            spikes.append(P(0.5 * math.cos(a0), 0.52 * math.sin(a0) - 0.05))
            spikes.append(P(r1 * math.cos(ang + srng.uniform(-0.1, 0.1)), r1 * math.sin(ang) - 0.05))
            spikes.append(P(0.5 * math.cos(a1), 0.52 * math.sin(a1) - 0.05))
        pen.poly(spikes, col)
    pen.poly(cap, col)
    _shadow(pen, cap, -light_side, dark, strength, soft, sh)

    if st == "bun":
        pen.ellipse([hx - 0.2 * h, hy - 0.88 * h, hx + 0.2 * h, hy - 0.52 * h], col)
    if st == "long" or st == "bob":
        for s in (-1, 1):
            ln = 1.2 if st == "long" else 0.5
            lock = smooth_closed([P(s * 0.4, -0.05), P(s * 0.5, 0.35), P(s * (0.52 if st == "long" else 0.5), ln), P(s * 0.38, ln - 0.1), P(s * 0.34, 0.3)], 5)
            pen.poly(lock, col)
            _shadow(pen, lock, -light_side, dark, strength, soft, sh)

    # fringe / bangs
    n = 6 if st != "spiky" else 5
    part = 0.12 * yaw
    tips = []
    tips.append(P(0.45, -0.06))
    for i in range(n):
        t = i / (n - 1)
        x = 0.42 - 0.84 * t + part
        depth = 0.10 + 0.14 * math.sin(math.pi * t) ** 0.8 if st != "bob" else 0.1 + 0.05 * math.sin(math.pi * t)
        sway = (0.05 if (i % 2) else -0.02)
        tips.append(P(x + 0.06 * (1 - t) - 0.03, -0.18 + depth))
        tips.append(P(x - 0.05 + sway, -0.30 + 0.02 * (i % 2)))
    tips.append(P(-0.45, -0.06))
    tips.append(P(-0.5, -0.4))
    tips.append(P(0, -0.66))
    tips.append(P(0.5, -0.4))
    pen.poly(tips, col, line=True)
    # glossy highlight: two short arcs off-centre (reads as light on hair, not as a headband)
    if sh != "flat" and st != "spiky":
        hl = mix(col, (255, 255, 255), 0.4)
        for s0, a0, a1 in ((-light_side, 0.10, 0.34), (-light_side, 0.38, 0.46)):
            arc = smooth_open([P(light_side * -0.0 + (-0.30 if light_side < 0 else 0.30) + 0.0, -0.40), P((-0.2 if light_side < 0 else 0.2), -0.52), P((-0.02 if light_side < 0 else 0.02), -0.58)], 6)
            pen.d.line(arc, fill=hl + (150,), width=max(2, int(0.04 * h)), joint="curve")
            break


def draw_eye_closeup(layer: Image.Image, mask: Image.Image, sheet: CharacterSheet, expression: str,
                     cx: float, cy: float, w: float, lw: int, style: "StyleProfile | None" = None) -> FigureResult:
    """Dramatic insert: one huge eye with brow, used for 'eyes widen' style beats."""
    if style is not None and style.figure == "semi":
        from .figures_semi import draw_eye_closeup_semi
        return draw_eye_closeup_semi(layer, mask, sheet, expression, cx, cy, w, lw, style)
    pen = Pen(layer, mask, lw)
    ex = EXPRESSIONS[canonical_expression(expression)]
    skin = sheet.skin
    hh = w * 0.24
    # skin band
    band = [(cx - w * 0.85, cy - hh * 1.6), (cx + w * 0.85, cy - hh * 1.6), (cx + w * 0.85, cy + hh * 1.5), (cx - w * 0.85, cy + hh * 1.5)]
    pen.d.polygon(band, fill=skin + (255,))
    pen.m.polygon(band, fill=255)
    openness = ex["eye"] if not isinstance(ex["eye"], str) else 0.5
    eh = hh * openness
    box = [cx - w / 2, cy - eh, cx + w / 2, cy + eh]
    tile = Image.new("RGBA", (int(w) + 6, int(2 * eh) + 6), (0, 0, 0, 0))
    ox, oy = box[0] - 3, box[1] - 3
    td = ImageDraw.Draw(tile)
    td.ellipse([3, 3, 3 + w, 3 + 2 * eh], fill=(244, 244, 250, 255))
    ir = eh * 0.98
    td.ellipse([w / 2 + 3 - ir, 3 + eh - ir, w / 2 + 3 + ir, 3 + eh + ir], fill=shade(sheet.eye, 0.6) + (255,))
    td.ellipse([w / 2 + 3 - ir * 0.85, 3 + eh - ir * 0.85, w / 2 + 3 + ir * 0.85, 3 + eh + ir * 0.85], fill=sheet.eye + (255,))
    for k in range(24):  # iris fibres
        a = 2 * math.pi * k / 24
        td.line([(w / 2 + 3 + math.cos(a) * ir * 0.3, 3 + eh + math.sin(a) * ir * 0.3),
                 (w / 2 + 3 + math.cos(a) * ir * 0.8, 3 + eh + math.sin(a) * ir * 0.8)], fill=mix(sheet.eye, (255, 255, 255), 0.35) + (180,), width=max(1, lw // 2))
    pr = ir * (0.2 if ex.get("small_pupil") else 0.38)
    td.ellipse([w / 2 + 3 - pr, 3 + eh - pr, w / 2 + 3 + pr, 3 + eh + pr], fill=(10, 8, 18, 255))
    td.ellipse([w / 2 + 3 - ir * 0.5, 3 + eh - ir * 0.55, w / 2 + 3 - ir * 0.1, 3 + eh - ir * 0.15], fill=(255, 255, 255, 255))
    clip = Image.new("L", tile.size, 0)
    ImageDraw.Draw(clip).ellipse([3, 3, 3 + w, 3 + 2 * eh], fill=255)
    tile.putalpha(ImageChops.multiply(tile.getchannel("A"), clip))
    layer.alpha_composite(tile, (int(ox), int(oy)))
    pen.m.ellipse(box, fill=255)
    top = smooth_open([(box[0] - w * 0.04, cy + eh * 0.2), (cx - w * 0.25, cy - eh * 1.05), (cx + w * 0.25, cy - eh * 1.1), (box[2] + w * 0.04, cy + eh * 0.1)], 12)
    pen.line(top, INK, max(lw * 2.5, w * 0.05))
    low = smooth_open([(box[0] + w * 0.05, cy + eh * 0.78), (cx, cy + eh * 1.02), (box[2] - w * 0.05, cy + eh * 0.8)], 10)
    pen.line(low, shade(skin, 0.4), max(lw, w * 0.012))
    tilt = ex["tilt"] * w * 0.1
    brow = smooth_open([(cx - w * 0.5, cy - eh * 1.7 + tilt), (cx, cy - eh * 1.95), (cx + w * 0.5, cy - eh * 1.65 - tilt)], 10)
    pen.line(brow, sheet.hair_shade, max(lw * 3, w * 0.06))
    return FigureResult(sheet.name, (box[0], box[1], box[2], box[3]), (box[0], box[1], box[2], box[3]), tuple(band[0] + band[2]),  # type: ignore[arg-type]
                        {"skin": (cx - w * 0.68, cy, sheet.skin)})
