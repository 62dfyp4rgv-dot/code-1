"""A small 'digital painting' engine on top of Pillow/numpy.

Why this exists: drawing filled polygons with uniform outlines looks like vector clip-art. A real
drawing differs in four ways, and this module reproduces each:

1. Colour and line are separate layers. Colour is painted, then *shaded as volume* (see `finish`):
   every material's silhouette is blurred into a height field, normals are taken from it, and a light
   gives smooth form shading, so a head, an arm or a lock of hair reads as round, not as a cut-out.
   Cast shadows (hair on the forehead, chin on the neck) and a hair sheen are added the same way.
2. Lines are strokes, not outlines: variable pressure, wobble, overshoot, doubled passes, tapered
   ends, heavier on the shadow side, drawn on their own layer.
3. Shadows carry visible brush marks along the form (not only smooth gradients), and surfaces get
   paper / watercolour grain.
4. `looseness` (0 clean pen-and-ink ... 1 raw sketch-paint) scales all of the above together.

Painter's-order semantics are kept: a new opaque fill erases the line work beneath it.
"""
from __future__ import annotations

import math
import random
from typing import Optional

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

RGB = tuple[int, int, int]
MATERIALS = ("skin", "neck", "hair", "cloth")

# multiplicative shadow tint per material (R, G, B): warm skin shadows, cool hair/cloth shadows
_SHADOW_MUL = {"skin": (0.82, 0.60, 0.64), "neck": (0.76, 0.55, 0.60), "hair": (0.46, 0.49, 0.62), "cloth": (0.56, 0.56, 0.70)}
_SHADE_STRENGTH = {"skin": 0.7, "neck": 0.8, "hair": 0.95, "cloth": 0.9}
_SHADE_RADIUS = {"skin": (0.06, 0.34), "neck": (0.05, 0.2), "hair": (0.05, 0.3), "cloth": (0.06, 0.4)}   # in head heights
_NORMAL_GAIN = 5.0


class _OffsetDraw:
    """ImageDraw proxy that accepts absolute coordinates and draws into a cropped tile."""

    def __init__(self, draw: ImageDraw.ImageDraw, ox: float, oy: float):
        self._d, self._ox, self._oy = draw, ox, oy

    def _t(self, xy):
        if isinstance(xy[0], (int, float)):                 # flat [x0, y0, x1, y1, ...]
            return [v - (self._ox if i % 2 == 0 else self._oy) for i, v in enumerate(xy)]
        return [(p[0] - self._ox, p[1] - self._oy) for p in xy]

    def polygon(self, xy, **kw): self._d.polygon(self._t(xy), **kw)
    def ellipse(self, xy, **kw): self._d.ellipse(self._t(xy), **kw)
    def line(self, xy, **kw): self._d.line(self._t(xy), **kw)
    def rectangle(self, xy, **kw): self._d.rectangle(self._t(xy), **kw)
    def pieslice(self, xy, *a, **kw): self._d.pieslice(self._t(xy), *a, **kw)


def smoothstep(a: float, b: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def gauss(arr: np.ndarray, sigma: float) -> np.ndarray:
    """Separable Gaussian blur of a float array (edge-replicated)."""
    r = max(1, int(sigma * 3))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / max(sigma, 0.3)) ** 2).astype(np.float32)
    k /= k.sum()
    out = arr.astype(np.float32)
    for axis in (0, 1):
        padw = [(0, 0), (0, 0)]
        padw[axis] = (r, r)
        pa = np.pad(out, padw, mode="edge")
        acc = np.zeros_like(out)
        n = out.shape[axis]
        for i, kv in enumerate(k):
            sl = [slice(None), slice(None)]
            sl[axis] = slice(i, i + n)
            acc += kv * pa[tuple(sl)]
        out = acc
    return out


def _noise(w: int, h: int, sx: float, sy: float, rng: np.random.Generator) -> np.ndarray:
    """Smooth random field in [-1, 1]; sx / sy are the feature sizes in px (anisotropic => brush streaks)."""
    gw, gh = max(2, int(w / max(sx, 1))) + 2, max(2, int(h / max(sy, 1))) + 2
    small = rng.standard_normal((gh, gw)).astype(np.float32)
    img = Image.fromarray(small, "F").resize((w, h), Image.BICUBIC)
    a = np.asarray(img, dtype=np.float32)
    return a / (np.abs(a).max() + 1e-6)


class Paint:
    """One figure's painting surface (cropped to the figure's bounding box)."""

    def __init__(self, layer: Image.Image, mask: Image.Image, bbox: tuple[float, float, float, float], lw: int,
                 head_h: float, light_side: int, seed: int, ink: RGB = (44, 36, 44), looseness: float = 0.3):
        x0, y0, x1, y1 = bbox
        self.ox, self.oy = max(0, int(x0)), max(0, int(y0))
        x1, y1 = min(layer.width, int(x1) + 1), min(layer.height, int(y1) + 1)
        self.w, self.h = max(1, x1 - self.ox), max(1, y1 - self.oy)
        self.layer, self.mask = layer, mask
        self.lw, self.ink, self.hh, self.light_side, self.L = lw, ink, head_h, light_side, looseness
        self.rng = random.Random(seed)
        self.nrng = np.random.default_rng(seed)
        self.paint = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        self.lines = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        self.sil = Image.new("L", (self.w, self.h), 0)
        self.mats = {m: Image.new("L", (self.w, self.h), 0) for m in MATERIALS}
        self.pd = ImageDraw.Draw(self.paint)
        self.ld = ImageDraw.Draw(self.lines)
        self.sd = ImageDraw.Draw(self.sil)
        self.md = {m: ImageDraw.Draw(im) for m, im in self.mats.items()}
        self.d = _OffsetDraw(self.pd, self.ox, self.oy)
        self.sheen: Optional[RGB] = None
        self._rot: Optional[tuple[float, float, float, float]] = None   # (cos, sin, pivot_x, pivot_y)
        self._angle = 0.0

    # ------------------------------------------------------------------ transform (head tilt)
    def set_rotation(self, angle: float, pivot: tuple[float, float]) -> None:
        self._angle = angle
        self._rot = (math.cos(angle), math.sin(angle), pivot[0], pivot[1]) if abs(angle) > 1e-4 else None

    def clear_rotation(self) -> None:
        self._rot = None

    def pt(self, p):
        """Apply the active rotation (used for the tilted head) to an absolute point."""
        if self._rot is None:
            return p
        c, s, px, py = self._rot
        dx, dy = p[0] - px, p[1] - py
        return (px + dx * c - dy * s, py + dx * s + dy * c)

    def _t(self, pts):
        return [(q[0] - self.ox, q[1] - self.oy) for q in (self.pt(p) for p in pts)]

    # ------------------------------------------------------------------ colour
    def fill(self, poly, color: RGB, mat: str = "", alpha: int = 255) -> None:
        """Opaque paint. Hides (erases) any line work already under it, like painting over ink."""
        p = self._t(poly)
        self.pd.polygon(p, fill=color + (alpha,))
        if alpha >= 250:
            self.ld.polygon(p, fill=(0, 0, 0, 0))
            self.sd.polygon(p, fill=255)
            for name, d in self.md.items():
                d.polygon(p, fill=255 if name == mat else 0)

    def fill_ellipse(self, box, color: RGB, mat: str = "") -> None:
        cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        rx, ry = (box[2] - box[0]) / 2, (box[3] - box[1]) / 2
        self.fill([(cx + math.cos(a) * rx, cy + math.sin(a) * ry) for a in [i * math.pi / 18 for i in range(36)]], color, mat)

    def soft_fill(self, poly, color: RGB, alpha: float, blur: float, clip=None) -> None:
        """Airbrush: a blurred shape of `color` onto the paint layer, optionally clipped to another polygon."""
        p = self._t(poly)
        xs, ys = [q[0] for q in p], [q[1] for q in p]
        pad = blur * 3 + 2
        x0, y0 = max(0, int(min(xs) - pad)), max(0, int(min(ys) - pad))
        x1, y1 = min(self.w, int(max(xs) + pad) + 1), min(self.h, int(max(ys) + pad) + 1)
        if x1 - x0 < 3 or y1 - y0 < 3:
            return
        m = Image.new("L", (x1 - x0, y1 - y0), 0)
        ImageDraw.Draw(m).polygon([(a - x0, b - y0) for a, b in p], fill=255)
        if blur > 0.4:
            m = m.filter(ImageFilter.GaussianBlur(blur))
        if clip is not None:
            c = Image.new("L", m.size, 0)
            ImageDraw.Draw(c).polygon([(a - x0, b - y0) for a, b in self._t(clip)], fill=255)
            m = ImageChops.multiply(m, c)
        m = m.point(lambda v: int(v * alpha))
        self.paint.paste(Image.new("RGBA", m.size, color + (255,)), (x0, y0), m)

    def soft_ellipse(self, cx, cy, rx, ry, color: RGB, alpha: float, blur: float, clip=None) -> None:
        self.soft_fill([(cx + math.cos(a) * rx, cy + math.sin(a) * ry) for a in [i * math.pi / 12 for i in range(24)]], color, alpha, blur, clip)

    def paste_tile(self, tile: Image.Image, origin) -> None:
        """Composite an RGBA tile (absolute origin) onto the paint layer, following the active rotation."""
        ox_, oy_ = origin
        if self._rot is not None:
            c = self.pt((ox_ + tile.width / 2, oy_ + tile.height / 2))
            tile = tile.rotate(-math.degrees(self._angle), expand=True, resample=Image.BICUBIC)
            ox_, oy_ = c[0] - tile.width / 2, c[1] - tile.height / 2
        x, y = int(ox_) - self.ox, int(oy_) - self.oy
        if x >= self.w or y >= self.h or x + tile.width <= 0 or y + tile.height <= 0:
            return
        cx0, cy0 = max(0, -x), max(0, -y)
        tile = tile.crop((cx0, cy0, min(tile.width, self.w - x), min(tile.height, self.h - y)))
        self.paint.alpha_composite(tile, (x + cx0, y + cy0))

    # ------------------------------------------------------------------ line work
    def _poly_local(self, p, color: RGB, alpha: int) -> None:
        """Draw a polygon given in tile-local coordinates onto the line layer (alpha-correct)."""
        if alpha >= 250:
            self.ld.polygon(p, fill=color + (255,))
            return
        xs, ys = [q[0] for q in p], [q[1] for q in p]
        x0, y0 = max(0, int(min(xs)) - 2), max(0, int(min(ys)) - 2)
        x1, y1 = min(self.w, int(max(xs)) + 3), min(self.h, int(max(ys)) + 3)
        if x1 <= x0 or y1 <= y0:
            return
        tile = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
        ImageDraw.Draw(tile).polygon([(a - x0, b - y0) for a, b in p], fill=color + (alpha,))
        self.lines.alpha_composite(tile, (x0, y0))

    def _poly_on_lines(self, poly, color: RGB, alpha: int) -> None:
        self._poly_local(self._t(poly), color, alpha)

    def taper(self, pts, w0: float, w1: float, color: RGB, alpha: int = 255, wmid: Optional[float] = None) -> None:
        """Variable-width stroke (brush-pen): width runs w0 -> wmid -> w1 along the path."""
        if len(pts) < 2:
            return
        n = len(pts)
        left, right = [], []
        for i, (x, y) in enumerate(pts):
            a, b = pts[max(0, i - 1)], pts[min(n - 1, i + 1)]
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy) or 1.0
            nx, ny = -dy / L, dx / L
            t = i / (n - 1)
            w = w0 + (w1 - w0) * t if wmid is None else ((w0 + (wmid - w0) * (t / 0.5)) if t < 0.5 else (wmid + (w1 - wmid) * ((t - 0.5) / 0.5)))
            left.append((x + nx * w / 2, y + ny * w / 2))
            right.append((x - nx * w / 2, y - ny * w / 2))
        self._poly_on_lines(left + right[::-1], color, alpha)

    def hand_line(self, pts, width: float, color: Optional[RGB] = None, alpha: int = 255, closed: bool = False,
                  wobble: float = 0.45, end_taper: float = 0.3, _second: bool = False) -> None:
        """One pen stroke along `pts`: resampled, wobbled, pressure-modulated, heavier on the shadow side, tapered
        (and, when loose, overshooting its ends and sometimes doubled by a second lighter pass)."""
        color = color or self.ink
        L = self.L
        P = np.asarray([self.pt(p) for p in pts], dtype=np.float64)
        if closed:
            P = np.vstack([P, P[:1]])
        elif L > 0.35 and not _second and len(P) >= 3 and self.rng.random() < 0.7:
            for end in (0, -1):                                     # overshoot: the pen runs past where it should stop
                d = P[end] - P[1 if end == 0 else -2]
                n_ = float(np.hypot(*d))
                if n_ > 1e-6:
                    ext = P[end] + d / n_ * width * self.rng.uniform(1, 5) * L
                    P = np.vstack([ext[None, :], P]) if end == 0 else np.vstack([P, ext[None, :]])
        seg = np.hypot(*np.diff(P, axis=0).T)
        total = float(seg.sum())
        if total < 2:
            return
        step = max(1.0, width * 0.7)
        s_old = np.concatenate([[0], np.cumsum(seg)])
        n = max(3, int(total / step))
        s_new = np.linspace(0, total, n)
        Q = np.stack([np.interp(s_new, s_old, P[:, 0]), np.interp(s_new, s_old, P[:, 1])], axis=1)
        T = np.gradient(Q, axis=0)
        T /= (np.hypot(T[:, 0], T[:, 1])[:, None] + 1e-9)
        N = np.stack([-T[:, 1], T[:, 0]], axis=1)
        u = s_new / total
        ph = [self.rng.uniform(0, 6.28) for _ in range(3)]
        wob = (np.sin(2 * np.pi * (s_new / (width * (22 + 14 * L)) + ph[0])) * 0.65 + np.sin(2 * np.pi * (s_new / (width * (9 + 5 * L)) + ph[1])) * 0.35) * wobble * (1 + 1.8 * L) * width * 0.4
        Q = Q + N * wob[:, None]
        light = np.array([self.light_side * 0.6, -0.8])
        shade_side = np.clip(-(N @ light), 0, 1)
        press = 0.78 + (0.3 + 0.35 * L) * np.sin(2 * np.pi * (s_new / (width * 22) + ph[2])) + 0.35 * shade_side
        if closed:
            tp = np.ones_like(u)
        else:
            edge = np.minimum(s_new, total - s_new) / (width * 5)
            tp = end_taper + (1 - end_taper) * smoothstep(0, 1, edge)
        w = np.maximum(0.6, width * press * tp)
        left = Q + N * (w / 2)[:, None]
        right = Q - N * (w / 2)[:, None]
        poly = [(float(p[0]) - self.ox, float(p[1]) - self.oy) for p in left] + [(float(p[0]) - self.ox, float(p[1]) - self.oy) for p in right[::-1]]
        self._poly_local(poly, color, alpha)
        if L > 0.5 and not _second and not closed and self.rng.random() < L * 0.4:     # a second, lighter, slightly-off pass
            off = N[len(N) // 2] * width * self.rng.uniform(0.6, 1.4)
            keep, self._rot = self._rot, None                       # Q is already in rotated coordinates
            try:
                self.hand_line([(float(x + off[0]), float(y + off[1])) for x, y in Q[::max(1, len(Q) // 12)]], width * 0.55, color, int(alpha * 0.55), False, wobble, end_taper, _second=True)
            finally:
                self._rot = keep

    def contour(self, poly, width: float, color: Optional[RGB] = None, alpha: int = 255, pieces: int = 3) -> None:
        """Closed shape drawn the way a hand does it: a few overlapping strokes, not one uniform loop."""
        pts = list(poly)
        n = len(pts)
        if n < 6:
            self.hand_line(pts, width, color, alpha, closed=True)
            return
        start = self.rng.randrange(n)
        pts = pts[start:] + pts[:start]
        k = max(1, pieces + int(2 * self.L))
        for i in range(k):
            a, b = i * n // k, (i + 1) * n // k + max(2, int(n / (40 - 28 * self.L)))
            seg = pts[a:min(b, n)] + (pts[:b - n] if b > n else [])
            self.hand_line(seg, width, color, alpha, closed=False, end_taper=0.55)

    def flyaways(self, edge, n: int, length: float, width: float, color: RGB, outward_from, curl: float = 1.0, flow=(0.0, 1.0)) -> None:
        """Loose hairs escaping the silhouette. They start inside the hair, leave the outline, follow the hair's
        flow (mostly down) and curl at the tip, like the stray locks in a sketch, not whiskers."""
        if len(edge) < 3:
            return
        cx, cy = outward_from
        for _ in range(n):
            p0 = edge[self.rng.randrange(1, len(edge) - 1)]
            ox_, oy_ = p0[0] - cx, p0[1] - cy
            L_ = math.hypot(ox_, oy_) or 1.0
            ox_, oy_ = ox_ / L_, oy_ / L_
            dx, dy = ox_ * 0.45 + flow[0] * 0.9, oy_ * 0.45 + flow[1] * 0.9           # blend outward with the hair's flow
            M = math.hypot(dx, dy) or 1.0
            dx, dy = dx / M, dy / M
            tx, ty = -dy, dx
            ln = length * self.rng.uniform(0.35, 1.0)
            sg = self.rng.choice((-1, 1)) * curl
            start = (p0[0] - dx * ln * 0.12, p0[1] - dy * ln * 0.12)
            ctrl = [start,
                    (p0[0] + dx * ln * 0.35 + tx * ln * 0.10 * sg, p0[1] + dy * ln * 0.35 + ty * ln * 0.10 * sg),
                    (p0[0] + dx * ln * 0.70 + tx * ln * 0.35 * sg, p0[1] + dy * ln * 0.70 + ty * ln * 0.35 * sg),
                    (p0[0] + dx * ln * 0.70 + tx * ln * 0.75 * sg, p0[1] + dy * ln * 0.55 + ty * ln * 0.75 * sg)]       # the hook at the tip
            path = []
            for k in range(15):
                t = k / 14
                a_, b_, c_, d_ = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3
                path.append((a_ * ctrl[0][0] + b_ * ctrl[1][0] + c_ * ctrl[2][0] + d_ * ctrl[3][0],
                             a_ * ctrl[0][1] + b_ * ctrl[1][1] + c_ * ctrl[2][1] + d_ * ctrl[3][1]))
            self.taper(path, width * 1.1, width * 0.12, color, 235, wmid=width * 1.5)

    # ------------------------------------------------------------------ finishing
    def _lowres(self, img: Image.Image, f: int) -> np.ndarray:
        sw, sh = max(2, self.w // f), max(2, self.h // f)
        return np.asarray(img.resize((sw, sh), Image.BILINEAR), dtype=np.float32) / 255.0

    def _up(self, arr: np.ndarray, size=None) -> np.ndarray:
        return np.asarray(Image.fromarray(arr.astype(np.float32), "F").resize(size or (self.w, self.h), Image.BILINEAR), dtype=np.float32)

    def _brush_marks(self, f: int, small, grads, size):
        """Visible painted strokes along the form in the shaded areas (what turns a gradient into a painting).
        Strokes are drawn at working resolution, thin and individually readable, and build up where they overlap."""
        L = max(0.0, (self.L - 0.35) / 0.65)           # clean styles stay smooth; only loose ones show brush strokes
        if L < 0.05:
            return None
        pw, ph = size
        kx, ky = pw / max(1, next(iter(small.values())).shape[1]), ph / max(1, next(iter(small.values())).shape[0])
        hw = self.hh * pw / self.w                                  # head height in working pixels
        dark = Image.new("L", size, 0)
        dd = ImageDraw.Draw(dark)
        light = Image.new("L", size, 0)
        ld = ImageDraw.Draw(light)

        def stroke(draw, x, y, ang, ln, wd, val):
            c, s_ = math.cos(ang), math.sin(ang)
            draw.polygon([(x - c * ln / 2, y - s_ * ln / 2), (x - s_ * wd / 2, y + c * wd / 2), (x + c * ln / 2, y + s_ * ln / 2), (x + s_ * wd / 2, y - c * wd / 2)], fill=val)

        for mat in ("skin", "neck", "cloth"):
            if mat not in grads:
                continue
            nx, ny, lit = grads[mat]
            mk = small[mat]
            ys, xs = np.nonzero((mk > 0.5) & (lit < 0.82))
            if len(xs) < 20:
                continue
            per_stroke = (hw * 0.1) * (hw * 0.015) / (kx * ky)           # area of an average stroke, in low-res pixels
            n = int(min(len(xs) * 3, len(xs) / max(1.0, per_stroke) * 4.5 * L + 1))
            idx = self.nrng.choice(len(xs), size=min(n, len(xs)), replace=False)
            for i in idx:
                yy_, xx_ = ys[i], xs[i]
                gx, gy = nx[yy_, xx_], ny[yy_, xx_]
                ang = math.atan2(gx, -gy) if math.hypot(gx, gy) > 0.04 else self.rng.uniform(0, math.pi)       # run along the form
                ang += self.rng.uniform(-0.3, 0.3)
                depth = min(1.0, (1 - float(lit[yy_, xx_])) * 3.0)
                stroke(dd, (xx_ + self.rng.random()) * kx, (yy_ + self.rng.random()) * ky, ang, hw * self.rng.uniform(0.05, 0.14),
                       hw * self.rng.uniform(0.01, 0.03), int(255 * self.rng.uniform(0.08, 0.24) * depth))
            if L > 0.5:
                ys2, xs2 = np.nonzero((mk > 0.5) & (lit > 0.9))
                if len(xs2) > 20:
                    for i in self.nrng.choice(len(xs2), size=min(len(xs2), max(1, n // 4)), replace=False):
                        stroke(ld, (xs2[i] + self.rng.random()) * kx, (ys2[i] + self.rng.random()) * ky, self.rng.uniform(0, math.pi),
                               hw * self.rng.uniform(0.04, 0.1), hw * self.rng.uniform(0.006, 0.014), int(255 * self.rng.uniform(0.15, 0.35)))
        dark = dark.filter(ImageFilter.GaussianBlur(0.8))
        light = light.filter(ImageFilter.GaussianBlur(0.8))
        return np.asarray(dark, dtype=np.float32) / 255.0, np.asarray(light, dtype=np.float32) / 255.0

    def finish(self, shade: bool = True, grain: float = 1.0) -> None:
        """Volume-shade the materials, add brush marks and grain, then composite colour and line work onto the panel.

        Shading is smooth, so the colour work runs on a reduced-resolution copy (half size for large figures) and is
        upsampled before the crisp line layer goes on top."""
        r = 2 if min(self.w, self.h) > 600 else 1
        pw, ph = max(2, self.w // r), max(2, self.h // r)
        pimg = self.paint.reduce(r) if r > 1 else self.paint
        pw, ph = pimg.size
        rgba = np.asarray(pimg, dtype=np.float32)
        a = rgba[..., 3:4]
        if a.max() <= 0:                                  # line work only: nothing to shade, but the lines must still land
            self.layer.alpha_composite(self.lines, (self.ox, self.oy))
            sil = self.lines.getchannel("A").point(lambda v: 255 if v > 40 else 0)
            self.mask.paste(255, (self.ox, self.oy), sil)
            return
        rgb = rgba[..., :3]
        size = (pw, ph)
        hh = self.hh / r
        if shade:
            f = max(4, int(self.hh * 0.4 / 10))
            Lv = np.array([self.light_side * 0.5, -0.5, 0.72], dtype=np.float32)
            Lv /= np.linalg.norm(Lv)
            small = {m: self._lowres(im, f) for m, im in self.mats.items()}
            present = [m for m in MATERIALS if small[m].max() > 0.01]
            sh_, sw_ = small[present[0]].shape if present else (2, 2)
            tot = np.zeros((sh_, sw_, 3), dtype=np.float32)
            wsum = np.zeros((sh_, sw_, 1), dtype=np.float32)
            spec_small = None
            grads = {}
            for mat in present:
                r0, r1 = _SHADE_RADIUS[mat]
                H = None
                for rad in (r0 * self.hh / f, r1 * self.hh / f):
                    hm = gauss(small[mat], max(0.6, rad)) * rad
                    H = hm if H is None else H + hm
                gy, gx = np.gradient(H / 2)
                k = _NORMAL_GAIN / (max(r0, r1) * self.hh / f * 0.5 + 1e-6)
                nx, ny = -gx * k, -gy * k
                inv = 1.0 / np.sqrt(nx * nx + ny * ny + 1.0)
                sdot = (nx * Lv[0] + ny * Lv[1] + Lv[2]) * inv
                lit = smoothstep(0.1, 0.8, sdot)
                grads[mat] = (nx, ny, lit)
                mul = np.array(_SHADOW_MUL[mat], dtype=np.float32)
                fac_low = 1 - _SHADE_STRENGTH[mat] * (1 - mul)[None, None, :] * (1 - lit[..., None])
                m = small[mat][..., None]
                tot += fac_low * m
                wsum += m
                if mat == "hair":
                    spec_small = np.clip((sdot - 0.5) / 0.4, 0, 1) ** 1.4
            fac_all = np.where(wsum > 0.02, tot / np.maximum(wsum, 1e-3), 1.0)          # materials are disjoint: blend at low res

            def cast(caster: str, receivers: list[str], dist: float, blur: float, strength: float) -> None:
                nonlocal fac_all
                if caster not in present:
                    return
                dx, dy = int(-self.light_side * dist * self.hh / f), int(dist * 0.8 * self.hh / f)
                sh = gauss(np.roll(small[caster], (dy, dx), axis=(0, 1)), max(0.6, blur * self.hh / f))
                for rec in receivers:
                    if rec not in present:
                        continue
                    w = (sh * small[rec] * (1 - small[caster]) * strength)[..., None]
                    fac_all = fac_all * (1 - w * (1 - np.array(_SHADOW_MUL[rec], dtype=np.float32)))
            cast("hair", ["skin", "neck", "cloth"], 0.05, 0.035, 0.8)
            cast("skin", ["neck", "cloth"], 0.06, 0.04, 0.95)
            rgb = rgb * np.stack([self._up(fac_all[..., c], size) for c in range(3)], axis=2)
            marks = self._brush_marks(f, small, grads, size)
            if marks is not None:
                dk, lt = marks
                bodies = [small[m] for m in ("skin", "neck", "cloth") if m in present]
                body = self._up(sum(bodies), size) if bodies else np.zeros((ph, pw), dtype=np.float32)
                rgb = rgb * (1 - (dk * body)[..., None] * np.array((0.34, 0.46, 0.44), dtype=np.float32) * (0.6 + 0.8 * self.L))
                rgb = rgb + (255 - rgb) * (lt * body)[..., None] * 0.3
            if spec_small is not None:
                sheen = np.array(self.sheen or (230, 232, 240), dtype=np.float32)
                hair_m = np.asarray(self.mats["hair"].resize(size, Image.BILINEAR), dtype=np.float32) / 255.0
                spec = self._up(spec_small, size) * hair_m
                streak = _noise(pw, ph, max(2.0, hh * 0.02), max(8.0, hh * 0.30), self.nrng) * 0.5 + 0.5
                w = (spec * (0.35 + 0.65 * streak) * 0.6)[..., None]
                rgb = rgb * (1 - w) + sheen * w
        if grain > 0:
            blotch = _noise(pw, ph, hh * 0.35, hh * 0.35, self.nrng) * (0.03 + 0.03 * self.L)       # watercolour drift
            fine = self.nrng.standard_normal((ph, pw)).astype(np.float32) * 0.012                 # paper tooth
            tex = 1 + (blotch + fine) * grain
            hm = np.asarray(self.mats["hair"].resize(size, Image.BILINEAR), dtype=np.float32) / 255.0
            if hm.max() > 0:
                tex = tex + _noise(pw, ph, max(1.5, hh * 0.012), max(10.0, hh * 0.5), self.nrng) * 0.05 * hm * grain
            rgb = rgb * tex[..., None]
        out = Image.fromarray(np.concatenate([np.clip(rgb, 0, 255), a], axis=2).astype(np.uint8), "RGBA")
        if r > 1:
            out = out.resize((self.w, self.h), Image.BILINEAR)
        self.paint = out
        self.layer.alpha_composite(self.paint, (self.ox, self.oy))
        self.layer.alpha_composite(self.lines, (self.ox, self.oy))
        sil = ImageChops.lighter(self.sil, self.lines.getchannel("A").point(lambda v: 255 if v > 40 else 0))
        self.mask.paste(255, (self.ox, self.oy), sil)
