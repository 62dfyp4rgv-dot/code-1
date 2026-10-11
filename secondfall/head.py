"""A parametric head: 3-D volumes for form shading (r3d), then 2-D drawn features (eyes, brows, nose, mouth, age lines,
hair) placed through the same rotation so they follow the head's angle and foreshorten correctly."""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .paintfx import Ink, bez, lum
from .r3d import Buf, _blur, _rotmat, fnoise
from .sdf import SDF
from .style import WEB

RGB = tuple[float, float, float]


@dataclass
class HeadSpec:
    name: str = "head"
    skin: RGB = (0.72, 0.60, 0.52)
    hair: RGB = (0.07, 0.06, 0.07)
    hair_style: str = "short"              # short | mop | undercut | bald | twists | curly | ponytail | thin
    jaw: float = 1.0                       # relative jaw width
    cheek: float = 1.0                     # cheekbone prominence
    brow: float = 1.0                      # brow ridge size
    nose_len: float = 1.0
    nose_bump: float = 0.0                 # broken-nose bump on the bridge
    lips: float = 1.0
    ear: float = 1.0
    head_w: float = 1.0
    neck: float = 1.0
    age: float = 0.5                       # 0 young .. 1 old: lines, bags, sagging
    eye: str = "monolid"                   # monolid | round | almond | wide
    lid: float = 0.55                      # how much of the eye the upper lid covers (0 open .. 1 shut)
    iris: RGB = (0.16, 0.11, 0.09)
    brow_color: RGB = (0.07, 0.06, 0.07)
    brow_thick: float = 1.0
    brow_angle: float = 0.0                # + furrowed (inner ends down), - raised/worried
    stubble: float = 0.0
    scars: list = field(default_factory=list)   # e.g. [("brow_r", ...)]
    glasses: bool = False
    gray: float = 0.0                      # grey at the temples 0..1
    mouth_open: float = 0.0                # 0 closed .. 1 shouting
    smile: float = 0.0                     # + raises the (screen) right corner more, - the left; |1| a broad smile
    tear: float = 0.0
    seed: int = 1


class Head:
    """Place with .build(buf, ...) before shading, and .features(canvas_rgb, ...) afterwards."""

    def __init__(self, spec: HeadSpec):
        self.s = spec
        self.lm: dict = {}

    # ------------------------------------------------------------------ transforms
    def _setup(self, c, h, yaw, pitch, roll):
        self.c, self.h = np.asarray(c, float), float(h)
        self.R = _rotmat(pitch, yaw, roll)
        self.yaw, self.pitch, self.roll = yaw, pitch, roll

    def P(self, x, y, z) -> np.ndarray:
        """Local head coordinates (units of head height) -> screen/world pixels."""
        return self.c + self.R @ (np.array([x, y, z], float) * self.h)

    def surf(self, x: float, y: float, off: float = 0.0) -> tuple[float, float, float]:
        """A point on the front of the face at local (x, y), with z taken from the face surface (+ `off` standing off it)."""
        s = self.s
        wx = 0.36 * s.head_w
        z_c = 0.40 * math.sqrt(max(0.0, 1 - (x / wx) ** 2 - ((y + 0.10) / 0.50) ** 2))
        z_f = 0.36 * math.sqrt(max(0.0, 1 - (x / (0.31 * s.head_w)) ** 2 - ((y - 0.10) / 0.42) ** 2))
        z = max(z_c, z_f) + 0.012
        return (x, y, z + off)

    def S(self, x, y, off=0.0) -> np.ndarray:
        return self.P(*self.surf(x, y, off))

    def S2(self, x, y, off=0.0) -> np.ndarray:
        return self.P(*self.surf(x, y, off))[:2]

    # ------------------------------------------------------------------ 3-D geometry (smooth SDF sculpt)
    def sculpt(self, sdf: SDF, group: int = 0) -> None:
        """Add this head's volumes to `sdf` (world pixels, through the head's rotation)."""
        s, hh = self.s, self.h
        sk = s.skin
        P = self.P
        w = s.head_w
        age = s.age

        def E(c, r, k=0.0, sub=False, rot=(0, 0, 0), spec=0.0, color=None, cw=7.0):
            Rg = self.R @ _rotmat(*rot)
            sdf.ellipsoid(P(*c), tuple(x * hh for x in r), _euler_from(Rg), k * hh, sub, color or sk, "skin", spec, cw, group)

        def C(a, b, r1, r2, k=0.0, sub=False):
            sdf.cone(P(*a), P(*b), r1 * hh, r2 * hh, k * hh, sub, sk, "skin", 0.0, 8.0, group)

        # skull and face mass
        E((0, -0.15, -0.04), (0.34 * w, 0.40, 0.40))
        E((0, 0.12, 0.04), (0.285 * w, 0.40, 0.30), k=0.11)
        for sg in (-1, 1):
            E((sg * 0.215 * w, 0.045, 0.165), (0.085 * s.cheek, 0.065 * s.cheek, 0.075), k=0.08)               # cheekbone
            C((sg * 0.29 * w, 0.06, -0.02), (sg * 0.10 * w * s.jaw, 0.42, 0.12), 0.07 * s.jaw, 0.04 * s.jaw, k=0.07)     # jaw line
            E((sg * 0.335 * w, 0.025, -0.01), (0.026 * s.ear, 0.082 * s.ear, 0.052 * s.ear), k=0.03, rot=(0, 0.25 * sg, 0.1 * sg))
        E((0, 0.44, 0.20), (0.095 * s.jaw, 0.07, 0.09), k=0.07)                                                     # chin
        E((0, -0.095, 0.275), (0.265 * w, 0.045 * s.brow, 0.055 * s.brow), k=0.06)                                  # brow ridge
        # nose
        nl = s.nose_len
        C((0, -0.045, 0.30), (0, 0.145 * nl, 0.355), 0.026, 0.040, k=0.05)
        E((0, 0.175 * nl, 0.385), (0.046, 0.04, 0.045), k=0.045)
        for sg in (-1, 1):
            E((sg * 0.05, 0.178 * nl, 0.34), (0.032, 0.03, 0.034), k=0.04)
        if s.nose_bump:
            E((0.006, 0.015, 0.325), (0.036, 0.034, 0.034 + 0.02 * s.nose_bump), k=0.04)
        # lips
        lp = s.lips
        E((0, 0.263, 0.312), (0.082, 0.020 * lp, 0.04), k=0.025)
        E((0, 0.305, 0.312), (0.072, 0.026 * lp, 0.04), k=0.025)
        # carve: eye sockets, mouth slit, nostrils, chin dimple
        for sg in (-1, 1):
            E((sg * 0.165 * w, -0.012, 0.215), (0.082, 0.062, 0.07), k=0.06, sub=True)
            E((sg * 0.034, 0.192 * nl, 0.375), (0.014, 0.011, 0.02), k=0.01, sub=True)
        E((0, 0.2845, 0.322), (0.07, 0.0035, 0.02), k=0.01, sub=True)
        E((0, 0.352, 0.315), (0.05, 0.012, 0.03), k=0.035, sub=True)
        # age: eye bags, cheek hollows, jowls
        if age > 0.35:
            for sg in (-1, 1):
                E((sg * 0.17 * w, 0.052, 0.235), (0.058, 0.018 + 0.012 * age, 0.035), k=0.035)
                E((sg * 0.165 * w, 0.345, 0.19), (0.065, 0.06, 0.07), k=0.08)
        # neck (set separately by the body when given)
        self.sdf_neck = False

    def build(self, b: Buf, c, h, yaw=0.0, pitch=0.0, roll=0.0, neck_to=None, part: Optional[int] = None, res: float = 1.0, sdf: Optional[SDF] = None,
              march: bool = True) -> dict:
        s = self.s
        self._setup(c, h, yaw, pitch, roll)
        part = part or b.new_part()
        self.part = part
        hh = self.h
        sc = sdf or SDF()
        self.sculpt(sc)
        if neck_to is not None or sdf is None:
            top = self.P(0, 0.22, -0.13)
            nt = np.asarray(neck_to if neck_to is not None else self.c + np.array([0, 0.95 * hh, -0.08 * hh]), float)
            sc.cone(tuple(top), tuple(nt), 0.15 * hh * s.neck, 0.19 * hh * s.neck, 0.05 * hh, False, s.skin, "skin", 0.0, 8.0, 0)
        if march:
            r = 0.85 * hh
            sc.march(b, (self.c[0] - r, self.c[1] - 0.75 * hh, self.c[0] + r, self.c[1] + (neck_to[1] - self.c[1] if neck_to is not None else 1.2 * hh)),
                     (self.c[2] - 0.8 * hh, self.c[2] + 0.7 * hh), part=part, res=res)
        w = s.head_w
        self.lm = dict(c=self.P(0, 0, 0), chin=self.P(0, 0.5, 0.2), top=self.P(0, -0.5, 0), eye_l=self.S(-0.17 * w, -0.005), eye_r=self.S(0.17 * w, -0.005),
                       mouth=self.S(0, 0.29), nose=self.S(0, 0.17 * s.nose_len))
        return self.lm

    # ------------------------------------------------------------------ hair (2-D painted from projected landmarks)
    def head_mask(self, b: Buf) -> np.ndarray:
        return b.part == self.part

    def hair_mask(self, b: Buf, expand: float = 1.0) -> np.ndarray:
        """Hair region = a dilated copy of the head's top above a (receding) hairline, plus sideburns."""
        s, h = self.s, self.h
        hm = (b.part == self.part)
        if not hm.any():
            return np.zeros_like(hm)
        H, W = hm.shape
        Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
        style = s.hair_style
        if style == "bald":
            return np.zeros_like(hm)
        # hairline: a closed region in head-local space projected to the screen. We rasterise it with PIL.
        recede = {"thin": 0.10, "undercut": 0.02, "short": 0.0, "mop": -0.04, "twists": -0.05, "curly": -0.05, "ponytail": 0.0, "long": -0.03}.get(style, 0.0)
        top = -0.17 - recede
        line = [self.surf(-0.345, 0.04), self.surf(-0.335, -0.06)]
        for i in range(0, 13):                                          # temple -> forehead -> temple (local x, y)
            t = i / 12
            x = -0.30 + 0.60 * t
            y = top - 0.07 * math.sin(math.pi * t) + 0.16 * (1 - math.sin(math.pi * t)) ** 2 * 0.9 - 0.02
            if style == "thin":                                         # the widow's peak / receding temples
                y += 0.06 * (abs(x) / 0.30) ** 2
            line.append(self.surf(x, y))
        line += [self.surf(0.335, -0.06), self.surf(0.345, 0.04)]
        line = [tuple(self.P(*p)[:2]) for p in line]
        # outer boundary: skull outline expanded
        out = []
        for i in range(0, 25):
            a = math.pi + math.pi * i / 24                                # across the top of the skull
            x, y = math.cos(a) * 0.395 * s.head_w * expand, -0.13 + math.sin(a) * 0.46 * expand
            out.append(tuple(self.P(x, y, 0.0)[:2]))
        side_l = tuple(self.P(-0.38 * s.head_w, 0.04, 0.0)[:2])
        side_r = tuple(self.P(0.38 * s.head_w, 0.04, 0.0)[:2])
        im = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(im)
        poly = [side_l] + out + [side_r] + line[::-1]
        d.polygon(poly, fill=255)
        mask = np.asarray(im) > 127
        # sideburns / ear-level hair for longer styles
        if style in ("mop", "twists", "curly"):
            for sg in (-1, 1):
                d.polygon([tuple(self.P(sg * 0.34, -0.05, 0.1)[:2]), tuple(self.P(sg * 0.40, 0.18, 0.0)[:2]), tuple(self.P(sg * 0.31, 0.16, 0.15)[:2])], fill=255)
            mask = np.asarray(im) > 127
        if style == "long":                                          # curtains of hair falling past the jaw onto the shoulders
            for sg in (-1, 1):
                d.polygon([tuple(self.P(sg * 0.30, -0.12, 0.05)[:2]), tuple(self.P(sg * 0.43, 0.05, 0.0)[:2]), tuple(self.P(sg * 0.50, 0.45, -0.05)[:2]),
                           tuple(self.P(sg * 0.47, 0.95, -0.05)[:2]), tuple(self.P(sg * 0.33, 1.02, 0.0)[:2]), tuple(self.P(sg * 0.285, 0.55, 0.12)[:2]),
                           tuple(self.P(sg * 0.275, 0.18, 0.2)[:2])], fill=255)
            mask = np.asarray(im) > 127
        # lumpy, hand-cut edge
        n = fnoise(H, W, h * 0.05, h * 0.05, self.s.seed) * h * 0.035
        if WEB:
            n = n * 0.35
            mask = _blur(mask.astype(np.float32), h * 0.012) > 0.5
        grown = _blur(mask.astype(np.float32), h * 0.02) + n / (h * 0.1)
        return grown > 0.5

    # ------------------------------------------------------------------ 2-D features
    def features(self, rgb: np.ndarray, b: Buf, ink: Ink, light_side: int = -1, scale: float = 1.0, lit: Optional[np.ndarray] = None) -> np.ndarray:
        """Draw eyes / brows / nose / mouth / lines / hair onto `rgb` (H,W,3 float) and return it."""
        s, h = self.s, self.h
        H, W = rgb.shape[:2]
        out = rgb.copy()
        facing = self.R @ np.array([0, 0, 1.0])
        visible_front = facing[2] > 0.15
        # ---- hair mass first, so it sits under the brows / features that overlap it
        hm = self.hair_mask(b, 1.07 if WEB else 1.0)
        if hm.any():
            if WEB:                                                  # soft fringe shadow cast on the forehead
                sh = _blur(np.roll(hm.astype(np.float32), int(h * 0.05), 0), h * 0.035) * (b.part == self.part) * (1 - hm)
                out = out * (1 - 0.30 * sh[..., None]) + np.array([0.70, 0.44, 0.50], np.float32) * 0.30 * sh[..., None] * out
            out = self._paint_hair(out, b, hm, ink)
        if not visible_front:
            return out
        if WEB:
            self._web_face(out, ink, scale)
            return out
        self._eyes(out, ink, scale)
        if s.tear > 0:
            t0 = self.S2(0.19 * s.head_w, 0.04)
            ink.stroke([tuple(t0), tuple(t0 + np.array([h * 0.004, h * 0.07 * s.tear]))], h * 0.012 * scale, color=(210, 200, 185), alpha=0.9, taper=(0.5, 0.2), mid=1.5)
        self._brows(ink, scale)
        self._nose_mouth(out, ink, scale)
        self._age(ink, scale)
        return out

    def _poly(self, pts3, w_extra=0.0):
        return [tuple(self.P(*p)[:2]) for p in pts3]

    def _eye(self, sg: int, out: np.ndarray, ink: Ink, sc: float) -> None:
        s, h = self.s, self.h
        w = s.head_w
        ex, ey = 0.165 * w * sg, -0.012
        ew = {"monolid": 0.125, "round": 0.11, "almond": 0.13, "wide": 0.135}[s.eye]
        eh = {"monolid": 0.056, "round": 0.075, "almond": 0.065, "wide": 0.08}[s.eye] * (1 - 0.62 * s.lid)
        # corners (inner nearer the nose)
        inner = (ex - sg * ew * 0.95, ey + 0.012)
        outer = (ex + sg * ew * 1.0, ey - 0.012 - (0.012 if s.eye == "almond" else 0.0))
        up_c = [(ex - sg * ew * 0.3, ey - eh - 0.012), (ex + sg * ew * 0.4, ey - eh - 0.006)]
        lo_c = [(ex + sg * ew * 0.3, ey + eh * 0.5 + 0.006), (ex - sg * ew * 0.3, ey + eh * 0.5 + 0.008)]
        P3 = lambda p: self.S2(p[0], p[1], 0.004)
        pin, pou = P3(inner), P3(outer)
        up = bez(pin, P3(up_c[0]), P3(up_c[1]), pou, 20)
        lo = bez(pou, P3(lo_c[0]), P3(lo_c[1]), pin, 20)
        # socket shadow: soft dark patch above and around the eye
        soc = Image.new("L", (out.shape[1], out.shape[0]), 0)
        cx, cy = P3((ex, ey - 0.02))
        r = ew * h * 1.5
        ImageDraw.Draw(soc).ellipse((cx - r, cy - r * 0.8, cx + r, cy + r * 0.7), fill=255)
        soc = np.asarray(soc.filter(ImageFilter.GaussianBlur(h * 0.035)), np.float32) / 255.0
        kdark = 0.30 * soc * (0.5 + 0.5 * s.lid)
        out[:] = out * (1 - kdark[..., None] * np.array([0.85, 1.0, 1.0], np.float32))
        # sclera / iris
        poly = [tuple(p) for p in up] + [tuple(p) for p in lo]
        m = Image.new("L", (out.shape[1], out.shape[0]), 0)
        ImageDraw.Draw(m).polygon(poly, fill=255)
        mk = np.asarray(m.filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255.0
        sclera = np.array([0.80, 0.77, 0.72], np.float32) * (0.82 if s.age > 0.4 else 1.0)
        out[:] = out * (1 - mk[..., None]) + sclera * mk[..., None]
        # iris (a disc partly hidden by the upper lid)
        gaze = np.array([0.0, 0.0])
        ic = P3((ex + sg * 0.004 + gaze[0], ey + 0.002))
        rad = ew * h * 0.66
        iris = Image.new("L", m.size, 0)
        ImageDraw.Draw(iris).ellipse((ic[0] - rad, ic[1] - rad, ic[0] + rad, ic[1] + rad), fill=255)
        ir = np.asarray(iris.filter(ImageFilter.GaussianBlur(0.7)), np.float32) / 255.0 * mk
        icol = np.asarray(s.iris, np.float32)
        yy = (np.arange(out.shape[0])[:, None] - ic[1]) / max(rad, 1)
        shade = np.clip(0.55 + 0.45 * yy, 0.4, 1.2)[..., None]                    # darker toward the top (lid shadow)
        out[:] = out * (1 - ir[..., None]) + (icol * shade) * ir[..., None]
        pup = Image.new("L", m.size, 0)
        ImageDraw.Draw(pup).ellipse((ic[0] - rad * 0.45, ic[1] - rad * 0.45, ic[0] + rad * 0.45, ic[1] + rad * 0.45), fill=255)
        pu = np.asarray(pup.filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255.0 * mk
        out[:] = out * (1 - pu[..., None]) + np.array([0.03, 0.02, 0.02], np.float32) * pu[..., None]
        # catchlight
        hl = Image.new("L", m.size, 0)
        hx, hy = ic[0] - sg * rad * 0.35 - rad * 0.1, ic[1] - rad * 0.4
        ImageDraw.Draw(hl).ellipse((hx - rad * 0.16, hy - rad * 0.16, hx + rad * 0.16, hy + rad * 0.16), fill=255)
        hlm = np.asarray(hl.filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255.0 * mk
        out[:] = out * (1 - hlm[..., None] * 0.95) + hlm[..., None] * 0.95
        # upper lid line: heavy, tapered, with a little wing on the outer corner
        lw = h * 0.016 * sc
        ink.stroke([tuple(p) for p in up], lw * (2.4 if s.eye in ("monolid", "almond") else 1.8), taper=(0.35, 0.2), mid=1.25)
        ink.stroke([pou, (pou[0] + sg * h * 0.03, pou[1] - h * 0.006)], lw * 0.9, taper=(0.9, 0.05))
        ink.stroke([tuple(p) for p in lo[4:-3]], lw * 0.45, alpha=0.7, taper=(0.1, 0.1))
        # lid crease / double lid, and the under-eye bag
        crease = bez(P3((ex - sg * ew * 0.8, ey - eh - 0.03)), P3((ex - sg * ew * 0.2, ey - eh - 0.05)), P3((ex + sg * ew * 0.5, ey - eh - 0.045)), P3((ex + sg * ew * 1.05, ey - eh - 0.02)), 16)
        ink.stroke([tuple(p) for p in crease], lw * 0.55, alpha=0.75, taper=(0.1, 0.1))
        if s.age > 0.3:
            bag = bez(P3((ex - sg * ew * 0.7, ey + 0.045)), P3((ex - sg * ew * 0.1, ey + 0.065)), P3((ex + sg * ew * 0.6, ey + 0.06)), P3((ex + sg * ew * 1.0, ey + 0.035)), 14)
            ink.stroke([tuple(p) for p in bag], lw * 0.5 * (0.5 + s.age), alpha=0.55, taper=(0.1, 0.1))

    def _eyes(self, out, ink, sc):
        for sg in (-1, 1):
            self._eye(sg, out, ink, sc)

    def _brows(self, ink, sc):
        s, h = self.s, self.h
        w = s.head_w
        for sg in (-1, 1):
            by = -0.095 - 0.012 * s.brow
            inner = (0.045 * w * sg, by + 0.025 * s.brow_angle - 0.0)
            peak = (0.18 * w * sg, by - 0.018 - 0.015 * (-s.brow_angle))
            outer = (0.30 * w * sg, by + 0.02 + 0.01 * s.brow_angle * -1)
            P3 = lambda p: self.S2(p[0], p[1], 0.012)
            pts = bez(P3(inner), P3((inner[0] * 0.7 + peak[0] * 0.3, inner[1] - 0.005)), P3((peak[0], peak[1] - 0.004)), P3(outer), 18)
            ink.stroke([tuple(p) for p in pts], h * 0.032 * s.brow_thick * sc, color=tuple(int(255 * c) for c in s.brow_color), taper=(0.5, 0.18), mid=1.25, wobble=0.15)
            ink.stroke([tuple(p + np.array([0, h * 0.008])) for p in pts[2:-4]], h * 0.012 * sc, color=tuple(int(255 * c) for c in s.brow_color), alpha=0.7, taper=(0.2, 0.2))

    def _nose_mouth(self, out, ink, sc):
        s, h = self.s, self.h
        nl = s.nose_len
        P3 = lambda x, y, o=0.01: self.S2(x, y, o)
        lw = h * 0.013 * sc
        # nose: side line of the bridge, nostril wing, nostril darks, tip shadow
        for sg in (-1, 1):
            side = bez(P3(sg * 0.045, -0.03), P3(sg * 0.05, 0.05), P3(sg * 0.07, 0.12 * nl), P3(sg * 0.075, 0.16 * nl), 14)
            ink.stroke([tuple(p) for p in side], lw * 0.8, alpha=0.45 if sg == -1 else 0.85, taper=(0.1, 0.5))
            wing = bez(P3(sg * 0.075, 0.16 * nl), P3(sg * 0.095, 0.185 * nl), P3(sg * 0.07, 0.205 * nl), P3(sg * 0.04, 0.2 * nl), 12)
            ink.stroke([tuple(p) for p in wing], lw * 1.1, alpha=0.9, taper=(0.5, 0.3))
            nos = P3(sg * 0.035, 0.2 * nl, 0.02)
            ink.blob([(nos[0] + math.cos(a) * h * 0.016, nos[1] + math.sin(a) * h * 0.009) for a in np.linspace(0, 6.28, 12)], alpha=0.85)
        tip = bez(P3(-0.035, 0.215 * nl), P3(-0.01, 0.225 * nl), P3(0.015, 0.225 * nl), P3(0.04, 0.213 * nl), 10)
        ink.stroke([tuple(p) for p in tip], lw * 0.8, alpha=0.5, taper=(0.2, 0.2))
        if s.nose_bump:
            bm = P3(0.01, 0.02, 0.03)
            ink.stroke([tuple(bm + np.array([-h * 0.02, -h * 0.01])), tuple(bm + np.array([h * 0.025, h * 0.012]))], lw * 0.7, alpha=0.5)
        # mouth: a firm centre line with the corners tucked (or open / smiling), plus the shadow under the lower lip
        my = 0.285
        w2 = 0.095 * (1 + 0.25 * abs(s.smile) + 0.15 * s.mouth_open)
        cl = -0.012 * s.smile * 1.0 - 0.01 * abs(s.smile)         # corner heights: smile raises a corner (smaller y)
        cr = 0.012 * s.smile * 1.0 - 0.01 * abs(s.smile)
        cr, cl = (cl, cr) if s.smile < 0 else (cr, cl)
        if s.mouth_open > 0.05:
            o = 0.06 * s.mouth_open
            top = bez(P3(-w2, my + cl), P3(-w2 * 0.4, my - 0.012), P3(w2 * 0.4, my - 0.012), P3(w2, my + cr), 14)
            bot = bez(P3(w2, my + cr), P3(w2 * 0.5, my + 0.03 + o), P3(-w2 * 0.5, my + 0.03 + o), P3(-w2, my + cl), 14)
            poly = [tuple(p) for p in top] + [tuple(p) for p in bot]
            ink.blob(poly, color=(26, 8, 8), alpha=1.0)
            teeth = bez(P3(-w2 * 0.7, my - 0.004), P3(-w2 * 0.3, my - 0.008), P3(w2 * 0.3, my - 0.008), P3(w2 * 0.7, my - 0.004), 10)
            tb = [tuple(p) for p in teeth] + [tuple(p + np.array([0, h * 0.018 * (0.5 + s.mouth_open)])) for p in teeth[::-1]]
            ink.blob(tb, color=(222, 212, 192), alpha=0.95)
            ink.stroke([tuple(p) for p in top], lw * 1.2, taper=(0.3, 0.3))
            ink.stroke([tuple(p) for p in bot], lw * 1.2, taper=(0.3, 0.3))
        else:
            line = bez(P3(-w2, my + cl), P3(-w2 * 0.4, my + 0.012), P3(w2 * 0.4, my + 0.012), P3(w2, my + cr), 16)
            ink.stroke([tuple(p) for p in line], lw * 1.5, taper=(0.3, 0.3), mid=1.15)
            if abs(s.smile) > 0.3:                                    # a smile line at the raised corner
                cx_ = P3((w2 if s.smile > 0 else -w2), my + (cr if s.smile > 0 else cl))
                ink.stroke([tuple(cx_ + np.array([0, -h * 0.012])), tuple(cx_ + np.array([h * 0.016 * (1 if s.smile > 0 else -1), -h * 0.026]))], lw * 0.8, alpha=0.8)
        ul = bez(P3(-w2 * 0.9, my - 0.002), P3(-w2 * 0.35, my - 0.035), P3(w2 * 0.35, my - 0.035), P3(w2 * 0.9, my - 0.002), 14)
        ink.stroke([tuple(p) for p in ul], lw * 0.55, alpha=0.5, taper=(0.1, 0.1))
        ll = bez(P3(-w2 * 0.6, my + 0.04 + 0.05 * s.mouth_open), P3(-w2 * 0.2, my + 0.052 + 0.055 * s.mouth_open), P3(w2 * 0.2, my + 0.052 + 0.055 * s.mouth_open),
                 P3(w2 * 0.6, my + 0.04 + 0.05 * s.mouth_open), 12)
        ink.stroke([tuple(p) for p in ll], lw * 0.7, alpha=0.4, taper=(0.1, 0.1))

    # ------------------------------------------------------------------ webtoon face: big detailed eyes, thin lines, soft lips
    def _web_face(self, out: np.ndarray, ink: Ink, sc: float) -> None:
        s, h = self.s, self.h
        H_, W_ = out.shape[:2]
        P2 = lambda x, y, o=0.006: self.S2(x, y, o)
        lw = h * 0.010 * sc
        line = (46, 30, 32)
        w = s.head_w
        # soft blush on the cheeks and nose tip, rosy shadow around the eyes
        yy, xx = np.mgrid[0:H_, 0:W_].astype(np.float32)
        for sg in (-1, 1):
            cxy = P2(sg * 0.19 * w, 0.15, 0.0)
            r = 0.10 * h
            m = np.clip(1 - np.hypot((xx - cxy[0]) / (r * 1.3), (yy - cxy[1]) / r), 0, 1) ** 1.6 * (0.10 + 0.10 * (1 - s.age))
            out[:] = out * (1 - m[..., None]) + np.array([0.86, 0.45, 0.42], np.float32) * m[..., None]
        for sg in (-1, 1):
            self._web_eye(sg, out, ink, sc, line)
        # brows: slim, tapered, soft
        for sg in (-1, 1):
            by = -0.100 - 0.008 * s.brow
            inner = (0.05 * w * sg, by + 0.022 * s.brow_angle)
            peak = (0.17 * w * sg, by - 0.020 - 0.012 * (-s.brow_angle))
            outer = (0.29 * w * sg, by + 0.018 + 0.008 * s.brow_angle * -1)
            pts = bez(P2(*inner, 0.012), P2((inner[0] * 0.6 + peak[0] * 0.4), inner[1] - 0.006, 0.012), P2(peak[0], peak[1] - 0.004, 0.012), P2(*outer, 0.012), 18)
            col = tuple(int(255 * c) for c in np.clip(np.asarray(s.brow_color) * 1.4 + 0.05, 0, 1))
            ink.stroke([tuple(p) for p in pts], h * 0.026 * s.brow_thick * sc, color=col, taper=(0.55, 0.12), mid=1.2)
        # nose: a short shadow-side stroke, tiny nostril marks and a bright tip
        nl = s.nose_len
        side = bez(P2(0.04, -0.02), P2(0.052, 0.06), P2(0.06, 0.13 * nl), P2(0.044, 0.172 * nl), 14)
        ink.stroke([tuple(p) for p in side], lw * 0.9, color=line, alpha=0.55, taper=(0.05, 0.4))
        for sg in (-1, 1):
            n0 = P2(sg * 0.034, 0.195 * nl, 0.02)
            ink.stroke([tuple(n0 + np.array([-sg * h * 0.012, 0])), tuple(n0 + np.array([sg * h * 0.008, h * 0.004]))], lw * 1.1, color=line, alpha=0.8, taper=(0.4, 0.4))
        tip = P2(0.0, 0.17 * nl, 0.03)
        ink.blob([(tip[0] + math.cos(a_) * h * 0.012, tip[1] + math.sin(a_) * h * 0.007) for a_ in np.linspace(0, 6.28, 12)], color=(255, 246, 238), alpha=0.5)
        # lips: soft filled shapes with a dark seam and a highlight on the lower lip
        my = 0.285
        w2 = 0.088
        cl = -0.010 * s.smile
        up = bez(P2(-w2, my + cl), P2(-w2 * 0.45, my - 0.032), P2(w2 * 0.45, my - 0.032), P2(w2, my - cl), 16)
        mid = bez(P2(w2, my - cl), P2(w2 * 0.4, my + 0.006), P2(-w2 * 0.4, my + 0.006), P2(-w2, my + cl), 14)
        lo = bez(P2(-w2 * 0.92, my + cl + 0.004), P2(-w2 * 0.4, my + 0.05 + 0.04 * s.mouth_open), P2(w2 * 0.4, my + 0.05 + 0.04 * s.mouth_open), P2(w2 * 0.92, my - cl + 0.004), 16)
        rose = (210, 120, 112) if s.age < 0.5 else (178, 108, 98)
        if s.mouth_open > 0.05:
            ink.blob([tuple(p) for p in up] + [tuple(p) for p in lo[::-1]], color=(60, 18, 20), alpha=1.0)
            teeth = bez(P2(-w2 * 0.7, my - 0.006), P2(-w2 * 0.3, my - 0.012), P2(w2 * 0.3, my - 0.012), P2(w2 * 0.7, my - 0.006), 10)
            ink.blob([tuple(p) for p in teeth] + [tuple(p + np.array([0, h * 0.02 * (0.6 + s.mouth_open)])) for p in teeth[::-1]], color=(246, 238, 226), alpha=0.97)
        else:
            ink.blob([tuple(p) for p in up] + [tuple(p) for p in mid], color=rose, alpha=0.55)
            ink.blob([tuple(p) for p in mid[::-1]] + [tuple(p) for p in lo[::-1]], color=tuple(min(255, c + 22) for c in rose), alpha=0.45)
            ink.stroke([tuple(p) for p in mid], lw * 1.2, color=(92, 44, 44), taper=(0.3, 0.3))
        ink.stroke([tuple(p) for p in up], lw * 0.55, color=line, alpha=0.45, taper=(0.1, 0.1))
        lo_hl = P2(0.0, my + 0.03 + 0.03 * s.mouth_open, 0.02)
        ink.blob([(lo_hl[0] + math.cos(a_) * h * 0.03, lo_hl[1] + math.sin(a_) * h * 0.006) for a_ in np.linspace(0, 6.28, 12)], color=(255, 232, 222), alpha=0.4)
        # a soft chin / jaw line is handled by the outline pass; age marks, but gentler than before
        self._age(ink, sc * 0.8)

    def _web_eye(self, sg: int, out: np.ndarray, ink: Ink, sc: float, line) -> None:
        s, h = self.s, self.h
        H_, W_ = out.shape[:2]
        w = s.head_w
        ex, ey = 0.168 * w * sg, -0.012
        ew = {"monolid": 0.134, "round": 0.126, "almond": 0.142, "wide": 0.148}[s.eye]
        eh = {"monolid": 0.058, "round": 0.088, "almond": 0.078, "wide": 0.098}[s.eye] * (1 - 0.5 * s.lid)
        P2 = lambda x, y, o=0.004: self.S2(x, y, o)
        inner = (ex - sg * ew * 0.92, ey + 0.012)
        outer = (ex + sg * ew * 1.0, ey - 0.014 - (0.01 if s.eye in ("almond", "monolid") else 0.0))
        pin, pou = P2(*inner), P2(*outer)
        up = bez(pin, P2(ex - sg * ew * 0.35, ey - eh * 1.25 - 0.012), P2(ex + sg * ew * 0.45, ey - eh * 1.25 - 0.008), pou, 24)
        lo = bez(pou, P2(ex + sg * ew * 0.3, ey + eh * 0.55 + 0.004), P2(ex - sg * ew * 0.3, ey + eh * 0.55 + 0.008), pin, 24)
        # rosy lid shadow above the eye
        soc = Image.new("L", (W_, H_), 0)
        cx, cy = P2(ex, ey - 0.03)
        r = ew * h * 1.35
        ImageDraw.Draw(soc).ellipse((cx - r, cy - r * 0.62, cx + r, cy + r * 0.5), fill=255)
        soc = np.asarray(soc.filter(ImageFilter.GaussianBlur(h * 0.03)), np.float32) / 255.0
        out[:] = out * (1 - 0.20 * soc[..., None]) + np.array([0.60, 0.36, 0.36], np.float32) * (0.20 * soc[..., None])
        poly = [tuple(p) for p in up] + [tuple(p) for p in lo]
        m = Image.new("L", (W_, H_), 0)
        ImageDraw.Draw(m).polygon(poly, fill=255)
        mk = np.asarray(m.filter(ImageFilter.GaussianBlur(0.5)), np.float32) / 255.0
        yy = np.arange(H_, dtype=np.float32)[:, None]
        xs = [p[0] for p in poly]
        ys = [p[1] for p in poly]
        ytop, ybot = min(ys), max(ys)
        grad = np.clip((yy - ytop) / max(1.0, ybot - ytop), 0, 1)
        sclera = np.array([0.97, 0.94, 0.93], np.float32)[None, None, :] * (0.80 + 0.20 * grad)[..., None]
        out[:] = out * (1 - mk[..., None]) + sclera * mk[..., None]
        # iris: a large disc, dark at the top, lighter below, with a limbal ring; clipped by the lids
        ic = P2(ex + sg * 0.003, ey + 0.001)
        rad = max(eh * h * 1.05, ew * h * 0.5)
        iris = Image.new("L", (W_, H_), 0)
        ImageDraw.Draw(iris).ellipse((ic[0] - rad, ic[1] - rad * 1.02, ic[0] + rad, ic[1] + rad * 1.02), fill=255)
        irm = np.asarray(iris.filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255.0 * mk
        icol = np.asarray(s.iris, np.float32)
        t = np.clip((yy - (ic[1] - rad)) / (2 * rad), 0, 1)
        dist = np.sqrt(((np.arange(W_)[None, :] - ic[0]) ** 2 + (yy - ic[1]) ** 2)) / rad
        ring = np.clip((dist - 0.78) / 0.22, 0, 1)
        ir_rgb = icol[None, None, :] * (0.50 + 0.85 * t)[..., None] * (1 - 0.45 * ring[..., None])
        ir_rgb = ir_rgb + np.clip(1.0 - np.abs(dist - 0.45) * 5, 0, 1)[..., None] * 0.10 * (1 + icol)
        out[:] = out * (1 - irm[..., None]) + np.clip(ir_rgb, 0, 1) * irm[..., None]
        pup = Image.new("L", (W_, H_), 0)
        ImageDraw.Draw(pup).ellipse((ic[0] - rad * 0.38, ic[1] - rad * 0.4, ic[0] + rad * 0.38, ic[1] + rad * 0.4), fill=255)
        pm = np.asarray(pup.filter(ImageFilter.GaussianBlur(0.5)), np.float32) / 255.0 * mk
        out[:] = out * (1 - pm[..., None]) + np.array([0.04, 0.03, 0.035], np.float32) * pm[..., None]
        # catchlights: a large one upper-left and a small one lower-right
        for (dx, dy, rr, a_) in ((-0.38, -0.40, 0.26, 0.97), (0.34, 0.34, 0.12, 0.7)):
            hl = Image.new("L", (W_, H_), 0)
            hx, hy = ic[0] + dx * rad, ic[1] + dy * rad
            ImageDraw.Draw(hl).ellipse((hx - rad * rr, hy - rad * rr, hx + rad * rr, hy + rad * rr), fill=255)
            hm = np.asarray(hl.filter(ImageFilter.GaussianBlur(0.5)), np.float32) / 255.0 * mk
            out[:] = out * (1 - hm[..., None] * a_) + hm[..., None] * a_
        # upper lash line (thick, tapered, with a wing), lash flicks, double-lid crease and a faint lower line
        lwid = h * 0.016 * sc
        ink.stroke([tuple(p) for p in up], lwid * (2.0 if s.eye in ("monolid", "almond") else 1.6), color=line, taper=(0.3, 0.18), mid=1.35)
        wing = [pou, tuple(np.asarray(pou) + np.array([sg * h * 0.032, -h * 0.010])), tuple(np.asarray(pou) + np.array([sg * h * 0.05, -h * 0.004]))]
        ink.stroke(wing, lwid * 1.1, color=line, taper=(0.9, 0.05))
        for i in range(5):                                                        # lash flicks along the outer half of the upper lid
            idx = 10 + i * 3
            p0 = np.asarray(up[min(idx, len(up) - 1)])
            ink.stroke([tuple(p0), tuple(p0 + np.array([sg * h * 0.014, -h * 0.018 - i * h * 0.002]))], lwid * 0.55, color=line, alpha=0.85, taper=(0.9, 0.05))
        ink.stroke([tuple(p) for p in lo[3:-6]], lwid * 0.4, color=line, alpha=0.4, taper=(0.1, 0.1))
        crease = bez(P2(ex - sg * ew * 0.7, ey - eh * 1.6 - 0.02), P2(ex - sg * ew * 0.1, ey - eh * 1.9 - 0.03), P2(ex + sg * ew * 0.55, ey - eh * 1.8 - 0.022), P2(ex + sg * ew * 0.98, ey - eh * 1.2 - 0.012), 16)
        ink.stroke([tuple(p) for p in crease], lwid * 0.5, color=line, alpha=0.55 if s.eye != "monolid" else 0.35, taper=(0.1, 0.1))
        if s.age > 0.4:
            bag = bez(P2(ex - sg * ew * 0.6, ey + 0.05), P2(ex - sg * ew * 0.1, ey + 0.068), P2(ex + sg * ew * 0.55, ey + 0.062), P2(ex + sg * ew * 0.95, ey + 0.04), 12)
            ink.stroke([tuple(p) for p in bag], lwid * 0.45, color=line, alpha=0.3 * s.age, taper=(0.1, 0.1))

    def _age(self, ink, sc):
        s, h = self.s, self.h
        a = s.age
        P3 = lambda x, y, o=0.008: self.S2(x, y, o)
        lw = h * 0.011 * sc
        if a > 0.25:
            for sg in (-1, 1):   # nasolabial folds
                f = bez(P3(sg * 0.075, 0.2), P3(sg * 0.115, 0.23), P3(sg * 0.13, 0.27), P3(sg * 0.11, 0.33), 14)
                ink.stroke([tuple(p) for p in f], lw * (0.5 + 0.6 * a), alpha=0.22 + 0.2 * a, taper=(0.05, 0.05))
        if a > 0.45:
            for k in range(3):   # forehead lines
                y = -0.2 - 0.03 * k
                f = bez(P3(-0.18, y), P3(-0.06, y - 0.01), P3(0.07, y - 0.008), P3(0.19, y + 0.003), 14)
                ink.stroke([tuple(p) for p in f], lw * 0.8, alpha=0.32 + 0.12 * a, taper=(0.05, 0.05), wobble=0.4)
            for sg in (-1, 1):   # crow's feet
                for k in range(2):
                    c0 = P3(sg * 0.285, -0.02 + 0.02 * k)
                    c1 = P3(sg * 0.335, -0.035 + 0.03 * k)
                    ink.stroke([tuple(c0), tuple(c1)], lw * 0.6, alpha=0.4, taper=(0.1, 0.1))

    # ------------------------------------------------------------------ hair painting
    def _paint_hair_web(self, out: np.ndarray, b: Buf, hm: np.ndarray, ink: Ink) -> np.ndarray:
        """Webtoon hair: flat colour mass, a soft cool highlight band, many fine strand lines flowing from the crown."""
        s, h = self.s, self.h
        H, W = hm.shape
        base = np.asarray(s.hair, np.float32)
        a = _blur(hm.astype(np.float32), 0.8)[..., None]
        X = np.arange(W, dtype=np.float32)[None, :]
        Y = np.arange(H, dtype=np.float32)[:, None]
        cx, cy = float(self.c[0]), float(self.c[1]) - 0.12 * h
        shade = np.clip((Y - (self.c[1] - 0.55 * h)) / (0.8 * h), 0, 1)
        col = base[None, None, :] * (1.15 - 0.35 * shade[..., None]) + 0.05
        band = np.clip(1 - np.abs((Y - (self.c[1] - 0.33 * h)) / (0.07 * h)) - 0.3 * np.abs((X - (cx - 0.05 * h)) / (0.4 * h)), 0, 1)
        col = col + band[..., None] * np.array([0.30, 0.31, 0.36], np.float32) * 0.9
        if s.gray > 0:
            tx = np.abs(X - self.c[0]) / (0.38 * h)
            gm = np.clip((tx - 0.5) * 2.2, 0, 1) * np.clip((Y - (self.c[1] - 0.18 * h)) / (0.24 * h), 0, 1) * s.gray
            col = col * (1 - gm[..., None] * 0.7) + np.array([0.62, 0.60, 0.60], np.float32) * gm[..., None] * 0.7
        out = out * (1 - a) + np.clip(col, 0, 1) * a
        ys, xs = np.nonzero(hm)
        if len(xs) == 0:
            return out
        rng = np.random.default_rng(s.seed + 11)
        dark = tuple(int(255 * c) for c in np.clip(base * 0.45, 0, 1))
        light = tuple(int(255 * c) for c in np.clip(base * 1.6 + 0.30, 0, 1))
        n = int(60 + 120 * (hm.sum() / (h * h)))
        for k in range(n):                                       # fine strands fanning out from the part
            i = rng.integers(len(xs))
            x, y = float(xs[i]), float(ys[i])
            dx = (x - cx) / (0.42 * h)
            low = s.hair_style == "long" and y > self.c[1] + 0.05 * h
            ang = math.radians(90 + (12 if low else 46) * dx + 3 * rng.normal())
            L = h * rng.uniform(0.14, 0.30) * (1.7 if low else 1.0)
            ex, ey = x + math.cos(ang) * L, y + math.sin(ang) * L
            bend = rng.normal(0, h * 0.02) + dx * h * 0.03
            mx, my = (x + ex) / 2 + bend, (y + ey) / 2
            path = bez((x, y), (mx, my), (mx, my), (ex, ey), 12)
            ink.stroke([tuple(p) for p in path], h * rng.uniform(0.0035, 0.0070), color=light if rng.random() < 0.4 else dark,
                       alpha=rng.uniform(0.45, 0.85), taper=(0.1, 0.05))
        edge = hm & ~(np.roll(hm, 3, 0) & np.roll(hm, -3, 0) & np.roll(hm, 3, 1) & np.roll(hm, -3, 1))
        ey_, ex_ = np.nonzero(edge)
        for i in (rng.choice(len(ex_), size=min(12, len(ex_)), replace=False) if len(ex_) else []):
            x, y = float(ex_[i]), float(ey_[i])
            dx, dy = x - cx, y - cy
            ln = math.hypot(dx, dy) + 1e-6
            nx_, ny_ = dx / ln, dy / ln
            L = h * rng.uniform(0.08, 0.2)
            side = 1 if dx >= 0 else -1
            p = [(x, y), (x + nx_ * L * 0.35, y + L * 0.35), (x + nx_ * L * 0.5 + side * L * 0.1, y + L * 0.75), (x + nx_ * L * 0.35 + side * L * 0.22, y + L)]
            ink.stroke([tuple(q) for q in bez(*p, n=14)], h * rng.uniform(0.003, 0.006), color=tuple(int(255 * c) for c in base * 0.55), alpha=0.8, taper=(0.9, 0.03))
        return out

    def _paint_hair(self, out: np.ndarray, b: Buf, hm: np.ndarray, ink: Ink) -> np.ndarray:
        if WEB:
            return self._paint_hair_web(out, b, hm, ink)
        s, h = self.s, self.h
        H, W = hm.shape
        base = np.asarray(s.hair, np.float32)
        a = _blur(hm.astype(np.float32), 1.0)[..., None]
        yy = np.clip((np.arange(H)[:, None] - (self.c[1] - 0.55 * h)) / (0.7 * h), 0, 1)
        streak = fnoise(H, W, h * 0.012, h * 0.10, s.seed + 5) * 0.5 + 0.5
        # a near-black mass with a faint cool sheen where the light catches it (upper-left)
        lit = np.clip(1.0 - np.abs((np.arange(W)[None, :] - (self.c[0] - 0.18 * h)) / (0.5 * h)), 0, 1) * (1 - yy) ** 0.6
        sheen = np.clip(streak * lit - 0.25, 0, 1) * 0.30
        hair_rgb = base[None, None, :] * 0.8 + sheen[..., None] * np.array([0.55, 0.58, 0.68], np.float32)
        if s.gray > 0:                                         # grey at the temples
            tx = np.abs(np.arange(W)[None, :] - self.c[0]) / (0.38 * h)
            ty = np.clip((np.arange(H)[:, None] - (self.c[1] - 0.18 * h)) / (0.24 * h), 0, 1)
            gm = np.clip((tx - 0.5) * 2.2, 0, 1) * ty * s.gray * (0.6 + 0.6 * streak)
            hair_rgb = hair_rgb * (1 - gm[..., None] * 0.85) + np.array([0.52, 0.50, 0.48], np.float32) * gm[..., None] * 0.85
        if s.hair_style == "thin":                              # thinning crown: scalp shows through
            cm = np.clip(1.0 - ((np.arange(W)[None, :] - self.c[0]) ** 2 / (0.2 * h) ** 2 + (np.arange(H)[:, None] - (self.c[1] - 0.38 * h)) ** 2 / (0.13 * h) ** 2), 0, 1)
            a = a * (1 - 0.32 * cm[..., None])
        out = out * (1 - a) + hair_rgb * a
        ys, xs = np.nonzero(hm)
        if len(xs) == 0:
            return out
        rng = np.random.default_rng(s.seed + 11)
        cx, cy = float(self.c[0]), float(self.c[1]) - 0.12 * h
        dark = tuple(int(255 * c) for c in np.clip(base * 0.55, 0, 1))
        hl = tuple(int(255 * c) for c in np.clip(base * 2.6 + 0.16, 0, 1))
        # flowing strand lines inside the mass: long, curved, following the sweep of the hair
        for _ in range(int(26 + 60 * (hm.sum() / (h * h)))):
            i = rng.integers(len(xs))
            x, y = float(xs[i]), float(ys[i])
            dx = (x - cx) / (0.4 * h)
            sweep = -0.6 if s.hair_style in ("undercut", "short", "thin") else 0.0
            ang = math.radians(78 + 55 * dx + 20 * rng.normal()) + sweep * 0.2
            L = h * rng.uniform(0.10, 0.26)
            ex, ey = x + math.cos(ang) * L, y + math.sin(ang) * L
            mx, my = (x + ex) / 2 + rng.normal(0, h * 0.02), (y + ey) / 2 + rng.normal(0, h * 0.02)
            path = bez((x, y), (mx, my), (mx, my), (ex, ey), 12)
            ink.stroke([tuple(p) for p in path], h * rng.uniform(0.006, 0.013), color=hl if rng.random() < 0.28 else dark, alpha=rng.uniform(0.35, 0.75), taper=(0.15, 0.05))
        # strands that escape the silhouette, hooking at the tips like the reference painting
        edge = hm & ~(np.roll(hm, 3, 0) & np.roll(hm, -3, 0) & np.roll(hm, 3, 1) & np.roll(hm, -3, 1))
        ey_, ex_ = np.nonzero(edge)
        for i in (rng.choice(len(ex_), size=min(16, len(ex_)), replace=False) if len(ex_) else []):
            x, y = float(ex_[i]), float(ey_[i])
            dx, dy = x - cx, y - cy
            ln = math.hypot(dx, dy) + 1e-6
            nx_, ny_ = dx / ln, dy / ln
            L = h * rng.uniform(0.08, 0.24)
            side = 1 if dx >= 0 else -1
            p = [(x - nx_ * L * 0.08, y - ny_ * L * 0.08), (x + nx_ * L * 0.4, y + ny_ * L * 0.3 + L * 0.25), (x + nx_ * L * 0.55 + side * L * 0.2, y + L * 0.8),
                 (x + nx_ * L * 0.35 + side * L * 0.55, y + L * 0.95)]
            ink.stroke([tuple(q) for q in bez(*p, n=14)], h * rng.uniform(0.012, 0.024), color=tuple(int(255 * c) for c in base * 0.8), taper=(0.9, 0.04), mid=1.2)
        return out


def _euler_from(R: np.ndarray) -> tuple[float, float, float]:
    """Inverse of r3d._rotmat (Rz @ Ry @ Rx)."""
    sy = -R[2, 0]
    ay = math.asin(max(-1.0, min(1.0, sy)))
    if abs(math.cos(ay)) > 1e-6:
        ax = math.atan2(R[2, 1], R[2, 2])
        az = math.atan2(R[1, 0], R[0, 0])
    else:
        ax = math.atan2(-R[1, 2], R[1, 1])
        az = 0.0
    return ax, ay, az
