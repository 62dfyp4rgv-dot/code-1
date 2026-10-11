"""2-D painting toolkit for backgrounds and props: textured surfaces, light, atmosphere, crowds, signs."""
from __future__ import annotations

import math
from typing import Optional, Sequence

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from .r3d import _blur, fnoise

RGB = tuple


def _font(size: int, bold: bool = True):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
              "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(p, int(size))
        except Exception:
            continue
    return ImageFont.load_default()


class Canvas:
    """A float RGB canvas with painterly helpers. All coordinates are in canvas pixels."""

    def __init__(self, W: int, H: int, seed: int = 0, base=(0.1, 0.07, 0.05)):
        self.W, self.H = int(W), int(H)
        self.a = np.zeros((self.H, self.W, 3), np.float32) + np.asarray(base, np.float32)
        self.rng = np.random.default_rng(seed)
        self.seed = seed
        self.k = max(self.W, self.H) / 800.0                 # scale factor relative to an 800 px reference

    # ---- masks ----------------------------------------------------------------------------------------
    def mask_poly(self, pts, ss: int = 2, blur: float = 0.0) -> np.ndarray:
        im = Image.new("L", (self.W * ss, self.H * ss), 0)
        ImageDraw.Draw(im).polygon([(x * ss, y * ss) for x, y in pts], fill=255)
        im = im.resize((self.W, self.H), Image.LANCZOS)
        m = np.asarray(im, np.float32) / 255.0
        return _blur(m, blur) if blur > 0 else m

    def mask_ellipse(self, cx, cy, rx, ry, ss: int = 2, blur: float = 0.0) -> np.ndarray:
        im = Image.new("L", (self.W * ss, self.H * ss), 0)
        ImageDraw.Draw(im).ellipse(((cx - rx) * ss, (cy - ry) * ss, (cx + rx) * ss, (cy + ry) * ss), fill=255)
        m = np.asarray(im.resize((self.W, self.H), Image.LANCZOS), np.float32) / 255.0
        return _blur(m, blur) if blur > 0 else m

    def mask_rect(self, x0, y0, x1, y1, blur: float = 0.0) -> np.ndarray:
        return self.mask_poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], blur=blur)

    # ---- painting ---------------------------------------------------------------------------------------
    def fill(self, mask: np.ndarray, color, tex: float = 0.06, streak: tuple = (22, 22), alpha: float = 1.0) -> None:
        """Paint `color` through `mask` with a little brushy variation."""
        col = np.asarray(color, np.float32)
        if tex > 0:
            n = fnoise(self.H, self.W, streak[0] * self.k, streak[1] * self.k, int(self.rng.integers(1 << 30)))
            c = col[None, None, :] * (1 + tex * n[..., None])
        else:
            c = col[None, None, :]
        m = (mask * alpha)[..., None]
        self.a = self.a * (1 - m) + c * m

    def poly(self, pts, color, tex: float = 0.06, alpha: float = 1.0, blur: float = 0.0, streak=(22, 22)) -> None:
        self.fill(self.mask_poly(pts, blur=blur), color, tex, streak, alpha)

    def rect(self, x0, y0, x1, y1, color, tex: float = 0.06, alpha: float = 1.0, blur: float = 0.0, streak=(22, 22)) -> None:
        self.fill(self.mask_rect(x0, y0, x1, y1, blur), color, tex, streak, alpha)

    def ellipse(self, cx, cy, rx, ry, color, tex: float = 0.05, alpha: float = 1.0, blur: float = 0.0) -> None:
        self.fill(self.mask_ellipse(cx, cy, rx, ry, blur=blur), color, tex, (18, 18), alpha)

    def gradient(self, top, bottom, y0: float = 0, y1: Optional[float] = None, mask: Optional[np.ndarray] = None, power: float = 1.0) -> None:
        y1 = self.H if y1 is None else y1
        t = np.clip((np.arange(self.H, dtype=np.float32) - y0) / max(1.0, y1 - y0), 0, 1) ** power
        g = np.asarray(top, np.float32)[None, None, :] * (1 - t)[:, None, None] + np.asarray(bottom, np.float32)[None, None, :] * t[:, None, None]
        g = np.broadcast_to(g, (self.H, self.W, 3))
        if mask is None:
            if y0 <= 0 and y1 >= self.H:
                self.a = g.copy()
                return
            mask = np.zeros((self.H, self.W), np.float32)
            mask[int(max(0, y0)):int(min(self.H, y1)), :] = 1.0
        self.a = self.a * (1 - mask[..., None]) + g * mask[..., None]

    def radial(self, cx, cy, r, color, strength: float = 1.0, power: float = 2.0, add: bool = True, ry: Optional[float] = None) -> None:
        ry = ry or r
        Y, X = np.mgrid[0:self.H, 0:self.W].astype(np.float32)
        d = np.sqrt(((X - cx) / r) ** 2 + ((Y - cy) / ry) ** 2)
        m = np.clip(1 - d, 0, 1) ** power * strength
        col = np.asarray(color, np.float32)
        if add:
            self.a = self.a + m[..., None] * col
        else:
            self.a = self.a * (1 - m[..., None]) + col * m[..., None]

    def glow(self, cx, cy, r, color, strength: float = 1.0) -> None:
        self.radial(cx, cy, r, color, strength, 2.4, True)

    def cone_light(self, apex, direction_deg: float, spread_deg: float, length: float, color, strength: float = 0.5, soft: float = 0.6) -> None:
        """A volumetric light cone (additive), brighter near the apex."""
        Y, X = np.mgrid[0:self.H, 0:self.W].astype(np.float32)
        dx, dy = X - apex[0], Y - apex[1]
        ang = np.degrees(np.arctan2(dy, dx)) - direction_deg
        ang = (ang + 180) % 360 - 180
        r = np.hypot(dx, dy)
        edge = np.clip(1 - np.abs(ang) / spread_deg, 0, 1) ** (1 + soft)
        fall = np.clip(1 - r / length, 0, 1) ** 1.3
        m = edge * fall * strength * (0.85 + 0.15 * fnoise(self.H, self.W, 30 * self.k, 90 * self.k, self.seed + 9))
        self.a = self.a + m[..., None] * np.asarray(color, np.float32)

    def multiply(self, mask: np.ndarray, color, strength: float = 1.0) -> None:
        c = np.asarray(color, np.float32)
        self.a = self.a * (1 - mask[..., None] * strength * (1 - c))

    def vignette(self, strength: float = 0.5, power: float = 2.2) -> None:
        Y, X = np.mgrid[0:self.H, 0:self.W].astype(np.float32)
        d = np.sqrt(((X - self.W / 2) / (self.W * 0.62)) ** 2 + ((Y - self.H / 2) / (self.H * 0.62)) ** 2)
        self.a = self.a * (1 - np.clip(d, 0, 1.4) ** power * strength)[..., None]

    # ---- textures ---------------------------------------------------------------------------------------
    def bricks(self, mask: np.ndarray, base=(0.35, 0.18, 0.12), mortar=(0.16, 0.12, 0.10), bw: int = 44, bh: int = 20) -> None:
        bw, bh = int(bw * self.k), int(bh * self.k)
        Y, X = np.mgrid[0:self.H, 0:self.W]
        row = (Y // bh)
        xs = X + (row % 2) * (bw // 2)
        col_i = xs // bw
        rng = np.random.default_rng(self.seed + 3)
        jit = rng.uniform(0.82, 1.12, (self.H // bh + 3, self.W // bw + 4)).astype(np.float32)
        v = jit[row, col_i + 1]
        m_h = ((Y % bh) < max(1, int(2 * self.k))) | ((xs % bw) < max(1, int(2 * self.k)))
        base = np.asarray(base, np.float32)
        img = base[None, None, :] * v[..., None] * (1 + 0.08 * fnoise(self.H, self.W, 6 * self.k, 4 * self.k, self.seed + 4))[..., None]
        img = np.where(m_h[..., None], np.asarray(mortar, np.float32), img)
        self.a = self.a * (1 - mask[..., None]) + img * mask[..., None]

    def planks(self, mask: np.ndarray, base=(0.34, 0.22, 0.14), vertical: bool = True, w: int = 52, gap=(0.07, 0.045, 0.03)) -> None:
        w = int(w * self.k)
        Y, X = np.mgrid[0:self.H, 0:self.W]
        coord = X if vertical else Y
        idx = coord // w
        rng = np.random.default_rng(self.seed + 5)
        tone = rng.uniform(0.82, 1.1, int(coord.max() // w) + 3).astype(np.float32)[idx]
        grain = fnoise(self.H, self.W, 3 * self.k if vertical else 70 * self.k, 70 * self.k if vertical else 3 * self.k, self.seed + 6)
        img = np.asarray(base, np.float32)[None, None, :] * (tone * (1 + 0.14 * grain))[..., None]
        seam = (coord % w) < max(1, int(2.2 * self.k))
        img = np.where(seam[..., None], np.asarray(gap, np.float32), img)
        self.a = self.a * (1 - mask[..., None]) + img * mask[..., None]

    def concrete(self, mask: np.ndarray, base=(0.28, 0.24, 0.21)) -> None:
        n = fnoise(self.H, self.W, 40 * self.k, 40 * self.k, self.seed + 7) * 0.5 + fnoise(self.H, self.W, 6 * self.k, 6 * self.k, self.seed + 8) * 0.5
        img = np.asarray(base, np.float32)[None, None, :] * (1 + 0.10 * n)[..., None]
        self.a = self.a * (1 - mask[..., None]) + img * mask[..., None]

    def folds(self, mask: np.ndarray, base=(0.06, 0.05, 0.05), n: int = 14, light=(0.55, 0.42, 0.30), amp: float = 0.5) -> None:
        """Vertical curtain folds."""
        X = np.arange(self.W, dtype=np.float32)[None, :]
        ph = fnoise(1, self.W, 40 * self.k, 40 * self.k, self.seed + 11)[0] * 2.0
        f = 0.5 + 0.5 * np.sin(X / self.W * n * 2 * math.pi + ph)
        f = np.broadcast_to(f, (self.H, self.W))
        shade = 0.35 + 0.65 * f ** 2
        img = np.asarray(base, np.float32)[None, None, :] + (np.asarray(light, np.float32) * amp * shade[..., None]) * 0.5
        self.a = self.a * (1 - mask[..., None]) + img * mask[..., None]

    # ---- atmosphere ---------------------------------------------------------------------------------------
    def rain(self, n: int = 400, length: float = 70, angle_deg: float = 80, color=(0.8, 0.7, 0.55), alpha: float = 0.35, width: float = 1.4) -> None:
        im = Image.new("L", (self.W, self.H), 0)
        d = ImageDraw.Draw(im)
        rng = np.random.default_rng(self.seed + 21)
        ca, sa = math.cos(math.radians(angle_deg)), math.sin(math.radians(angle_deg))
        for _ in range(n):
            x, y = rng.uniform(-50, self.W), rng.uniform(-50, self.H)
            L = length * rng.uniform(0.5, 1.2) * self.k
            d.line((x, y, x + ca * L * -0.35, y + sa * L), fill=int(255 * rng.uniform(0.3, 1.0)), width=max(1, int(width * self.k)))
        m = np.asarray(im.filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255.0
        self.a = self.a + m[..., None] * np.asarray(color, np.float32) * alpha

    def dust(self, n: int = 200, color=(1.0, 0.85, 0.6), alpha: float = 0.5, r=(1.0, 2.6), area: Optional[tuple] = None) -> None:
        rng = np.random.default_rng(self.seed + 31)
        x0, y0, x1, y1 = area or (0, 0, self.W, self.H)
        im = Image.new("L", (self.W, self.H), 0)
        d = ImageDraw.Draw(im)
        for _ in range(n):
            x, y = rng.uniform(x0, x1), rng.uniform(y0, y1)
            rr = rng.uniform(*r) * self.k
            d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=int(255 * rng.uniform(0.3, 1)))
        m = np.asarray(im.filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255.0
        self.a = self.a + m[..., None] * np.asarray(color, np.float32) * alpha

    def haze(self, color, strength: float = 0.3, y0: float = 0.0, y1: float = 1.0, power: float = 1.2) -> None:
        t = np.clip((np.arange(self.H, dtype=np.float32) / self.H - y0) / max(1e-3, y1 - y0), 0, 1) ** power
        n = 0.85 + 0.15 * fnoise(self.H, self.W, 80 * self.k, 50 * self.k, self.seed + 41)
        self.a = self.a + (t[:, None] * strength * n)[..., None] * np.asarray(color, np.float32)

    def grain(self, amount: float = 0.04) -> None:
        g = self.rng.standard_normal((self.H, self.W)).astype(np.float32)
        self.a = self.a * (1 + amount * g[..., None])

    # ---- objects ----------------------------------------------------------------------------------------------
    def text(self, x, y, s: str, size: float, color=(0.1, 0.07, 0.05), anchor: str = "mm", bold: bool = True, angle: float = 0.0, alpha: float = 1.0) -> None:
        f = _font(size * self.k, bold)
        im = Image.new("L", (self.W, self.H), 0)
        ImageDraw.Draw(im).text((x, y), s, font=f, fill=255, anchor=anchor)
        if angle:
            im = im.rotate(angle, center=(x, y), resample=Image.BICUBIC)
        m = np.asarray(im, np.float32) / 255.0
        self.fill(m, color, 0.0, alpha=alpha)

    def line(self, pts, color, width: float = 2.0, alpha: float = 1.0) -> None:
        im = Image.new("L", (self.W * 2, self.H * 2), 0)
        ImageDraw.Draw(im).line([(x * 2, y * 2) for x, y in pts], fill=255, width=max(1, int(width * self.k * 2)), joint="curve")
        m = np.asarray(im.resize((self.W, self.H), Image.LANCZOS), np.float32) / 255.0
        self.fill(m, color, 0.0, alpha=alpha)

    def rim(self, mask: np.ndarray, color, width: float = 3.0, from_dir=(-1, -1), strength: float = 0.8) -> None:
        """Light edge on the side of a mask facing `from_dir`."""
        sh = np.roll(np.roll(mask, int(from_dir[1] * -width * self.k), 0), int(from_dir[0] * -width * self.k), 1)
        edge = np.clip(mask - sh, 0, 1)
        self.a = self.a + edge[..., None] * np.asarray(color, np.float32) * strength

    def shadow_of(self, mask: np.ndarray, dx: float, dy: float, blur: float, strength: float = 0.5, color=(0.5, 0.45, 0.5)) -> None:
        m = np.roll(np.roll(_blur(mask, blur * self.k), int(dy * self.k), 0), int(dx * self.k), 1)
        self.a = self.a * (1 - (m * (1 - mask) * strength)[..., None] * (1 - np.asarray(color, np.float32)))

    # ---- crowds -----------------------------------------------------------------------------------------------------
    def crowd(self, y0: float, y1: float, rows: int, size: float, tone=(0.20, 0.14, 0.10), seed: int = 0, light=(0.9, 0.65, 0.4), arms: float = 0.2,
              phones: float = 0.0, density: float = 1.0, x0: float = 0, x1: Optional[float] = None, back_light: float = 0.6) -> None:
        """Rows of spectators as backlit head+shoulder silhouettes with rim light; nearer rows are larger and darker."""
        x1 = self.W if x1 is None else x1
        rng = np.random.default_rng(seed + self.seed)
        for r in range(rows):
            t = r / max(1, rows - 1)
            y = y0 + (y1 - y0) * t
            s = size * (0.55 + 0.9 * t) * self.k
            n = int((x1 - x0) / (s * 1.35) * density) + 2
            dark = 0.55 + 0.45 * t
            for i in range(n):
                x = x0 + (i + rng.uniform(-0.3, 0.3)) * (x1 - x0) / max(1, n - 1)
                hy = y + rng.uniform(-0.15, 0.15) * s
                col = np.asarray(tone, np.float32) * rng.uniform(0.6, 1.2) * (1 - 0.35 * dark)
                head = self.mask_ellipse(x, hy, s * 0.30, s * 0.37, blur=0.5)
                body = self.mask_poly([(x - s * 0.72, hy + s * 1.6), (x - s * 0.62, hy + s * 0.55), (x - s * 0.30, hy + s * 0.34), (x + s * 0.30, hy + s * 0.34),
                                       (x + s * 0.62, hy + s * 0.55), (x + s * 0.72, hy + s * 1.6)], blur=0.5)
                self.fill(body, col * 0.8, 0.03)
                self.fill(head, col, 0.03)
                self.rim(head, light, 2.2, strength=back_light * (1.1 - 0.5 * t))
                if rng.random() < arms:                                            # a raised arm
                    sx = x + rng.choice((-1, 1)) * s * 0.6
                    ex = sx + rng.uniform(-0.3, 0.3) * s
                    ey = hy - s * rng.uniform(0.9, 1.5)
                    self.line([(sx, hy + s * 0.5), (ex, ey)], col, s * 0.2)
                if rng.random() < phones:                                          # a phone screen glow
                    px, py = x + rng.uniform(-0.4, 0.4) * s, hy - s * rng.uniform(0.2, 0.7)
                    self.rect(px - s * 0.07, py - s * 0.11, px + s * 0.07, py + s * 0.11, (0.65, 0.78, 0.9), 0.0)
                    self.glow(px, py, s * 0.7, (0.3, 0.4, 0.5), 0.35)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
