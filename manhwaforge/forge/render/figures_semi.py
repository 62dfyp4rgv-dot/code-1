"""Semi-realistic Korean-manhwa figure renderer.

Target look (see the project README): thin clean ink contours that vary in weight, elongated realistic
proportions, large almond eyes with a heavy upper lash line and lid shadow, a barely-there nose, soft
lips, soft painterly shading on pale skin, long strand-lined hair, collared shirts.

Same contract as figures.draw_figure (so staging, lettering and the Critic are unchanged): every shape
is drawn from the persistent CharacterSheet, and the function returns face/head/body boxes and colour
sample points.
"""
from __future__ import annotations

import math
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from ..models import CharacterSheet, StyleProfile
from .figures import EXPRESSIONS, FigureResult, Pen, _arms, canonical_expression
from .util import RGB, mix, shade, smooth_closed, smooth_open

INK: RGB = (44, 36, 44)          # warm dark grey-brown: softer than pure black, like the references


# --------------------------------------------------------------------------- drawing helpers
def _bbox(poly, pad):
    xs, ys = [p[0] for p in poly], [p[1] for p in poly]
    return int(min(xs) - pad), int(min(ys) - pad), int(max(xs) + pad) + 1, int(max(ys) + pad) + 1


def soft_fill(layer: Image.Image, poly, color: RGB, alpha: float, blur: float, clip=None) -> None:
    """Soft airbrushed shape; optionally clipped to another polygon (so shading never leaves the face)."""
    x0, y0, x1, y1 = _bbox(poly, blur * 3 + 2)
    w, h = x1 - x0, y1 - y0
    if w < 3 or h < 3 or w > 7000 or h > 7000:
        return
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).polygon([(x - x0, y - y0) for x, y in poly], fill=255)
    if blur > 0.4:
        m = m.filter(ImageFilter.GaussianBlur(blur))
    if clip is not None:
        c = Image.new("L", (w, h), 0)
        ImageDraw.Draw(c).polygon([(x - x0, y - y0) for x, y in clip], fill=255)
        m = ImageChops.multiply(m, c)
    m = m.point(lambda v: int(v * alpha))
    layer.paste(Image.new("RGBA", (w, h), color + (255,)), (x0, y0), m)


def soft_ellipse(layer, cx, cy, rx, ry, color, alpha, blur, clip=None):
    pts = [(cx + math.cos(a) * rx, cy + math.sin(a) * ry) for a in [i * math.pi / 12 for i in range(24)]]
    soft_fill(layer, pts, color, alpha, blur, clip)


def _blend_poly(layer: Image.Image, poly, color: RGB, alpha: int) -> None:
    """Composite a translucent polygon (ImageDraw on an RGBA layer would *replace* pixels, punching holes)."""
    x0, y0, x1, y1 = _bbox(poly, 2)
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(layer.width, x1), min(layer.height, y1)
    if x1 <= x0 or y1 <= y0:
        return
    tile = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    ImageDraw.Draw(tile).polygon([(x - x0, y - y0) for x, y in poly], fill=color + (alpha,))
    layer.alpha_composite(tile, (x0, y0))


def taper(pen: Pen, pts, w0: float, w1: float, color: RGB, alpha: int = 255, wmid: float | None = None) -> None:
    """Variable-width stroke: width runs w0 -> (wmid) -> w1 along the path. This is what gives the
    brush-pen feel of the references (hair strands, brows, lashes, contours)."""
    if len(pts) < 2:
        return
    n = len(pts)
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        a = pts[max(0, i - 1)]
        b = pts[min(n - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / L, dx / L
        t = i / (n - 1)
        if wmid is None:
            w = w0 + (w1 - w0) * t
        else:
            w = (w0 + (wmid - w0) * (t / 0.5)) if t < 0.5 else (wmid + (w1 - wmid) * ((t - 0.5) / 0.5))
        left.append((x + nx * w / 2, y + ny * w / 2))
        right.append((x - nx * w / 2, y - ny * w / 2))
    poly = left + right[::-1]
    if alpha >= 250:
        pen.d.polygon(poly, fill=color + (255,))
    else:
        _blend_poly(pen.layer, poly, color, alpha)


def _bez(p0, p1, p2, p3, n=14):
    out = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        out.append((u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]))
    return out


def _outline(pen: Pen, pts, closed: bool, width: float, color: RGB = INK, alpha: int = 255) -> None:
    seq = list(pts) + ([pts[0]] if closed else [])
    w = max(1, int(round(width)))
    if alpha >= 250:
        pen.d.line(seq, fill=color + (255,), width=w, joint="curve")
        return
    x0, y0, x1, y1 = _bbox(seq, w + 2)
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(pen.layer.width, x1), min(pen.layer.height, y1)
    if x1 <= x0 or y1 <= y0:
        return
    tile = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    ImageDraw.Draw(tile).line([(x - x0, y - y0) for x, y in seq], fill=color + (alpha,), width=w, joint="curve")
    pen.layer.alpha_composite(tile, (x0, y0))


# --------------------------------------------------------------------------- main
def draw_figure_semi(layer: Image.Image, mask: Image.Image, sheet: CharacterSheet, expression: str, pose: str,
                     hx: float, hy: float, h: float, facing: int, style: StyleProfile, lw: int, light_side: int,
                     back_view: bool = False, look_up: bool = False, ss: int = 2) -> FigureResult:
    pen = Pen(layer, mask, lw, ink=INK)
    f = 1 if facing >= 0 else -1
    yaw = 0.0 if back_view else 0.5 * f
    male = sheet.gender == "male"
    ex_ = EXPRESSIONS[canonical_expression(expression)]
    rng = random.Random(sheet.seed)
    skin = sheet.skin
    skin_sh = mix(skin, (150, 100, 100), 0.30)           # warm shadow, not grey mud
    thin = max(1.0, lw * 0.85)                            # contour weight

    # ---- proportions
    bw = {"slim": 0.9, "average": 1.0, "broad": 1.12}.get(sheet.build, 1.0)
    sw = (0.98 if male else 0.82) * bw
    sy = hy + 0.60 * h
    wy = sy + 1.7 * h
    hip = wy + 0.5 * h
    feet = hy - 0.5 * h + sheet.head_units * h
    if pose == "slumped":
        hy += 0.1 * h
        sy += 0.05 * h

    def W(x: float) -> float:
        """3/4-view warp: the far side of the face compresses, the near side stays full."""
        return x * (1 - 0.17 * yaw) if x > 0 else x * (1 + 0.05 * yaw)

    def P(x: float, y: float) -> tuple[float, float]:
        return (hx + W(x) * h + yaw * 0.035 * h, hy + y * h)

    # ---- long hair mass behind the body
    long_hair = sheet.hair_style in ("long", "ponytail", "bob") or (not male and sheet.hair_style != "spiky" and sheet.hair_style != "short")
    hair, hair_dk = sheet.hair, shade(sheet.hair, 0.55)
    hair_hi = mix(sheet.hair, (255, 255, 255), 0.52)
    bob = sheet.hair_style == "bob"
    length = 0.85 if bob else 2.0
    if long_hair:
        back = smooth_closed([P(-0.56, -0.25), P(-0.62, 0.3), P(-0.66, 1.0), P(-0.62, length), P(0.0, length + 0.1),
                              P(0.62, length), P(0.66, 1.0), P(0.62, 0.3), P(0.56, -0.25), P(0.3, -0.62), P(0, -0.7), P(-0.3, -0.62)], 5)
        pen.poly(back, shade(hair, 0.82), line=False)
        _outline(pen, back, True, thin * 0.7, alpha=170)

    # ---- legs
    pants = shade(sheet.outfit_shade, 0.7)
    stance = 0.3 if pose in ("fight", "running") else 0.14
    for s in (-1, 1):
        lx0 = hx + s * 0.3 * h * sw
        lx1 = hx + s * (stance + 0.22) * h * sw * (1.5 if pose in ("fight", "running") else 1.0)
        pen.stroke([(lx0, hip), (lx1, (hip + feet) / 2), (lx1 + s * 0.02 * h, feet - 0.1 * h)], pants, 0.42 * h * sw, line=True)
        pen.ellipse([lx1 - 0.3 * h + s * 0.04 * h, feet - 0.13 * h, lx1 + 0.36 * h + s * 0.04 * h, feet + 0.1 * h], shade(sheet.outfit_shade, 0.35))

    arms_first = pose in ("standing", "slumped", "sit")      # hanging arms tuck behind the shoulder line; raised arms go on top
    if arms_first:
        pen.no_start_cap = True
        _arms(pen, sheet, "standing" if pose != "slumped" else "slumped", hx, sy + 0.04 * h, wy, h, sw * 1.02, f, skin, aw_scale=0.7)
        pen.no_start_cap = False

    # ---- torso (natural shoulder slope, narrow waist)
    shirt = sheet.outfit
    torso = smooth_closed([(hx - 0.17 * h, sy - 0.04 * h), (hx - sw * h * 0.6, sy + 0.05 * h), (hx - sw * h * 0.98, sy + 0.3 * h),
                           (hx - sw * h * 0.93, sy + 1.1 * h), (hx - 0.64 * sw * h, wy), (hx - 0.72 * sw * h, hip + 0.1 * h),
                           (hx + 0.72 * sw * h, hip + 0.1 * h), (hx + 0.64 * sw * h, wy), (hx + sw * h * 0.93, sy + 1.1 * h),
                           (hx + sw * h * 0.98, sy + 0.3 * h), (hx + sw * h * 0.6, sy + 0.05 * h), (hx + 0.17 * h, sy - 0.04 * h)], 5)
    pen.poly(torso, shirt, line=False)
    soft_fill(layer, [(hx + (-light_side) * 0.05 * h, sy), (hx + (-light_side) * sw * h * 1.1, sy), (hx + (-light_side) * sw * h * 1.1, hip),
                      (hx + (-light_side) * 0.05 * h, hip)], shade(shirt, 0.62), 0.55, h * 0.07, clip=torso)
    soft_fill(layer, [(hx - 0.5 * sw * h, sy + 0.9 * h), (hx + 0.5 * sw * h, sy + 0.9 * h), (hx + 0.55 * sw * h, hip), (hx - 0.55 * sw * h, hip)],
              shade(shirt, 0.78), 0.35, h * 0.12, clip=torso)
    _outline(pen, torso, True, thin)
    st = sheet.outfit_style
    if st in ("coat", "armor", "robe"):
        from .figures import _outfit_details
        _outfit_details(pen, sheet, hx, sy, wy, hip, h, sw, light_side)

    # ---- arms (raised / crossed poses sit in front of the torso)
    if not arms_first:
        _arms(pen, sheet, pose if pose in ("fight", "crossed", "pointing", "running") else "standing", hx, sy, wy, h, sw, f, skin, aw_scale=0.72)

    # ---- neck + collar
    nk = 0.14 if male else 0.115
    neck = [(hx - nk * h, hy + 0.3 * h), (hx + nk * h, hy + 0.3 * h), (hx + (nk + 0.04) * h, sy + 0.05 * h), (hx - (nk + 0.04) * h, sy + 0.05 * h)]
    pen.poly(neck, mix(skin, skin_sh, 0.45), line=False)
    _outline(pen, [neck[0], neck[3]], False, thin * 0.8)
    _outline(pen, [neck[1], neck[2]], False, thin * 0.8)
    if st in ("shirt", "casual", "uniform", "coat", "robe", "armor"):
        white = (238, 238, 244) if st == "uniform" else mix(shirt, (255, 255, 255), 0.1)
        col_l = [(hx - 0.2 * h, sy - 0.03 * h), (hx - 0.02 * h, sy + 0.5 * h), (hx - 0.36 * h, sy + 0.26 * h), (hx - 0.3 * h, sy - 0.04 * h)]
        col_r = [(hx + 0.2 * h, sy - 0.03 * h), (hx + 0.02 * h, sy + 0.5 * h), (hx + 0.36 * h, sy + 0.26 * h), (hx + 0.3 * h, sy - 0.04 * h)]
        v = [(hx - 0.2 * h, sy - 0.03 * h), (hx, sy + 0.5 * h), (hx + 0.2 * h, sy - 0.03 * h)]
        pen.poly(v, mix(skin, skin_sh, 0.35), line=False)                # skin in the open collar
        for c in (col_l, col_r):
            pen.poly(c, shirt if st != "uniform" else white, line=False)
            soft_fill(layer, c, shade(shirt, 0.7), 0.35, h * 0.02, clip=c)
            _outline(pen, c, True, thin)
        _outline(pen, [(hx, sy + 0.5 * h), (hx, wy + 0.2 * h)], False, thin * 0.8, alpha=200)       # placket
        for k in (0.8, 1.15):
            by = sy + k * h
            pen.d.ellipse([hx - 0.025 * h, by - 0.025 * h, hx + 0.025 * h, by + 0.025 * h], fill=shade(shirt, 1.25 if sum(shirt) < 300 else 0.8) + (255,),
                          outline=INK + (255,), width=max(1, int(thin * 0.6)))
        if st == "uniform" and not male or st == "uniform":
            tie = [(hx - 0.06 * h, sy + 0.42 * h), (hx + 0.06 * h, sy + 0.42 * h), (hx + 0.09 * h, sy + 1.25 * h), (hx, sy + 1.4 * h), (hx - 0.09 * h, sy + 1.25 * h)]
            pen.poly(tie, sheet.accent, line=False)
            _outline(pen, tie, True, thin * 0.9)
    # clavicles: two faint arcs, the detail that makes the neckline read as anatomy
    for s in (-1, 1):
        cl = smooth_open([(hx + s * 0.05 * h, sy + 0.06 * h), (hx + s * 0.16 * h, sy + 0.02 * h), (hx + s * 0.3 * h, sy + 0.07 * h)], 6)
        taper(pen, cl, thin * 0.2, thin * 0.9, shade(skin, 0.6), 130)
    soft_fill(layer, [(hx - 0.2 * h, hy + 0.34 * h), (hx + 0.2 * h, hy + 0.34 * h), (hx + 0.2 * h, hy + 0.56 * h), (hx - 0.2 * h, hy + 0.56 * h)],
              shade(skin_sh, 0.9), 0.6, h * 0.04, clip=neck)   # chin shadow on the neck

    # ---- head
    if male:
        unit = [(0.0, -0.5), (0.30, -0.46), (0.35, -0.28), (0.355, -0.02), (0.34, 0.15), (0.29, 0.3), (0.2, 0.41), (0.11, 0.474), (0.04, 0.495), (0.0, 0.5)]
    else:
        unit = [(0.0, -0.5), (0.285, -0.46), (0.335, -0.28), (0.33, -0.04), (0.30, 0.12), (0.235, 0.27), (0.165, 0.38), (0.095, 0.455), (0.04, 0.492), (0.0, 0.5)]
    pts = [P(x, y) for x, y in unit] + [P(-x, y) for x, y in reversed(unit[1:-1])]
    face = smooth_closed(pts, 6)
    for s in (-1, 1):   # ears (the far ear is mostly hidden)
        vis = 1.0 if s == -f else 0.45
        ex_c = P(s * 0.355, 0.06)
        pen.ellipse([ex_c[0] - 0.045 * h * vis, ex_c[1] - 0.075 * h, ex_c[0] + 0.045 * h * vis + (0.02 * h if s > 0 else 0), ex_c[1] + 0.09 * h],
                    mix(skin, skin_sh, 0.25), line=True)
    pen.poly(face, skin, line=False)
    # painterly shading, all clipped to the face
    far = 1 if yaw > 0 else -1
    soft_fill(layer, [P(far * 0.12, -0.5), P(far * 0.5, -0.5), P(far * 0.5, 0.52), P(far * 0.2, 0.52), P(far * 0.17, 0.2)],
              skin_sh, 0.55, h * 0.06, clip=face)                                         # far cheek turns away from the light
    soft_fill(layer, [P(-0.45, -0.5), P(0.45, -0.5), P(0.45, -0.17), P(-0.45, -0.2)], skin_sh, 0.55, h * 0.045, clip=face)   # shadow under the fringe
    soft_fill(layer, [P(-0.3, 0.42), P(0.3, 0.42), P(0.2, 0.55), P(-0.2, 0.55)], skin_sh, 0.5, h * 0.03, clip=face)           # under the jaw
    soft_fill(layer, [P(far * 0.2, 0.05), P(far * 0.36, 0.0), P(far * 0.34, 0.2), P(far * 0.2, 0.36), P(far * 0.1, 0.46), P(far * 0.14, 0.2)],
              shade(skin_sh, 0.9), 0.6, h * 0.035, clip=face)                                                                  # cheek-to-jaw plane
    soft_fill(layer, [P(-far * 0.16, -0.02), P(-far * 0.06, 0.0), P(-far * 0.06, 0.2), P(-far * 0.17, 0.12)], skin_sh, 0.18, h * 0.03, clip=face)
    soft_ellipse(layer, *P(0.05 * yaw, -0.12), 0.1 * h, 0.12 * h, (255, 255, 255), 0.22, h * 0.05, clip=face)                 # forehead highlight
    _outline(pen, face, True, thin * 1.15)

    if not back_view:
        _semi_features(pen, layer, sheet, ex_, skin, skin_sh, hx, hy, h, yaw, f, male, look_up, thin, P, face)

    # ---- hair (front)
    _semi_hair_front(pen, layer, sheet, hx, hy, h, yaw, f, male, long_hair, bob, hair, hair_dk, hair_hi, thin, P, light_side, rng, back_view, face)

    if sheet.accessory == "glasses" and not back_view:
        _glasses(pen, hx, hy, h, yaw, f, thin, P)

    head_box = (hx - 0.62 * h, hy - 0.72 * h, hx + 0.62 * h, hy + 0.52 * h)
    face_box = (hx - 0.4 * h, hy - 0.3 * h, hx + 0.4 * h, hy + 0.5 * h)
    body_box = (hx - (sw + 0.6) * h, hy - 0.72 * h, hx + (sw + 0.6) * h, feet + 0.15 * h)
    samples = {"skin": (hx, hy + 0.42 * h, sheet.skin), "hair": (hx, hy - 0.58 * h, sheet.hair),
               "outfit": (hx - 0.4 * sw * h, sy + 0.95 * h, sheet.outfit)}
    return FigureResult(sheet.name, head_box, face_box, body_box, samples)


# --------------------------------------------------------------------------- facial features
def _semi_features(pen, layer, sheet, ex_, skin, skin_sh, hx, hy, h, yaw, f, male, look_up, thin, P, face):
    eye_mode = ex_["eye"]
    spacing = 0.172
    ey = hy + 0.03 * h
    w0 = 0.106 * h * (0.93 if male else 1.0)
    iris_c = sheet.eye
    lash_col = (28, 22, 30)
    openness = 1.0 if isinstance(eye_mode, str) else float(eye_mode)
    if sheet.eye_shape == "sharp":
        openness *= 0.88
    blush = ex_.get("blush")

    # cheek colour
    bl = 1.0 if blush else (0.0 if male else 0.35)
    if bl > 0:
        for s in (-1, 1):
            c = P(s * 0.22, 0.17)
            soft_ellipse(layer, c[0], c[1], 0.11 * h, 0.065 * h, (238, 118, 128), 0.34 * bl, h * 0.05, clip=face)

    for s in (-1, 1):
        far = (s == f)
        cx = P(s * spacing, 0)[0]
        w = w0 * (0.86 if far else 1.0)
        o = openness
        up = 0.074 * h * min(o, 1.3)
        lo = 0.04 * h * min(o, 1.15)
        inner = (cx - s * w, ey + 0.012 * h)
        outer = (cx + s * w, ey - 0.014 * h)
        if isinstance(eye_mode, str):
            # closed eye: a single curved lash line (smiling arcs up, sleeping / crying arcs down)
            sgn = -1 if eye_mode == "arc_up" else 1
            line = smooth_open([inner, (cx - s * w * 0.4, ey + sgn * 0.034 * h), (cx + s * w * 0.3, ey + sgn * 0.046 * h), outer], 8)
            taper(pen, line, thin * 1.2, thin * 2.8, lash_col)
        else:
            upper = smooth_open([inner, (cx - s * w * 0.55, ey - up * 0.7), (cx + s * w * 0.1, ey - up), (cx + s * w * 0.68, ey - up * 0.78), outer], 8)
            lower = smooth_open([outer, (cx + s * w * 0.6, ey + lo * 0.7), (cx - s * w * 0.05, ey + lo), (cx - s * w * 0.62, ey + lo * 0.7), inner], 8)
            eye_poly = upper + lower
            x0, y0, x1, y1 = _bbox(eye_poly, 3)
            tw, th = x1 - x0, y1 - y0
            tile = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
            td = ImageDraw.Draw(tile)
            local = [(x - x0, y - y0) for x, y in eye_poly]
            td.polygon(local, fill=(238, 232, 236, 255))
            ir = 0.082 * h * (1.0 if o >= 0.9 else 0.93)
            look = ex_.get("look", 0.0) * 0.02 * h * f
            icx = cx + look + f * 0.012 * h - x0
            icy = ey + 0.002 * h - y0 - (0.012 * h if look_up else 0)
            # iris: dark rim, saturated body, lighter lower crescent, pupil, two catchlights
            td.ellipse([icx - ir, icy - ir * 1.12, icx + ir, icy + ir * 1.12], fill=shade(iris_c, 0.5) + (255,))
            td.ellipse([icx - ir * 0.86, icy - ir * 0.98, icx + ir * 0.86, icy + ir * 1.0], fill=iris_c + (255,))
            td.pieslice([icx - ir * 0.8, icy - ir * 0.7, icx + ir * 0.8, icy + ir * 0.95], 15, 165, fill=mix(iris_c, (255, 255, 255), 0.35) + (255,))
            pr = ir * (0.28 if ex_.get("small_pupil") else 0.42)
            td.ellipse([icx - pr, icy - pr, icx + pr, icy + pr], fill=(12, 10, 18, 255))
            td.ellipse([icx - ir * 0.5, icy - ir * 0.55, icx - ir * 0.12, icy - ir * 0.17], fill=(255, 255, 255, 245))
            td.ellipse([icx + ir * 0.2, icy + ir * 0.3, icx + ir * 0.4, icy + ir * 0.5], fill=(255, 255, 255, 200))
            # lid shadow across the top of the eyeball
            td.polygon([(px, py) for px, py in [(x - x0, y - y0) for x, y in upper]] + [(px - x0, py - y0 + up * 0.55) for px, py in upper[::-1]],
                       fill=(60, 40, 55, 120))
            clip = Image.new("L", (tw, th), 0)
            ImageDraw.Draw(clip).polygon(local, fill=255)
            tile.putalpha(ImageChops.multiply(tile.getchannel("A"), clip))
            layer.alpha_composite(tile, (x0, y0))
            # double eyelid crease, then the heavy upper lash line with an outer flick
            crease = [(px, py - 0.03 * h) for px, py in upper[2:-1]]
            taper(pen, crease, thin * 0.3, thin * 0.9, shade(skin, 0.5), 150)
            taper(pen, upper, thin * 1.8, thin * 3.8, lash_col, wmid=thin * 4.2)
            soft_fill(layer, [(px, py - 0.004 * h) for px, py in upper] + [(px, py - 0.07 * h) for px, py in upper[::-1]], (214, 140, 150) if not male else skin_sh, 0.28, h * 0.02, clip=face)
            flick = [outer, (outer[0] + s * 0.04 * h, outer[1] - 0.012 * h), (outer[0] + s * 0.075 * h, outer[1] - 0.03 * h)]
            taper(pen, flick, thin * 2.2, thin * 0.2, lash_col)
            if not male:
                for t in (0.5, 0.64, 0.78, 0.9):
                    bx, by = upper[int(t * (len(upper) - 1))]
                    taper(pen, [(bx, by), (bx + s * 0.02 * h, by - 0.025 * h), (bx + s * 0.04 * h, by - 0.04 * h)], thin * 1.1, thin * 0.15, lash_col, 220)
            taper(pen, lower[2:-2], thin * 0.5, thin * 0.5, (120, 92, 98), 150)
            soft_ellipse(layer, cx, ey + 0.065 * h, w * 0.95, 0.025 * h, skin_sh, 0.32, h * 0.025, clip=face)    # soft shadow under the eye

        # brow: a tapered arch (thicker, flatter for male characters)
        tilt = ex_["tilt"] * 0.04 * h
        by = ey - 0.125 * h - ex_["lift"] * h
        if ex_.get("brow_one") and far:
            by -= 0.035 * h
        thick = (0.026 if male else 0.016) * h
        brow = smooth_open([(cx - s * w * 1.0, by + 0.012 * h + tilt), (cx - s * w * 0.1, by - (0.006 if male else 0.016) * h),
                            (cx + s * w * 0.85, by - 0.004 * h - tilt * 0.4), (cx + s * w * 1.25, by + 0.022 * h - tilt * 0.4)], 8)
        taper(pen, brow, thick * 0.8, thick * 0.12, shade(sheet.hair, 0.65), 235, wmid=thick)

    # nose: bridge shade, nostril hooks, soft tip highlight (nothing like a cartoon "L")
    nx = P(0.012 * f, 0)[0]
    ny = hy + 0.175 * h
    soft_fill(layer, [(nx - f * 0.015 * h, hy + 0.0 * h), (nx - f * 0.05 * h, ny), (nx - f * 0.01 * h, ny + 0.01 * h)], skin_sh, 0.5, h * 0.015, clip=face)
    taper(pen, smooth_open([(nx - 0.045 * h, ny + 0.002 * h), (nx - 0.03 * h, ny + 0.022 * h), (nx - 0.01 * h, ny + 0.02 * h)], 6), thin * 0.2, thin * 1.1, shade(skin, 0.5), 200)
    taper(pen, smooth_open([(nx + 0.045 * h, ny + 0.002 * h), (nx + 0.03 * h, ny + 0.022 * h), (nx + 0.01 * h, ny + 0.02 * h)], 6), thin * 0.2, thin * 1.1, shade(skin, 0.5), 200)
    soft_ellipse(layer, nx + f * 0.004 * h, ny - 0.012 * h, 0.022 * h, 0.014 * h, (255, 255, 255), 0.3, h * 0.012, clip=face)

    # mouth
    mx = P(0.01 * f, 0)[0]
    my = hy + 0.31 * h
    mw = (0.07 if male else 0.062) * h
    kind = ex_["mouth"]
    lipc = mix(skin, (196, 84, 96), 0.22 if male else 0.7)
    ends = {"smile": -0.016, "small_smile": -0.01, "frown": 0.014, "smirk": -0.01, "wavy": 0.0, "wavy_small": 0.0}.get(kind, 0.0) * h
    asym = (-0.018 * h * f) if kind == "smirk" else 0.0
    open_amt = {"open_big": 0.085, "frown_open": 0.06, "o": 0.06, "grit": 0.03}.get(kind, 0.0) * h
    left_end = (mx - mw, my + ends)
    right_end = (mx + mw, my + ends + asym)
    if kind == "o":
        left_end, right_end = (mx - mw * 0.5, my), (mx + mw * 0.5, my)
    if open_amt > 0:
        mouth = smooth_closed([left_end, (mx - mw * 0.4, my - 0.01 * h), (mx, my - 0.006 * h), (mx + mw * 0.4, my - 0.01 * h), right_end,
                               (mx + mw * 0.5, my + open_amt), (mx, my + open_amt * 1.15), (mx - mw * 0.5, my + open_amt)], 6)
        pen.d.polygon(mouth, fill=(96, 30, 40, 255))
        pen.m.polygon(mouth, fill=255)
        teeth = [(mx - mw * 0.6, my - 0.004 * h), (mx + mw * 0.6, my - 0.004 * h), (mx + mw * 0.5, my + open_amt * 0.4), (mx - mw * 0.5, my + open_amt * 0.4)]
        pen.d.polygon(teeth, fill=(248, 244, 244, 255))
        pen.d.pieslice([mx - mw * 0.5, my + open_amt * 0.45, mx + mw * 0.5, my + open_amt * 1.5], 0, 180, fill=(214, 108, 118, 255))
        _outline(pen, mouth, True, thin * 0.9)
    else:
        up_l = smooth_closed([left_end, (mx - mw * 0.45, my - 0.014 * h + ends * 0.3), (mx, my - 0.007 * h), (mx + mw * 0.45, my - 0.014 * h + ends * 0.3), right_end,
                              (mx, my + 0.003 * h)], 5)
        lo_l = smooth_closed([left_end, (mx, my + 0.004 * h), right_end, (mx + mw * 0.55, my + 0.026 * h + ends * 0.4), (mx, my + 0.034 * h + ends * 0.3),
                              (mx - mw * 0.55, my + 0.026 * h + ends * 0.4)], 5)
        pen.d.polygon(lo_l, fill=lipc + (255,))
        pen.d.polygon(up_l, fill=shade(lipc, 0.86) + (255,))
        soft_ellipse(layer, mx, my + 0.02 * h, mw * 0.4, 0.007 * h, (255, 255, 255), 0.45, h * 0.006)
        taper(pen, smooth_open([left_end, (mx - mw * 0.4, my + 0.002 * h + ends * 0.3), (mx, my + 0.004 * h), (mx + mw * 0.4, my + 0.002 * h + ends * 0.3), right_end], 8),
              thin * 0.4, thin * 0.4, (110, 58, 66), 255, wmid=thin * 1.6)
        taper(pen, smooth_open([left_end, (mx - mw * 0.55, my + 0.026 * h), (mx, my + 0.034 * h), (mx + mw * 0.55, my + 0.026 * h), right_end], 8),
              thin * 0.2, thin * 0.2, shade(skin, 0.5), 120, wmid=thin * 0.8)
    if ex_.get("tear"):
        for s in (-1, 1):
            tx = P(s * spacing, 0)[0] + s * 0.04 * h
            pen.d.polygon([(tx, ey + 0.07 * h), (tx - 0.018 * h, ey + 0.13 * h), (tx, ey + 0.17 * h), (tx + 0.018 * h, ey + 0.13 * h)], fill=(190, 225, 255, 200))
    if ex_.get("sweat"):
        tx, ty = hx + f * 0.34 * h, hy - 0.2 * h
        pen.d.polygon([(tx, ty - 0.06 * h), (tx - 0.03 * h, ty + 0.01 * h), (tx, ty + 0.05 * h), (tx + 0.03 * h, ty + 0.01 * h)], fill=(200, 230, 255, 225), outline=INK + (255,))


# --------------------------------------------------------------------------- hair
def _strands(pen: Pen, starts, ends, n, h, thin, dark, light, rng, bulge: float, sway: float, clip):
    """Flowing strand lines between two edges (dark ink strands + lighter highlight strands),
    drawn on a scratch tile and clipped to the hair shape so no strand ever crosses the face."""
    x0, y0, x1, y1 = _bbox(clip, 2)
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(pen.layer.width, x1), min(pen.layer.height, y1)
    if x1 <= x0 or y1 <= y0:
        return
    tile = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    tp = Pen(tile, Image.new("L", tile.size, 0), pen.lw, pen.ink)
    off = lambda p: (p[0] - x0, p[1] - y0)  # noqa: E731
    for i in range(n):
        u = (i + rng.uniform(-0.3, 0.3)) / max(1, n - 1)
        u = min(1.0, max(0.0, u))
        a = _lerp_path(starts, u)
        b = _lerp_path(ends, min(1.0, max(0.0, u + rng.uniform(-0.06, 0.06))))
        c1 = (a[0] + bulge * h * (1 + rng.uniform(-0.2, 0.2)), a[1] + (b[1] - a[1]) * 0.3)
        c2 = (b[0] - sway * h + rng.uniform(-0.04, 0.04) * h, a[1] + (b[1] - a[1]) * 0.7)
        pts = [off(p) for p in _bez(a, c1, c2, b, 12)]
        if rng.random() < 0.32:
            taper(tp, pts, thin * 0.2, thin * 1.2, light, 175, wmid=thin * 1.7)
        else:
            taper(tp, pts, thin * 0.2, thin * 0.15, dark, 215, wmid=thin * 1.15)
    cm = Image.new("L", tile.size, 0)
    ImageDraw.Draw(cm).polygon([off(p) for p in clip], fill=255)
    tile.putalpha(ImageChops.multiply(tile.getchannel("A"), cm))
    pen.layer.alpha_composite(tile, (x0, y0))


def _lerp_path(path, u):
    if len(path) == 1:
        return path[0]
    t = u * (len(path) - 1)
    i = min(len(path) - 2, int(t))
    r = t - i
    return (path[i][0] + (path[i + 1][0] - path[i][0]) * r, path[i][1] + (path[i + 1][1] - path[i][1]) * r)


def _semi_hair_front(pen, layer, sheet, hx, hy, h, yaw, f, male, long_hair, bob, hair, hair_dk, hair_hi, thin, P, light_side, rng, back_view, face):
    if back_view:
        cap = smooth_closed([P(-0.5, 0.2), P(-0.55, -0.3), P(-0.32, -0.62), P(0, -0.7), P(0.32, -0.62), P(0.55, -0.3), P(0.5, 0.2), P(0.3, 0.5), P(0, 0.56), P(-0.3, 0.5)], 6)
        pen.poly(cap, hair, line=False)
        soft_fill(layer, cap, hair_dk, 0.5, h * 0.08, clip=cap)
        _outline(pen, cap, True, thin)
        return
    part = -0.05 * f if not male else -0.12
    if long_hair:
        length = 0.95 if bob else 2.0
        for s in (-1, 1):
            far = (s == f)
            L = length * (0.97 if far else 1.0)
            curtain = smooth_closed([
                P(part, -0.6), P(s * 0.28, -0.62), P(s * 0.5, -0.42), P(s * 0.575, -0.1), P(s * 0.6, 0.35), P(s * 0.66, 0.4 + (L - 0.4) * 0.5),
                P(s * 0.6, L - 0.05), P(s * 0.46, L), P(s * 0.4, L - 0.4), P(s * 0.34, 0.55), P(s * 0.35, 0.18), P(s * 0.315, -0.04),
                P(s * 0.255, -0.2), P(s * 0.15, -0.33), P(part + s * 0.04, -0.4)], 5)
            pen.poly(curtain, hair, line=False)
            soft_fill(layer, curtain, hair_dk, 0.38, h * 0.09, clip=curtain)         # form shadow toward the face edge
            hl = [P(s * 0.3, -0.5), P(s * 0.5, -0.3), P(s * 0.52, 0.2), P(s * 0.5, 0.2), P(s * 0.4, -0.3), P(s * 0.25, -0.46)]
            soft_fill(layer, hl, hair_hi, 0.55, h * 0.05, clip=curtain)
            starts = [P(part + s * 0.02, -0.56), P(s * 0.14, -0.5), P(s * 0.3, -0.38), P(s * 0.5, -0.2)]
            ends = [P(s * 0.4, L - 0.35), P(s * 0.5, L - 0.1), P(s * 0.58, L - 0.05)]
            _strands(pen, starts, ends, 44, h, thin, hair_dk, hair_hi, rng, bulge=s * 0.16, sway=-s * 0.04, clip=curtain)
            _outline(pen, curtain, True, thin * 0.95)
        # the parting itself
        taper(pen, smooth_open([P(part, -0.64), P(part + 0.01, -0.58), P(part + 0.015, -0.5)], 5), thin * 0.2, thin * 1.4, hair_dk, 200)
        if bob or sheet.hair_style == "ponytail":
            pass
    else:
        # short side-swept cut (the line-art reference): part on one side, long locks sweeping across the forehead
        swp = -1 if f > 0 else 1                      # sweep direction
        cap = smooth_closed([P(-0.4, 0.1), P(-0.5, -0.28), P(-0.34, -0.6), P(0, -0.7), P(0.34, -0.6), P(0.5, -0.28), P(0.42, 0.08),
                             P(0.4, -0.1), P(0.33, -0.27), P(swp * -0.05, -0.34), P(swp * 0.1, -0.42), P(-0.33, -0.2), P(-0.38, -0.06)], 5)
        pen.poly(cap, hair, line=False)
        soft_fill(layer, cap, hair_dk, 0.5, h * 0.07, clip=cap)
        locks = []
        for k in range(4):
            y0 = -0.5 + 0.05 * k
            lock = smooth_closed([P(swp * 0.16, y0 - 0.1), P(swp * -0.05 - swp * 0.2 * k * 0.3, y0 - 0.02), P(-swp * (0.3 + 0.03 * k), y0 + 0.17 + 0.03 * k),
                                  P(-swp * (0.4 + 0.02 * k), y0 + 0.22), P(-swp * (0.2 + 0.03 * k), y0 + 0.08), P(swp * 0.1, y0 - 0.0)], 5)
            locks.append(lock)
        for lock in locks:
            pen.poly(lock, mix(hair, hair_hi, 0.08), line=False)
            _outline(pen, lock, True, thin * 0.8)
        starts = [P(swp * 0.14, -0.62), P(swp * 0.0, -0.64), P(-swp * 0.2, -0.6), P(-swp * 0.4, -0.45)]
        ends = [P(swp * 0.2, -0.28), P(-swp * 0.1, -0.26), P(-swp * 0.34, -0.12)]
        _strands(pen, starts, ends, 26, h, thin, hair_dk, hair_hi, rng, bulge=-swp * 0.07, sway=0.0, clip=cap)
        soft_fill(layer, [P(-0.3, -0.55), P(0.3, -0.55), P(0.25, -0.38), P(-0.25, -0.4)], hair_hi, 0.4, h * 0.05, clip=cap)
        _outline(pen, cap, True, thin * 1.1)
        for s in (-1, 1):   # sideburns over the ears
            sb = [P(s * 0.4, -0.12), P(s * 0.45, 0.0), P(s * 0.42, 0.14), P(s * 0.38, 0.05), P(s * 0.37, -0.1)]
            pen.poly(sb, hair, line=False)
            _outline(pen, sb, True, thin * 0.8)


def _glasses(pen: Pen, hx, hy, h, yaw, f, thin, P):
    ey = hy + 0.03 * h
    frame = (66, 68, 80)
    lens = []
    for s in (-1, 1):
        cx = P(s * 0.172, 0)[0]
        far = (s == f)
        w = 0.128 * h * (0.88 if far else 1.0)
        rect = smooth_closed([(cx - w, ey - 0.07 * h), (cx + w, ey - 0.08 * h), (cx + w * 1.02, ey + 0.065 * h), (cx - w * 0.95, ey + 0.075 * h)], 6)
        _blend_poly(pen.layer, rect, (225, 236, 248), 34)
        _outline(pen, rect, True, thin * 0.9, frame)
        lens.append((cx, w))
    a, b = lens[0], lens[1]
    taper(pen, [(a[0] + a[1], ey - 0.02 * h), (hx + 0.0, ey - 0.03 * h), (b[0] - b[1], ey - 0.02 * h)], thin * 0.8, thin * 0.8, frame)
    for s, (cx, w) in zip((-1, 1), lens):
        if s == -f:   # the near temple arm runs back to the ear
            taper(pen, [(cx + s * w, ey - 0.04 * h), (cx + s * (w + 0.12 * h), ey - 0.03 * h), (cx + s * (w + 0.2 * h), ey + 0.0 * h)], thin * 0.8, thin * 0.8, frame)
