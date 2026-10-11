"""Whole-panel post looks. Each takes the finished webtoon-base panel (H,W,3 float 0..1) and returns the same panel in another medium."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .paintfx import lum, to_img, from_img
from .r3d import _blur, fnoise
from .style import STYLE

PAPER = np.array([0.955, 0.93, 0.87], np.float32)


def _mix(a, b, t):
    return a * (1 - t) + b * t


def _sat(rgb, k):
    l = lum(rgb)[..., None]
    return np.clip(l + (rgb - l) * k, 0, 1)


def _levels(rgb: np.ndarray, lo: float = 1.0, hi: float = 99.5, gamma: float = 1.0) -> np.ndarray:
    """Stretch the panel so its darkest tone reaches black and its lightest reaches paper white (the print looks need real paper)."""
    l = lum(rgb)
    a, b = np.percentile(l, lo), np.percentile(l, hi)
    k = np.clip((l - a) / max(1e-3, b - a), 0, 1) ** gamma
    return np.clip(rgb * (k / np.maximum(l, 0.02))[..., None], 0, 1)


def _halftone(d: np.ndarray, cell: float, angle_deg: float) -> np.ndarray:
    """Ink coverage 0..1 for darkness d (0..1) printed as a rotated dot screen."""
    H, W = d.shape
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    a = np.deg2rad(angle_deg)
    u = (X * np.cos(a) + Y * np.sin(a)) / cell
    v = (-X * np.sin(a) + Y * np.cos(a)) / cell
    dist = np.hypot(u - np.round(u), v - np.round(v)) / 0.7071       # 0 at the dot centre, 1 at the cell corner
    r = np.sqrt(np.clip(d, 0, 1))                                      # dot radius grows with darkness
    return np.clip((r - dist) * (cell * 0.9) + 0.5, 0, 1)


def inkwash(rgb: np.ndarray, seed: int = 0) -> np.ndarray:
    H, W = rgb.shape[:2]
    s = W / 800
    rgb0 = rgb
    rgb = _levels(rgb, 2, 99.0, 0.9)
    l = lum(rgb)
    wash = 0.55 * _blur(l, 2.2 * s) + 0.45 * l
    t = np.clip((wash - 0.06) / 0.85, 0, 1) ** 0.85                    # deep blacks, long grey scale
    t = np.clip(t + 0.05 * fnoise(H, W, 40 * s, 40 * s, seed + 1), 0, 1)   # uneven wash density
    bleed = _blur(1 - t, 5 * s)
    t = np.clip(t - 0.16 * np.clip(bleed - (1 - t), 0, 1), 0, 1)      # ink pooled and bled beside dark masses
    fibre = 1 + 0.035 * fnoise(H, W, 1.3 * s, 1.3 * s, seed + 2) + 0.03 * fnoise(H, W, 5 * s, 0.9 * s, seed + 3)
    ink = np.array([0.055, 0.055, 0.065], np.float32)
    out = _mix(ink, PAPER * np.array([1.0, 0.985, 0.95], np.float32), t[..., None]) * fibre[..., None]
    red = np.clip((rgb0[..., 0] - (rgb0[..., 1] + rgb0[..., 2]) / 2 - 0.30) / 0.2, 0, 1) * (rgb0[..., 1] < 0.45 * rgb0[..., 0])     # keep strong reds: the seal-red accent
    red = _blur(red, 1.0)[..., None]
    out = _mix(out, np.array([0.72, 0.10, 0.09], np.float32) * (0.55 + 0.45 * t[..., None]), red * 0.9)
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((X - W / 2) / (W * 0.62)) ** 2 + ((Y - H / 2) / (H * 0.62)) ** 2)
    out = out * (1 - 0.12 * np.clip(d - 0.55, 0, 1) ** 1.6)[..., None]   # aged paper at the edges
    return np.clip(out, 0, 1)


def comic(rgb: np.ndarray, seed: int = 0) -> np.ndarray:
    H, W = rgb.shape[:2]
    s = W / 800
    c = _sat(_levels(rgb, 1, 99.8), 1.4)
    l = lum(c)
    n = 5
    band = np.floor(np.clip(l, 0, 0.999) * n) / (n - 1)
    band = _blur(band, 0.8 * s)
    k = np.clip((0.16 + 0.88 * band) / np.maximum(l, 0.08), 0.5, 1.2)
    out = np.clip(c * k[..., None], 0, 1)
    d = np.clip((0.5 - l) / 0.5, 0, 1)
    dots = _halftone(d * 0.9, 5.5 * s, 45.0)
    out = out * (1 - 0.55 * dots)[..., None] * 1.0 + np.array([0.02, 0.0, 0.06], np.float32) * (0.25 * dots)[..., None]
    lo = np.clip((l - 0.88) / 0.12, 0, 1)[..., None]
    out = _mix(out, np.array([1.0, 0.99, 0.94], np.float32), lo * 0.5)
    pap = 1 + 0.02 * fnoise(H, W, 1.2 * s, 1.2 * s, seed + 4)
    return np.clip(out * pap[..., None], 0, 1)


def watercolor(rgb: np.ndarray, seed: int = 0) -> np.ndarray:
    H, W = rgb.shape[:2]
    s = W / 800
    im = to_img(rgb).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.3 * s))
    c = _sat(_levels(from_img(im), 1, 99.5, 0.85), 1.15)
    l = lum(c)
    gx, gy = np.gradient(_blur(l, 1.4 * s), axis=1), np.gradient(_blur(l, 1.4 * s), axis=0)
    edge = np.clip(np.hypot(gx, gy) * 9, 0, 1)
    out = c * (1 - 0.22 * edge)[..., None]                               # pigment pools at the edge of every wash
    out = out * (1 + 0.10 * fnoise(H, W, 60 * s, 60 * s, seed + 1) + 0.05 * fnoise(H, W, 14 * s, 14 * s, seed + 2))[..., None]
    gran = fnoise(H, W, 1.5 * s, 1.5 * s, seed + 3)
    out = out * (1 + 0.07 * gran * (1 - l))[..., None]                   # granulation settles in the darks
    out = 1 - (1 - out) * 0.88                                           # transparent: lighter than the gouache base
    out = np.clip(out, 0, 1)
    # ragged unpainted paper border
    m = 0.045
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    dx = np.minimum(X, W - 1 - X) / W
    dy = np.minimum(Y, H - 1 - Y) / H
    dd = np.minimum(dx, dy) / m + 0.45 * fnoise(H, W, 18 * s, 18 * s, seed + 5)
    pm = np.clip((dd - 0.35) / 0.35, 0, 1)[..., None]
    paper = PAPER * (1 + 0.025 * fnoise(H, W, 1.2 * s, 1.2 * s, seed + 6))[..., None]
    return np.clip(_mix(paper, out, pm), 0, 1)


def riso(rgb: np.ndarray, seed: int = 0) -> np.ndarray:
    H, W = rgb.shape[:2]
    s = W / 800
    rng = np.random.default_rng(seed)
    rgb = _levels(rgb, 1, 99.0, 0.8)
    pink, blue = np.array([1.0, 0.30, 0.48], np.float32), np.array([0.0, 0.46, 0.78], np.float32)
    cov_p = np.clip((1 - rgb[..., 1] * 1.15) * 1.25 - 0.05, 0, 1)         # pink plate follows missing green
    cov_b = np.clip((1 - rgb[..., 0] * 1.1) * 1.25 - 0.02, 0, 1)          # blue plate follows missing red
    cov_b = np.roll(np.roll(cov_b, int(3 * s), 0), int(2 * s), 1)         # misregistration
    out = np.zeros_like(rgb) + PAPER
    for cov, ink, ang in ((cov_p, pink, 15.0), (cov_b, blue, 75.0)):
        a = np.clip(_halftone(cov * 1.1, 4.2 * s, ang) - 0.22 * rng.random((H, W)).astype(np.float32), 0, 1)
        a = a * (0.86 + 0.14 * fnoise(H, W, 3 * s, 3 * s, seed + int(ang)))
        out = out * (1 - a[..., None] * (1 - ink))                          # inks multiply on paper
    return np.clip(out, 0, 1)


def dream(rgb: np.ndarray, seed: int = 0) -> np.ndarray:
    H, W = rgb.shape[:2]
    s = W / 800
    c = _sat(rgb, 0.9)
    c = 0.16 + 0.84 * c ** 0.9
    soft = _blur(c, 2.4 * s)
    c = 0.74 * c + 0.26 * soft                                           # soft-focus
    l = lum(c)
    glow = np.clip((l - 0.88) / 0.12, 0, 1)[..., None] * c
    c = np.clip(c + _blur(glow, 12 * s) * 0.22 + _blur(glow, 36 * s) * 0.14, 0, 1)
    c = c * np.array([1.0, 0.965, 0.985], np.float32)
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((X - W / 2) / (W * 0.58)) ** 2 + ((Y - H / 2) / (H * 0.58)) ** 2)
    c = _mix(c, np.array([1.0, 0.93, 0.96], np.float32), (np.clip(d - 0.6, 0, 1) ** 1.5 * 0.55)[..., None])
    im = to_img(np.clip(c, 0, 1)).convert("RGBA")
    spark = Image.new("RGBA", im.size, (0, 0, 0, 0))
    dr = ImageDraw.Draw(spark)
    rng = np.random.default_rng(seed + 9)
    ys, xs = np.nonzero((l > np.percentile(l, 70)) & (l < 0.62))
    for i in (rng.choice(len(xs), size=min(26, len(xs)), replace=False) if len(xs) else []):
        x, y, r = float(xs[i]), float(ys[i]), rng.uniform(7, 20) * s
        for L, w_ in ((r, 2), (r * 0.55, 2)):
            ang = 0 if L == r else np.pi / 4
            for k in range(2):
                a = ang + k * np.pi / 2
                dr.line([(x - np.cos(a) * L, y - np.sin(a) * L), (x + np.cos(a) * L, y + np.sin(a) * L)], fill=(255, 244, 214, 235), width=max(1, int(w_ * s)))
        dr.ellipse((x - 2 * s, y - 2 * s, x + 2 * s, y + 2 * s), fill=(255, 255, 255, 255))
    spark = spark.filter(ImageFilter.GaussianBlur(0.7 * s))
    im.alpha_composite(spark)
    return from_img(im.convert("RGB"))


def pixel(rgb: np.ndarray, seed: int = 0) -> np.ndarray:
    H, W = rgb.shape[:2]
    f = max(3, int(round(W / 220)))
    im = to_img(_sat(rgb, 1.2))
    small = im.resize((W // f, H // f), Image.BOX)
    q = small.quantize(colors=24, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    return from_img(q.resize((W // f * f, H // f * f), Image.NEAREST).resize((W, H), Image.NEAREST))


def neon(rgb: np.ndarray, seed: int = 0) -> np.ndarray:
    from .grade import gradient_map, bloom
    H, W = rgb.shape[:2]
    s = W / 800
    stops = [(0.0, (0.015, 0.0, 0.07)), (0.35, (0.24, 0.05, 0.50)), (0.6, (0.92, 0.14, 0.60)), (0.85, (0.20, 0.90, 0.96)), (1.0, (0.96, 1.0, 1.0))]
    l = np.clip(lum(rgb), 0, 1)
    out = gradient_map(np.clip((l - 0.08) * 1.2, 0, 1) ** 1.1, stops)
    chroma = rgb - lum(rgb)[..., None]
    out = np.clip(out + chroma * 0.22, 0, 1)
    out = bloom(out, 0.55, 0.75, 10 * s)
    sh = max(1, int(2 * s))
    out[..., 0] = np.roll(out[..., 0], sh, 1)
    out[..., 2] = np.roll(out[..., 2], -sh, 1)
    ys = np.arange(H)
    out = out * np.where((ys // max(1, int(1.5 * s))) % 2 == 0, 1.0, 0.9)[:, None, None]
    return np.clip(out, 0, 1)


LOOKS = {"inkwash": inkwash, "comic": comic, "watercolor": watercolor, "riso": riso, "dream": dream, "pixel": pixel, "neon": neon}


def apply(rgb: np.ndarray, seed: int = 0) -> np.ndarray:
    fn = LOOKS.get(STYLE)
    return fn(rgb, seed) if fn else rgb
