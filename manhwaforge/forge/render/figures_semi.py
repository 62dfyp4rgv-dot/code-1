"""Semi-realistic Korean-manhwa figure renderer, painted rather than assembled from flat shapes.

Everything is drawn through `Paint` (see paint.py): colour is painted per material and then
volume-shaded from the silhouettes, lines are pressure-varying pen strokes on their own layer, and
surfaces get paper / brush grain. Same contract as figures.draw_figure, so staging, lettering and the
Critic are unchanged.
"""
from __future__ import annotations

import math
import random

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

from ..models import CharacterSheet, StyleProfile
from .figures import EXPRESSIONS, FigureResult, canonical_expression
from .paint import Paint, smoothstep
from .util import RGB, mix, shade, smooth_closed, smooth_open

INK: RGB = (44, 36, 44)          # warm dark grey-brown: softer than pure black, like the references


# --------------------------------------------------------------------------- geometry helpers
def _bez(p0, p1, p2, p3, n=14):
    out = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        out.append((u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]))
    return out


def _lerp_path(path, u):
    if len(path) == 1:
        return path[0]
    t = u * (len(path) - 1)
    i = min(len(path) - 2, int(t))
    r = t - i
    return (path[i][0] + (path[i + 1][0] - path[i][0]) * r, path[i][1] + (path[i + 1][1] - path[i][1]) * r)


def _limb_poly(path, widths, cap_start: bool = True, cap_end: bool = True):
    """Outline of a tapered, smooth limb along `path` with the given widths at the path's control points."""
    if len(path) > 2:
        pts = smooth_open(path, 6)
    else:
        pts = [(path[0][0] + (path[1][0] - path[0][0]) * i / 10, path[0][1] + (path[1][1] - path[0][1]) * i / 10) for i in range(11)]
    n = len(pts)
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        a, b = pts[max(0, i - 1)], pts[min(n - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / L, dx / L
        u = i / (n - 1) * (len(widths) - 1)
        k = min(len(widths) - 2, int(u))
        w = widths[k] + (widths[k + 1] - widths[k]) * (u - k)
        left.append((x + nx * w / 2, y + ny * w / 2))
        right.append((x - nx * w / 2, y - ny * w / 2))
    poly = left
    if cap_end:
        ex, ey = pts[-1]
        ang = math.atan2(pts[-1][1] - pts[-2][1], pts[-1][0] - pts[-2][0])
        w = widths[-1]
        poly += [(ex + math.cos(ang + math.pi / 2 - math.pi * t / 6) * w / 2, ey + math.sin(ang + math.pi / 2 - math.pi * t / 6) * w / 2) for t in range(1, 6)]
    poly += right[::-1]
    if cap_start:
        sx, sy = pts[0]
        ang = math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0])
        w = widths[0]
        poly += [(sx + math.cos(ang - math.pi / 2 - math.pi * t / 6) * w / 2, sy + math.sin(ang - math.pi / 2 - math.pi * t / 6) * w / 2) for t in range(1, 6)]
    return poly


def limb(P: Paint, path, widths, color: RGB, mat: str, thin: float, cap_start=True, cap_end=True, outline=True):
    poly = _limb_poly(path, widths, cap_start, cap_end)
    P.fill(poly, color, mat)
    if outline:
        P.contour(poly, thin * 0.9, pieces=2)
    return poly


# --------------------------------------------------------------------------- main
def draw_figure_semi(layer: Image.Image, mask: Image.Image, sheet: CharacterSheet, expression: str, pose: str,
                     hx: float, hy: float, h: float, facing: int, style: StyleProfile, lw: int, light_side: int,
                     back_view: bool = False, look_up: bool = False, ss: int = 2) -> FigureResult:
    f = 1 if facing >= 0 else -1
    yaw = 0.0 if back_view else 0.5 * f
    male = sheet.gender == "male"
    ex_ = EXPRESSIONS[canonical_expression(expression)]
    skin = sheet.skin
    skin_sh = mix(skin, (150, 100, 100), 0.30)
    thin = max(0.8, min(lw * 0.85, 0.016 * h))      # a small figure must not get a poster-sized pen

    bw = {"slim": 0.9, "average": 1.0, "broad": 1.12}.get(sheet.build, 1.0)
    sw = (0.98 if male else 0.82) * bw
    sy = hy + 0.60 * h
    wy = sy + 1.7 * h
    hip = wy + 1.0 * h                       # crotch sits ~4 heads below the top of the head
    feet = hy - 0.5 * h + sheet.head_units * h
    if pose == "slumped":
        hy += 0.1 * h
        sy += 0.05 * h

    long_hair = sheet.hair_style in ("long", "ponytail", "bob") or (not male and sheet.hair_style not in ("spiky", "short"))
    reach = (sw + 1.0) * h
    L = style.looseness
    P = Paint(layer, mask, (hx - reach, hy - 0.95 * h, hx + reach, feet + 0.3 * h), lw, h, light_side, sheet.seed, mix(INK, (12, 10, 12), L), L)
    hair, hair_dk = sheet.hair, shade(sheet.hair, 0.55)
    hair_hi = mix(sheet.hair, (255, 255, 255), 0.52)
    P.sheen = mix(sheet.hair, (255, 255, 255), 0.7)

    def W(x: float) -> float:
        return x * (1 - 0.17 * yaw) if x > 0 else x * (1 + 0.05 * yaw)

    def Pt(x: float, y: float) -> tuple[float, float]:
        return (hx + W(x) * h + yaw * 0.035 * h, hy + y * h)

    bob = sheet.hair_style == "bob"
    length = 0.85 if bob else 2.0
    # ---- long hair mass behind the body
    if long_hair:
        back = smooth_closed([Pt(-0.56, -0.25), Pt(-0.62, 0.3), Pt(-0.66, 1.0), Pt(-0.62, length), Pt(-0.2, length + 0.08), Pt(0.2, length + 0.08),
                              Pt(0.62, length), Pt(0.66, 1.0), Pt(0.62, 0.3), Pt(0.56, -0.25), Pt(0.3, -0.62), Pt(0, -0.7), Pt(-0.3, -0.62)], 5)
        P.fill(back, shade(hair, 0.8), "hair")
        P.contour(back, thin * 0.7, alpha=170, pieces=3)

    # ---- legs
    pants = shade(sheet.outfit_shade, 0.7)
    wide = pose in ("fight", "running")
    for s in (-1, 1):
        hipx = hx + s * 0.28 * h * sw
        kneex = hx + s * (0.3 if wide else 0.17) * h * sw * (1.5 if wide else 1.0)
        ankx = hx + s * (0.55 if wide else 0.2) * h * sw * (1.5 if wide else 1.0)
        knee_y = (hip + feet) / 2 - 0.1 * h
        limb(P, [(hipx, hip - 0.1 * h), (kneex, knee_y), (ankx, feet - 0.15 * h)], [0.40 * h * sw, 0.29 * h * sw, 0.18 * h], pants, "cloth", thin, cap_start=False)
        toe = 0.26 if s > 0 else -0.26
        shoe = smooth_closed([(ankx - 0.1 * h, feet - 0.2 * h), (ankx + 0.1 * h, feet - 0.2 * h), (ankx + toe * h, feet + 0.02 * h),
                              (ankx + toe * 0.9 * h, feet + 0.1 * h), (ankx - toe * 0.05 * h, feet + 0.1 * h)], 4)
        P.fill(shoe, shade(sheet.outfit_shade, 0.35), "cloth")
        P.contour(shoe, thin * 0.9, pieces=2)

    # ---- arms hanging behind the torso line
    arms_first = pose in ("standing", "slumped", "sit")
    if arms_first:
        _arms(P, sheet, "standing", hx, sy, wy, h, sw, f, skin, thin, male, behind=True)

    # ---- torso
    shirt = sheet.outfit
    torso = smooth_closed([(hx - 0.17 * h, sy - 0.04 * h), (hx - sw * h * 0.6, sy + 0.05 * h), (hx - sw * h * 0.98, sy + 0.3 * h),
                           (hx - sw * h * 0.93, sy + 1.1 * h), (hx - 0.64 * sw * h, wy), (hx - 0.72 * sw * h, hip - 0.35 * h),
                           (hx + 0.72 * sw * h, hip - 0.35 * h), (hx + 0.64 * sw * h, wy), (hx + sw * h * 0.93, sy + 1.1 * h),
                           (hx + sw * h * 0.98, sy + 0.3 * h), (hx + sw * h * 0.6, sy + 0.05 * h), (hx + 0.17 * h, sy - 0.04 * h)], 5)
    P.fill(torso, shirt, "cloth")
    P.contour(torso, thin, pieces=4)
    st = sheet.outfit_style
    for s in (-1, 1):   # soft cloth folds
        fold = smooth_open([(hx + s * 0.55 * sw * h, sy + 0.5 * h), (hx + s * 0.4 * sw * h, sy + 1.0 * h), (hx + s * 0.5 * sw * h, wy)], 6)
        P.taper(fold, thin * 0.3, thin * 0.3, shade(shirt, 0.55), 110, wmid=thin * 1.6)
    if st in ("coat", "armor", "robe"):
        _heavy_outfit(P, sheet, hx, sy, wy, hip, h, sw, thin)

    if not arms_first:
        _arms(P, sheet, pose if pose in ("fight", "crossed", "pointing", "running") else "standing", hx, sy, wy, h, sw, f, skin, thin, male, behind=False)

    # ---- neck + collar
    nk = 0.14 if male else 0.115
    neck = smooth_closed([(hx - nk * h, hy + 0.3 * h), (hx + nk * h, hy + 0.3 * h), (hx + (nk + 0.045) * h, sy + 0.06 * h), (hx - (nk + 0.045) * h, sy + 0.06 * h)], 4)
    P.fill(neck, mix(skin, skin_sh, 0.2), "neck")
    P.hand_line([(hx - nk * h, hy + 0.3 * h), (hx - (nk + 0.04) * h, sy + 0.05 * h)], thin * 0.9)
    P.hand_line([(hx + nk * h, hy + 0.3 * h), (hx + (nk + 0.04) * h, sy + 0.05 * h)], thin * 0.9)
    if st in ("shirt", "casual", "uniform", "coat", "robe", "armor"):
        white = (238, 238, 244) if st == "uniform" else mix(shirt, (255, 255, 255), 0.1)
        v = smooth_closed([(hx - 0.2 * h, sy - 0.03 * h), (hx, sy + 0.5 * h), (hx + 0.2 * h, sy - 0.03 * h)], 4)
        P.fill(v, mix(skin, skin_sh, 0.3), "neck")
        for sgn in (-1, 1):
            c = smooth_closed([(hx + sgn * 0.2 * h, sy - 0.03 * h), (hx + sgn * 0.02 * h, sy + 0.5 * h), (hx + sgn * 0.37 * h, sy + 0.27 * h), (hx + sgn * 0.31 * h, sy - 0.05 * h)], 4)
            P.fill(c, shirt if st != "uniform" else white, "cloth")
            P.soft_fill(c, shade(shirt, 0.7), 0.3, h * 0.02, clip=c)
            P.contour(c, thin, pieces=2)
        P.hand_line([(hx, sy + 0.5 * h), (hx, wy + 0.2 * h)], thin * 0.8, alpha=190)
        for k in (0.8, 1.15):
            by = sy + k * h
            P.fill_ellipse([hx - 0.025 * h, by - 0.025 * h, hx + 0.025 * h, by + 0.025 * h], shade(shirt, 1.25 if sum(shirt) < 300 else 0.8))
            P.contour([(hx + math.cos(a) * 0.025 * h, by + math.sin(a) * 0.025 * h) for a in [i * math.pi / 6 for i in range(12)]], thin * 0.6, pieces=1)
        if st == "uniform":
            tie = smooth_closed([(hx - 0.06 * h, sy + 0.42 * h), (hx + 0.06 * h, sy + 0.42 * h), (hx + 0.09 * h, sy + 1.25 * h), (hx, sy + 1.4 * h), (hx - 0.09 * h, sy + 1.25 * h)], 3)
            P.fill(tie, sheet.accent, "cloth")
            P.contour(tie, thin * 0.9, pieces=2)
    for s in (-1, 1):   # clavicles
        cl = smooth_open([(hx + s * 0.05 * h, sy + 0.06 * h), (hx + s * 0.16 * h, sy + 0.02 * h), (hx + s * 0.3 * h, sy + 0.07 * h)], 6)
        P.taper(cl, thin * 0.2, thin * 0.9, shade(skin, 0.6), 130)

    # ---- head (tilted a little: a dead-frontal, perfectly symmetric head is what makes a figure look constructed)
    tilt = (1 if sheet.seed % 2 else -1) * (0.03 + 0.12 * L) * (0.4 if back_view else 1.0)
    P.set_rotation(tilt, (hx, hy + 0.62 * h))
    if male:
        unit = [(0.0, -0.5), (0.30, -0.46), (0.35, -0.28), (0.355, -0.02), (0.34, 0.15), (0.29, 0.3), (0.2, 0.41), (0.11, 0.474), (0.04, 0.495), (0.0, 0.5)]
    else:
        unit = [(0.0, -0.5), (0.285, -0.46), (0.335, -0.28), (0.33, -0.04), (0.30, 0.12), (0.235, 0.27), (0.165, 0.38), (0.095, 0.455), (0.04, 0.492), (0.0, 0.5)]
    pts = [Pt(x, y) for x, y in unit] + [Pt(-x, y) for x, y in reversed(unit[1:-1])]
    face = smooth_closed(pts, 6)
    for s in (-1, 1):   # ears
        vis = 1.0 if s == -f else 0.45
        ec = Pt(s * 0.355, 0.06)
        ear = smooth_closed([(ec[0] - s * 0.01 * h, ec[1] - 0.075 * h), (ec[0] + s * 0.05 * h * vis, ec[1] - 0.03 * h), (ec[0] + s * 0.045 * h * vis, ec[1] + 0.06 * h), (ec[0], ec[1] + 0.09 * h)], 5)
        P.fill(ear, mix(skin, skin_sh, 0.25), "skin")
        P.contour(ear, thin * 0.8, pieces=1)
    P.fill(face, skin, "skin")
    P.contour(face, thin * 1.15, pieces=3)
    P.soft_ellipse(*Pt(0.05 * yaw, -0.12), 0.1 * h, 0.12 * h, (255, 255, 255), 0.18, h * 0.05, clip=face)
    if not back_view:
        _model_face(P, skin, skin_sh, hx, hy, h, yaw, f, light_side, male, L, Pt, face)

    if not back_view:
        _features(P, sheet, ex_, skin, skin_sh, hx, hy, h, yaw, f, male, look_up, thin, Pt, face)
    _hair_front(P, sheet, hx, hy, h, yaw, f, male, long_hair, bob, hair, hair_dk, hair_hi, thin, Pt, light_side, back_view)
    if sheet.accessory == "glasses" and not back_view:
        _glasses(P, hx, hy, h, yaw, f, thin, Pt)

    samples = {"skin": P.pt((hx, hy + 0.42 * h)), "hair": P.pt((hx, hy - 0.58 * h))}
    P.clear_rotation()
    P.finish()

    head_box = (hx - 0.62 * h, hy - 0.72 * h, hx + 0.62 * h, hy + 0.52 * h)
    face_box = (hx - 0.4 * h, hy - 0.3 * h, hx + 0.4 * h, hy + 0.5 * h)
    body_box = (hx - (sw + 0.6) * h, hy - 0.72 * h, hx + (sw + 0.6) * h, feet + 0.15 * h)
    samples = {"skin": (*samples["skin"], sheet.skin), "hair": (*samples["hair"], sheet.hair),
               "outfit": (hx - 0.4 * sw * h, sy + 0.95 * h, sheet.outfit)}
    return FigureResult(sheet.name, head_box, face_box, body_box, samples)


def _model_face(P: Paint, skin, skin_sh, hx, hy, h, yaw, f, light_side, male, L, Pt, face):
    """Hand-painted form zones (what a global shading pass cannot know): eye sockets, cheek hollow, temple,
    nose and lip shadows, plus highlights on the planes that face the light."""
    ss = -light_side                       # side of the face that falls into shadow
    k = 0.7 + 0.6 * L
    dk = mix(skin_sh, (110, 60, 70), 0.35)
    for s in (-1, 1):                      # eye sockets
        c = Pt(s * 0.172, 0.0)
        P.soft_ellipse(c[0], hy + 0.005 * h, 0.15 * h, 0.075 * h, dk, (0.2 if s == ss else 0.1) * k, h * 0.04, clip=face)
    c = Pt(ss * 0.27, 0.12)                # cheek hollow below the cheekbone, on the shadow side
    P.soft_fill([Pt(ss * 0.36, 0.02), Pt(ss * 0.2, 0.12), Pt(ss * 0.15, 0.27), Pt(ss * 0.28, 0.3), Pt(ss * 0.35, 0.18)], dk, 0.42 * k, h * 0.035, clip=face)
    P.soft_ellipse(*Pt(ss * 0.31, -0.12), 0.07 * h, 0.12 * h, dk, 0.3 * k, h * 0.04, clip=face)       # temple
    nx = Pt(0.012 * f, 0)[0]
    P.soft_ellipse(nx, hy + 0.205 * h, 0.07 * h, 0.03 * h, dk, 0.4 * k, h * 0.02, clip=face)           # under the nose
    P.soft_ellipse(Pt(0.01 * f, 0)[0], hy + 0.375 * h, 0.07 * h, 0.03 * h, dk, 0.32 * k, h * 0.02, clip=face)   # under the lower lip
    P.soft_ellipse(nx - ss * 0.012 * h, hy + 0.06 * h, 0.014 * h, 0.075 * h, (255, 255, 255), 0.26 * k, h * 0.012, clip=face)   # nose bridge
    P.soft_ellipse(*Pt(-ss * 0.2, 0.1), 0.07 * h, 0.04 * h, (255, 255, 255), 0.2 * k, h * 0.03, clip=face)    # cheekbone
    P.soft_ellipse(*Pt(0.0, 0.43), 0.06 * h, 0.03 * h, (255, 255, 255), 0.18 * k, h * 0.02, clip=face)        # chin


# --------------------------------------------------------------------------- arms and hands
def _arms(P: Paint, sheet, pose, hx, sy, wy, h, sw, f, skin, thin, male, behind: bool):
    sleeve = sheet.outfit
    k = 1.0 if male else 0.9
    wid = [0.2 * h * k, 0.15 * h * k, 0.105 * h * k]
    lsh = (hx - sw * h * 0.88, sy + 0.24 * h)
    rsh = (hx + sw * h * 0.88, sy + 0.24 * h)
    fs, bs = (rsh, lsh) if f > 0 else (lsh, rsh)

    def unit(a, b):
        L = math.hypot(b[0] - a[0], b[1] - a[1]) or 1.0
        return ((b[0] - a[0]) / L, (b[1] - a[1]) / L)

    def arm(shoulder, elbow, wrist, color, kind):
        limb(P, [shoulder, elbow, wrist], wid, color, "cloth", thin, cap_start=not behind, cap_end=False)
        _hand(P, wrist, unit(elbow, wrist), kind, skin, h, f, thin)

    if pose == "crossed":
        for s, sh in ((-1, lsh), (1, rsh)):
            arm(sh, (hx + s * 0.55 * sw * h, sy + 1.3 * h), (hx - s * 0.5 * sw * h, sy + 0.95 * h), sleeve, "relaxed")
    elif pose == "fight":
        arm(bs, (bs[0] - f * 0.25 * h, bs[1] + 1.1 * h), (bs[0] + f * 0.15 * h, bs[1] + 0.4 * h), shade(sleeve, 0.85), "fist")
        arm(fs, (fs[0] + f * 0.7 * h, fs[1] + 0.85 * h), (fs[0] + f * 1.2 * h, fs[1] - 0.1 * h), sleeve, "fist")
    elif pose == "pointing":
        arm(fs, (fs[0] + f * 1.0 * h, fs[1] + 0.12 * h), (fs[0] + f * 2.0 * h, fs[1] - 0.08 * h), sleeve, "point")
        arm(bs, (bs[0] - f * 0.12 * h, bs[1] + 1.1 * h), (bs[0] - f * 0.06 * h, bs[1] + 2.15 * h), shade(sleeve, 0.88), "relaxed")
    elif pose == "running":
        arm(bs, (bs[0] - f * 0.7 * h, bs[1] + 0.9 * h), (bs[0] - f * 1.1 * h, bs[1] + 0.25 * h), shade(sleeve, 0.85), "fist")
        arm(fs, (fs[0] + f * 0.8 * h, fs[1] + 0.9 * h), (fs[0] + f * 1.3 * h, fs[1] + 0.25 * h), sleeve, "fist")
    else:
        for s, sh in ((-1, lsh), (1, rsh)):
            arm(sh, (sh[0] + s * 0.1 * h, sh[1] + 1.15 * h), (sh[0] + s * 0.05 * h, sh[1] + 2.22 * h), sleeve if s == f else shade(sleeve, 0.9), "relaxed")


def _hand(P: Paint, wrist, d, kind, skin, h, f, thin):
    """A hand with a palm, four fingers and a thumb (not a circle): relaxed, fist or pointing."""
    n = (-d[1], d[0])
    sg = 1.0 if f > 0 else -1.0
    Wp = lambda a, b: (wrist[0] + d[0] * a * h + n[0] * b * h, wrist[1] + d[1] * a * h + n[1] * b * h)  # noqa: E731
    skin_d = mix(skin, (150, 100, 100), 0.12)
    if kind == "fist":
        blob = smooth_closed([Wp(-0.02, -0.1), Wp(0.1, -0.15), Wp(0.26, -0.13), Wp(0.34, 0), Wp(0.26, 0.13), Wp(0.1, 0.15), Wp(-0.02, 0.1)], 5)
        P.fill(blob, skin, "skin")
        P.contour(blob, thin * 0.9, pieces=2)
        for b in (-0.05, 0.0, 0.05):
            P.taper([Wp(0.22, b * 2), Wp(0.3, b * 2.2)], thin * 0.2, thin * 1.0, shade(skin, 0.5), 160)
        th = _limb_poly([Wp(0.06, -0.13 * sg), Wp(0.18, -0.15 * sg), Wp(0.3, -0.07 * sg)], [0.06 * h, 0.055 * h, 0.04 * h])
        P.fill(th, skin_d, "skin")
        P.contour(th, thin * 0.7, pieces=1)
        return
    palm = smooth_closed([Wp(-0.02, -0.085), Wp(0.1, -0.11), Wp(0.24, -0.1), Wp(0.3, 0), Wp(0.24, 0.1), Wp(0.1, 0.11), Wp(-0.02, 0.085)], 5)
    P.fill(palm, skin, "skin")
    P.contour(palm, thin * 0.9, pieces=2)
    lens = [0.27, 0.31, 0.29, 0.23]
    offs = [-0.075, -0.025, 0.025, 0.07]
    for i, (ln, off) in enumerate(zip(lens, offs)):
        if kind == "point" and i != 0:
            base, tip = Wp(0.28, off), Wp(0.38, off * 0.7)           # the other fingers stay curled
        elif kind == "point":
            base, tip = Wp(0.28, off), Wp(0.74, off * 0.8)
        else:
            base, tip = Wp(0.28, off), Wp(0.28 + ln, off + 0.02 * (i - 1.5) * sg)
        mid = ((base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2)
        fp = _limb_poly([base, mid, tip], [0.052 * h, 0.046 * h, 0.034 * h])
        P.fill(fp, skin, "skin")
        P.contour(fp, thin * 0.7, pieces=1)
    th = _limb_poly([Wp(0.06, -0.085 * sg), Wp(0.18, -0.15 * sg), Wp(0.3, -0.17 * sg)], [0.07 * h, 0.06 * h, 0.045 * h])
    P.fill(th, skin_d, "skin")
    P.contour(th, thin * 0.7, pieces=1)


def _heavy_outfit(P: Paint, sheet, hx, sy, wy, hip, h, sw, thin):
    """Coat / armour / robe overlays, painted with the same engine."""
    st, acc = sheet.outfit_style, sheet.accent
    if st == "coat":
        for s in (-1, 1):
            lap = smooth_closed([(hx + s * 0.36 * h, sy - 0.02 * h), (hx + s * 0.1 * h, sy + 0.6 * h), (hx + s * 0.52 * h, sy + 0.52 * h)], 3)
            P.fill(lap, sheet.outfit_shade, "cloth")
            P.contour(lap, thin, pieces=2)
        belt = [(hx - 0.7 * sw * h, wy - 0.05 * h), (hx + 0.7 * sw * h, wy - 0.05 * h), (hx + 0.7 * sw * h, wy + 0.1 * h), (hx - 0.7 * sw * h, wy + 0.1 * h)]
        P.fill(belt, acc, "cloth")
        P.contour(belt, thin * 0.8, pieces=2)
    elif st == "armor":
        plate = smooth_closed([(hx - 0.7 * sw * h, sy + 0.1 * h), (hx + 0.7 * sw * h, sy + 0.1 * h), (hx + 0.55 * sw * h, wy - 0.1 * h), (hx - 0.55 * sw * h, wy - 0.1 * h)], 4)
        P.fill(plate, mix(sheet.outfit, (190, 195, 205), 0.45), "cloth")
        P.contour(plate, thin, pieces=3)
    else:
        sash = [(hx - 0.75 * sw * h, wy - 0.12 * h), (hx + 0.75 * sw * h, wy - 0.12 * h), (hx + 0.75 * sw * h, wy + 0.16 * h), (hx - 0.75 * sw * h, wy + 0.16 * h)]
        P.fill(sash, acc, "cloth")
        P.contour(sash, thin * 0.8, pieces=2)


# --------------------------------------------------------------------------- eyes
def _eye(P: Paint, sheet, ex_, cx, ey, w, s, h, f, far, male, skin, skin_sh, thin, look_up, face_clip, openness):
    """One eye: gradient-painted iris on a lid-shadowed eyeball, heavy lash line, crease, lashes."""
    iris_c = sheet.eye
    lash_col = (28, 22, 30)
    eye_mode = ex_["eye"]
    up = 0.074 * h * min(openness, 1.3)
    lo = 0.04 * h * min(openness, 1.15)
    inner = (cx - s * w, ey + 0.012 * h)
    outer = (cx + s * w, ey - 0.014 * h)
    if isinstance(eye_mode, str):
        sgn = -1 if eye_mode == "arc_up" else 1
        line = smooth_open([inner, (cx - s * w * 0.4, ey + sgn * 0.034 * h), (cx + s * w * 0.3, ey + sgn * 0.046 * h), outer], 8)
        P.taper(line, thin * 1.4, thin * 3.0, lash_col, wmid=thin * 3.4)
        return
    upper = smooth_open([inner, (cx - s * w * 0.55, ey - up * 0.7), (cx + s * w * 0.1, ey - up), (cx + s * w * 0.68, ey - up * 0.78), outer], 8)
    lower = smooth_open([outer, (cx + s * w * 0.6, ey + lo * 0.7), (cx - s * w * 0.05, ey + lo), (cx - s * w * 0.62, ey + lo * 0.7), inner], 8)
    poly = upper + lower
    xs, ys = [p[0] for p in poly], [p[1] for p in poly]
    x0, y0, x1, y1 = int(min(xs)) - 3, int(min(ys)) - 3, int(max(xs)) + 4, int(max(ys)) + 4
    tw, th = x1 - x0, y1 - y0
    yy, xx = np.mgrid[0:th, 0:tw].astype(np.float32)
    top_k = np.clip(yy / max(1.0, th * 0.5), 0, 1)                         # eyeball: warm white, darker under the lid
    ball = np.empty((th, tw, 3), dtype=np.float32)
    ball[:] = np.array((248, 243, 246), dtype=np.float32) * (0.88 + 0.12 * top_k)[..., None]
    ir = 0.082 * h * (1.0 if openness >= 0.9 else 0.93)
    look = ex_.get("look", 0.0) * 0.02 * h * f
    icx = cx + look + f * 0.012 * h - x0
    icy = ey + 0.002 * h - y0 - (0.012 * h if look_up else 0)
    dx, dy = xx - icx, (yy - icy) / 1.12
    rr = np.sqrt(dx * dx + dy * dy) / ir
    ang = np.arctan2(dy, dx)
    ic = np.array(iris_c, dtype=np.float32)
    vert = np.clip((dy / ir + 1) / 2, 0, 1)                                # 0 top .. 1 bottom
    body = ic[None, None, :] * (0.62 + 0.55 * vert[..., None] ** 1.3)      # darker at the lid, glowing below
    body = body * (1 + 0.10 * np.sin(ang * 26 + 3.0 * np.sin(ang * 5))[..., None] * smoothstep(0.25, 0.7, rr)[..., None])
    body = body * (1 - 0.55 * smoothstep(0.78, 0.97, rr)[..., None])      # limbal ring
    pupil_r = 0.28 if ex_.get("small_pupil") else 0.43
    pup = (1 - smoothstep(pupil_r - 0.04, pupil_r + 0.04, rr))[..., None]
    body = body * (1 - pup) + np.array((12, 10, 18), dtype=np.float32) * pup
    inside = (1 - smoothstep(0.96, 1.02, rr))[..., None]
    col = ball * (1 - inside) + body * inside
    for (hx_, hy_, rad, amp) in ((-0.32, -0.38, 0.26, 1.0), (0.26, 0.34, 0.13, 0.8)):    # soft catchlights
        d2 = np.sqrt((xx - (icx + hx_ * ir)) ** 2 + (yy - (icy + hy_ * ir)) ** 2) / (rad * ir)
        g = (np.clip(1 - d2, 0, 1) ** 0.7 * amp)[..., None]
        col = col * (1 - g) + 255.0 * g
    m = Image.new("L", (tw, th), 0)
    ImageDraw.Draw(m).polygon([(px - x0, py - y0) for px, py in poly], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(0.6))
    tile = Image.fromarray(np.dstack([np.clip(col, 0, 255), np.asarray(m, dtype=np.float32)]).astype(np.uint8), "RGBA")
    P.paste_tile(tile, (x0, y0))
    P.soft_fill([(px, py) for px, py in upper] + [(px, py + up * 0.5) for px, py in upper[::-1]], (70, 40, 60), 0.22, h * 0.012, clip=poly)
    P.soft_fill([(px, py - 0.004 * h) for px, py in upper] + [(px, py - 0.07 * h) for px, py in upper[::-1]],
                (214, 140, 150) if not male else skin_sh, 0.26, h * 0.02, clip=face_clip)
    P.taper([(px, py - 0.03 * h) for px, py in upper[2:-1]], thin * 0.3, thin * 0.9, shade(skin, 0.5), 150)       # eyelid crease
    P.taper(upper, thin * 1.8, thin * 3.8, lash_col, wmid=thin * 4.2)
    P.taper([outer, (outer[0] + s * 0.04 * h, outer[1] - 0.012 * h), (outer[0] + s * 0.075 * h, outer[1] - 0.03 * h)], thin * 2.2, thin * 0.2, lash_col)
    if not male:
        for t in (0.5, 0.64, 0.78, 0.9):
            bx, by = upper[int(t * (len(upper) - 1))]
            P.taper([(bx, by), (bx + s * 0.02 * h, by - 0.025 * h), (bx + s * 0.04 * h, by - 0.04 * h)], thin * 1.1, thin * 0.15, lash_col, 220)
    P.taper(lower[2:-2], thin * 0.5, thin * 0.5, (120, 92, 98), 150)
    if P.L > 0.5:   # smudged, heavy-lidded eye like a pen-and-brush sketch
        P.soft_ellipse(cx, ey + 0.05 * h, w * 0.95, 0.022 * h, (60, 42, 52), 0.07 * P.L, h * 0.014, clip=face_clip)
        P.taper(upper, thin * 1.0, thin * 2.0, lash_col, 160, wmid=thin * 2.6)
    P.soft_ellipse(cx, ey + 0.065 * h, w * 0.95, 0.025 * h, skin_sh, 0.3, h * 0.025, clip=face_clip)


def _features(P: Paint, sheet, ex_, skin, skin_sh, hx, hy, h, yaw, f, male, look_up, thin, Pt, face):
    eye_mode = ex_["eye"]
    spacing = 0.172
    ey = hy + 0.03 * h
    w0 = 0.106 * h * (0.93 if male else 1.0)
    openness = 1.0 if isinstance(eye_mode, str) else float(eye_mode)
    if sheet.eye_shape == "sharp":
        openness *= 0.88
    bl = 1.0 if ex_.get("blush") else (0.0 if male else 0.35)
    if bl > 0:
        for s in (-1, 1):
            c = Pt(s * 0.22, 0.17)
            P.soft_ellipse(c[0], c[1], 0.11 * h, 0.065 * h, (238, 118, 128), 0.34 * bl, h * 0.05, clip=face)
    for s in (-1, 1):
        far = (s == f)
        cx = Pt(s * spacing, 0)[0]
        w = w0 * (0.86 if far else 1.0)
        _eye(P, sheet, ex_, cx, ey, w, s, h, f, far, male, skin, skin_sh, thin, look_up, face, openness)
        tilt = ex_["tilt"] * 0.04 * h
        by = ey - 0.125 * h - ex_["lift"] * h
        if ex_.get("brow_one") and far:
            by -= 0.035 * h
        thick = (0.026 if male else 0.016) * h
        brow = smooth_open([(cx - s * w * 1.0, by + 0.012 * h + tilt), (cx - s * w * 0.1, by - (0.006 if male else 0.016) * h),
                            (cx + s * w * 0.85, by - 0.004 * h - tilt * 0.4), (cx + s * w * 1.25, by + 0.022 * h - tilt * 0.4)], 8)
        col = shade(sheet.hair, 0.65)
        P.taper(brow, thick * 0.8, thick * 0.12, col, 150, wmid=thick * 1.15)                               # soft body of the brow
        P.taper([(x, y + 0.002 * h) for x, y in brow], thick * 0.5, thick * 0.1, col, 235, wmid=thick * 0.8)  # crisp edge
    nx = Pt(0.012 * f, 0)[0]
    ny = hy + 0.175 * h
    P.soft_fill([(nx - f * 0.015 * h, hy), (nx - f * 0.05 * h, ny), (nx - f * 0.01 * h, ny + 0.01 * h)], skin_sh, 0.5, h * 0.015, clip=face)
    for sg in (-1, 1):
        P.taper(smooth_open([(nx + sg * 0.045 * h, ny + 0.002 * h), (nx + sg * 0.03 * h, ny + 0.022 * h), (nx + sg * 0.01 * h, ny + 0.02 * h)], 6), thin * 0.2, thin * 1.1, shade(skin, 0.5), 200)
    P.soft_ellipse(nx + f * 0.004 * h, ny - 0.012 * h, 0.022 * h, 0.014 * h, (255, 255, 255), 0.3, h * 0.012, clip=face)
    # mouth
    mx = Pt(0.01 * f, 0)[0]
    my = hy + 0.31 * h
    mw = (0.07 if male else 0.062) * h
    kind = ex_["mouth"]
    lipc = mix(skin, (196, 84, 96), 0.22 if male else 0.7)
    ends = {"smile": -0.016, "small_smile": -0.01, "frown": 0.014, "smirk": -0.01}.get(kind, 0.0) * h
    asym = (-0.018 * h * f) if kind == "smirk" else 0.0
    open_amt = {"open_big": 0.085, "frown_open": 0.06, "o": 0.06, "grit": 0.03}.get(kind, 0.0) * h
    left_end, right_end = (mx - mw, my + ends), (mx + mw, my + ends + asym)
    if kind == "o":
        left_end, right_end = (mx - mw * 0.5, my), (mx + mw * 0.5, my)
    if open_amt > 0:
        mouth = smooth_closed([left_end, (mx - mw * 0.4, my - 0.01 * h), (mx, my - 0.006 * h), (mx + mw * 0.4, my - 0.01 * h), right_end,
                               (mx + mw * 0.5, my + open_amt), (mx, my + open_amt * 1.15), (mx - mw * 0.5, my + open_amt)], 6)
        P.fill(mouth, (96, 30, 40))
        P.fill([(mx - mw * 0.6, my - 0.004 * h), (mx + mw * 0.6, my - 0.004 * h), (mx + mw * 0.5, my + open_amt * 0.4), (mx - mw * 0.5, my + open_amt * 0.4)], (248, 244, 244))
        P.soft_ellipse(mx, my + open_amt * 0.85, mw * 0.4, open_amt * 0.22, (214, 108, 118), 0.9, h * 0.004)
        P.contour(mouth, thin * 0.9, pieces=2)
    else:
        up_l = smooth_closed([left_end, (mx - mw * 0.45, my - 0.014 * h + ends * 0.3), (mx, my - 0.007 * h), (mx + mw * 0.45, my - 0.014 * h + ends * 0.3), right_end, (mx, my + 0.003 * h)], 5)
        lo_l = smooth_closed([left_end, (mx, my + 0.004 * h), right_end, (mx + mw * 0.55, my + 0.026 * h + ends * 0.4), (mx, my + 0.034 * h + ends * 0.3), (mx - mw * 0.55, my + 0.026 * h + ends * 0.4)], 5)
        P.fill(lo_l, lipc)
        P.fill(up_l, shade(lipc, 0.86))
        P.soft_ellipse(mx, my + 0.02 * h, mw * 0.4, 0.007 * h, (255, 255, 255), 0.45, h * 0.006)
        P.taper(smooth_open([left_end, (mx - mw * 0.4, my + 0.002 * h + ends * 0.3), (mx, my + 0.004 * h), (mx + mw * 0.4, my + 0.002 * h + ends * 0.3), right_end], 8),
                thin * 0.4, thin * 0.4, (110, 58, 66), 255, wmid=thin * 1.6)
        P.taper(smooth_open([left_end, (mx - mw * 0.55, my + 0.026 * h), (mx, my + 0.034 * h), (mx + mw * 0.55, my + 0.026 * h), right_end], 8),
                thin * 0.2, thin * 0.2, shade(skin, 0.5), 120, wmid=thin * 0.8)
    if ex_.get("tear"):
        for s in (-1, 1):
            tx = Pt(s * spacing, 0)[0] + s * 0.04 * h
            P.soft_fill([(tx, ey + 0.07 * h), (tx - 0.018 * h, ey + 0.13 * h), (tx, ey + 0.17 * h), (tx + 0.018 * h, ey + 0.13 * h)], (190, 225, 255), 0.8, h * 0.004)
    if ex_.get("sweat"):
        tx, ty = hx + f * 0.34 * h, hy - 0.2 * h
        drop = [(tx, ty - 0.06 * h), (tx - 0.03 * h, ty + 0.01 * h), (tx, ty + 0.05 * h), (tx + 0.03 * h, ty + 0.01 * h)]
        P.fill(smooth_closed(drop, 4), (200, 230, 255))
        P.contour(smooth_closed(drop, 4), thin * 0.7, pieces=1)


# --------------------------------------------------------------------------- hair
def _strands(P: Paint, starts, ends, n, h, thin, dark, light, rng, bulge, sway, clip):
    """Hair as a painter does it: broad soft clumps first (the silky flow), then fine strand lines on top,
    everything clipped to the hair shape so nothing crosses the face."""
    clip_img = Image.new("L", (P.w, P.h), 0)
    ImageDraw.Draw(clip_img).polygon(P._t(clip), fill=255)

    def path(u):
        a = _lerp_path(starts, min(1.0, max(0.0, u)))
        b = _lerp_path(ends, min(1.0, max(0.0, u + rng.uniform(-0.05, 0.05))))
        c1 = (a[0] + bulge * h * (1 + rng.uniform(-0.2, 0.2)), a[1] + (b[1] - a[1]) * 0.3)
        c2 = (b[0] - sway * h + rng.uniform(-0.04, 0.04) * h, a[1] + (b[1] - a[1]) * 0.7)
        return _bez(a, c1, c2, b, 14)

    for i in range(10):                                   # broad clumps
        pts = path((i + rng.uniform(-0.3, 0.3)) / 9)
        col, al = (light, 0.28) if rng.random() < 0.45 else (dark, 0.34)
        wdt = h * rng.uniform(0.035, 0.07)
        left, right = [], []
        for j, (x, y) in enumerate(pts):
            a, b = pts[max(0, j - 1)], pts[min(len(pts) - 1, j + 1)]
            L = math.hypot(b[0] - a[0], b[1] - a[1]) or 1.0
            nx_, ny_ = -(b[1] - a[1]) / L, (b[0] - a[0]) / L
            w = wdt * math.sin(math.pi * min(1, j / (len(pts) - 1) * 0.95 + 0.04)) ** 0.7
            left.append((x + nx_ * w / 2, y + ny_ * w / 2))
            right.append((x - nx_ * w / 2, y - ny_ * w / 2))
        P.soft_fill(left + right[::-1], col, al, h * 0.012, clip=clip)
    real = P.lines                                        # fine strands, drawn on a scratch layer then clipped
    scratch = Image.new("RGBA", (P.w, P.h), (0, 0, 0, 0))
    P.lines = scratch
    for i in range(n):
        pts = path((i + rng.uniform(-0.3, 0.3)) / max(1, n - 1))
        if rng.random() < 0.32:
            P.taper(pts, thin * 0.2, thin * 1.2, light, 175, wmid=thin * 1.7)
        else:
            P.taper(pts, thin * 0.2, thin * 0.15, dark, 215, wmid=thin * 1.15)
    scratch.putalpha(ImageChops.multiply(scratch.getchannel("A"), clip_img))
    P.lines = real
    P.lines.alpha_composite(scratch)


def _hair_front(P: Paint, sheet, hx, hy, h, yaw, f, male, long_hair, bob, hair, hair_dk, hair_hi, thin, Pt, light_side, back_view):
    rng = random.Random(sheet.seed + 11)
    if back_view:
        cap = smooth_closed([Pt(-0.5, 0.2), Pt(-0.55, -0.3), Pt(-0.32, -0.62), Pt(0, -0.7), Pt(0.32, -0.62), Pt(0.55, -0.3), Pt(0.5, 0.2), Pt(0.3, 0.5), Pt(0, 0.56), Pt(-0.3, 0.5)], 6)
        P.fill(cap, hair, "hair")
        P.contour(cap, thin, pieces=3)
        return
    part = -0.05 * f if not male else -0.12
    if long_hair:
        length = 0.95 if bob else 2.0
        for s in (-1, 1):
            far = (s == f)
            L = length * (0.97 if far else 1.0)
            curtain = smooth_closed([
                Pt(part, -0.6), Pt(s * 0.28, -0.62), Pt(s * 0.5, -0.42), Pt(s * 0.575, -0.1), Pt(s * 0.6, 0.35), Pt(s * 0.66, 0.4 + (L - 0.4) * 0.5),
                Pt(s * 0.6, L - 0.05), Pt(s * 0.46, L), Pt(s * 0.4, L - 0.4), Pt(s * 0.34, 0.55), Pt(s * 0.35, 0.18), Pt(s * 0.315, -0.04),
                Pt(s * 0.255, -0.2), Pt(s * 0.15, -0.33), Pt(part + s * 0.04, -0.4)], 5)
            P.fill(curtain, hair, "hair")
            starts = [Pt(part + s * 0.02, -0.56), Pt(s * 0.14, -0.5), Pt(s * 0.3, -0.38), Pt(s * 0.5, -0.2)]
            ends = [Pt(s * 0.4, L - 0.35), Pt(s * 0.5, L - 0.1), Pt(s * 0.58, L - 0.05)]
            _strands(P, starts, ends, int(46 * (1 + 0.8 * P.L)), h, thin, hair_dk, hair_hi, rng, bulge=s * 0.16 * (1 + P.L), sway=-s * 0.04, clip=curtain)
            P.contour(curtain, thin * 0.95, pieces=4)
            P.flyaways([q for q in curtain if abs(q[0] - hx) > 0.42 * h or q[1] < hy - 0.45 * h], int(3 + 12 * P.L), 0.3 * h, thin * 0.85, hair_dk, (hx, hy + 0.3 * h))
        P.taper(smooth_open([Pt(part, -0.64), Pt(part + 0.01, -0.58), Pt(part + 0.015, -0.5)], 5), thin * 0.2, thin * 1.4, hair_dk, 200)
    else:
        swp = -1 if f > 0 else 1
        cap = smooth_closed([Pt(-0.4, 0.1), Pt(-0.5, -0.28), Pt(-0.34, -0.6), Pt(0, -0.7), Pt(0.34, -0.6), Pt(0.5, -0.28), Pt(0.42, 0.08),
                             Pt(0.4, -0.1), Pt(0.33, -0.27), Pt(swp * -0.05, -0.34), Pt(swp * 0.1, -0.42), Pt(-0.33, -0.2), Pt(-0.38, -0.06)], 5)
        P.fill(cap, hair, "hair")
        starts = [Pt(swp * 0.14, -0.62), Pt(swp * 0.0, -0.64), Pt(-swp * 0.2, -0.6), Pt(-swp * 0.4, -0.45)]
        ends = [Pt(swp * 0.2, -0.28), Pt(-swp * 0.1, -0.26), Pt(-swp * 0.34, -0.12)]
        _strands(P, starts, ends, int(34 * (1 + 0.8 * P.L)), h, thin, hair_dk, hair_hi, rng, bulge=-swp * 0.07 * (1 + P.L), sway=0.0, clip=cap)
        for k in range(4):   # fringe locks sweeping across the forehead
            y0 = -0.5 + 0.05 * k
            lock = smooth_closed([Pt(swp * 0.16, y0 - 0.1), Pt(swp * -0.05 - swp * 0.2 * k * 0.3, y0 - 0.02), Pt(-swp * (0.3 + 0.03 * k), y0 + 0.17 + 0.03 * k),
                                  Pt(-swp * (0.4 + 0.02 * k), y0 + 0.22), Pt(-swp * (0.2 + 0.03 * k), y0 + 0.08), Pt(swp * 0.1, y0)], 5)
            P.fill(lock, mix(hair, hair_hi, 0.06), "hair")
            _strands(P, [Pt(swp * 0.1, y0 - 0.08), Pt(-swp * 0.1, y0)], [Pt(-swp * (0.32 + 0.02 * k), y0 + 0.2)], 8, h, thin, hair_dk, hair_hi, rng, bulge=-swp * 0.04, sway=0.0, clip=lock)
            P.contour(lock, thin * 0.8, pieces=2)
        P.contour(cap, thin * 1.1, pieces=4)
        P.flyaways([q for q in cap if q[1] < hy - 0.3 * h or abs(q[0] - hx) > 0.42 * h], int(3 + 10 * P.L), 0.28 * h, thin * 0.85, hair_dk, (hx, hy))
        for s in (-1, 1):
            sb = smooth_closed([Pt(s * 0.4, -0.12), Pt(s * 0.45, 0.0), Pt(s * 0.42, 0.14), Pt(s * 0.38, 0.05), Pt(s * 0.37, -0.1)], 4)
            P.fill(sb, hair, "hair")
            P.contour(sb, thin * 0.8, pieces=1)


def _glasses(P: Paint, hx, hy, h, yaw, f, thin, Pt):
    ey = hy + 0.03 * h
    frame = (66, 68, 80)
    lens = []
    for s in (-1, 1):
        cx = Pt(s * 0.172, 0)[0]
        far = (s == f)
        w = 0.128 * h * (0.88 if far else 1.0)
        rect = smooth_closed([(cx - w, ey - 0.07 * h), (cx + w, ey - 0.08 * h), (cx + w * 1.02, ey + 0.065 * h), (cx - w * 0.95, ey + 0.075 * h)], 6)
        P.soft_fill(rect, (225, 236, 248), 0.14, h * 0.004)
        P.contour(rect, thin * 0.9, frame, pieces=2)
        lens.append((cx, w))
    a, b = lens[0], lens[1]
    P.taper([(a[0] + a[1], ey - 0.02 * h), (hx, ey - 0.03 * h), (b[0] - b[1], ey - 0.02 * h)], thin * 0.8, thin * 0.8, frame)
    for s, (cx, w) in zip((-1, 1), lens):
        if s == -f:
            P.taper([(cx + s * w, ey - 0.04 * h), (cx + s * (w + 0.12 * h), ey - 0.03 * h), (cx + s * (w + 0.2 * h), ey)], thin * 0.8, thin * 0.8, frame)


# --------------------------------------------------------------------------- close-up insert (a single large eye)
def draw_eye_closeup_semi(layer: Image.Image, mask: Image.Image, sheet: CharacterSheet, expression: str, cx: float, cy: float, w: float, lw: int,
                          style: StyleProfile) -> FigureResult:
    ex_ = EXPRESSIONS[canonical_expression(expression)]
    h = w / 0.212                      # head height whose eye is half-width w/2 (eye half-width = 0.106 h)
    thin = max(1.0, lw * 0.85)
    skin = sheet.skin
    skin_sh = mix(skin, (150, 100, 100), 0.30)
    P = Paint(layer, mask, (cx - w * 1.0, cy - w * 0.55, cx + w * 1.0, cy + w * 0.5), lw, h, 1, sheet.seed, INK)
    band = [(cx - w * 1.0, cy - w * 0.55), (cx + w * 1.0, cy - w * 0.55), (cx + w * 1.0, cy + w * 0.5), (cx - w * 1.0, cy + w * 0.5)]
    P.fill(band, skin, "skin")
    openness = 1.0 if isinstance(ex_["eye"], str) else float(ex_["eye"])
    _eye(P, sheet, ex_, cx, cy, w * 0.5, 1, h, 1, False, sheet.gender == "male", skin, skin_sh, thin, False, band, openness)
    tilt = ex_["tilt"] * 0.04 * h
    brow = smooth_open([(cx - w * 0.5, cy - 0.125 * h + 0.012 * h + tilt), (cx, cy - 0.125 * h - 0.016 * h), (cx + w * 0.5, cy - 0.125 * h + 0.02 * h - tilt)], 8)
    P.taper(brow, 0.012 * h, 0.01 * h, shade(sheet.hair, 0.65), 235, wmid=0.026 * h)
    P.soft_ellipse(cx - w * 0.45, cy - w * 0.12, w * 0.7, w * 0.22, (255, 250, 245), 0.4, w * 0.18)        # key light across the skin
    P.soft_ellipse(cx, cy + w * 0.16, w * 0.36, w * 0.012, (255, 255, 255), 0.55, w * 0.012)                # wet lower lid
    P.finish(shade=True)
    box = (cx - w * 0.5, cy - w * 0.25, cx + w * 0.5, cy + w * 0.25)
    return FigureResult(sheet.name, box, box, (cx - w, cy - w * 0.55, cx + w, cy + w * 0.5), {"skin": (cx - w * 0.85, cy, sheet.skin)})
