"""Shading + ink + painterly finish for an r3d.Buf, and 2-D painting helpers (strokes, grain, light effects)."""
from __future__ import annotations

import math
from typing import Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .r3d import Buf, _blur, fnoise, ambient_occlusion, shadow_map, smooth_normals, MAT

Vec = tuple[float, float, float]


# ----------------------------------------------------------------------------------------------- tone
def lum(rgb: np.ndarray) -> np.ndarray:
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def shade_buf(b: Buf, light: Vec = (-0.55, -0.6, 0.6), ambient: float = 0.30, shadow_tint=(0.52, 0.42, 0.46), rim: float = 0.0,
              rim_color=(1.0, 0.85, 0.6), cast: bool = True, reach: float = 60.0, ao_radius: float = 14.0, ao_strength: float = 0.65,
              seed: int = 0, key_color=(1.0, 0.93, 0.82), steps: tuple = (0.0, 0.5, 0.8, 1.0), soft: float = 0.14) -> np.ndarray:
    """Return an RGB float image (H,W,3) of the lit g-buffer. Background pixels are left black (use b.alpha)."""
    L = np.asarray(light, np.float32)
    L /= np.linalg.norm(L)
    smooth_normals(b, 1.4)
    lam = np.clip((b.n * L).sum(-1), 0, 1)
    if cast:
        sh = shadow_map(b, L, reach)
        sh = _blur(sh, 1.2)
        lam = lam * (1 - 0.85 * sh)
    ao = ambient_occlusion(b, ao_radius, ao_strength)
    # painterly ramp: a few soft tonal steps
    lv = np.asarray(steps, np.float32)
    k = len(lv) - 1
    edges = np.linspace(0, 1, k + 1)
    t = np.full_like(lam, lv[0])
    for i in range(1, k + 1):
        mid = (edges[i - 1] + edges[i]) / 2
        w = np.clip((lam - mid) / soft + 0.5, 0, 1)
        w = w * w * (3 - 2 * w)
        t = t + (lv[i] - lv[i - 1]) * w
    t = 0.65 * t + 0.35 * lam                                 # keep some smooth gradient under the steps
    t = ambient + (1 - ambient) * t
    t = t * ao
    st = np.asarray(shadow_tint, np.float32)
    kc = np.asarray(key_color, np.float32)
    alb = b.alb
    lit = alb * kc
    dark = alb * st
    w = np.clip(t, 0, 1)[..., None]
    img = dark + (lit - dark) * w
    # specular glints (sweat / hair sheen / wet eyes): spec stored per pixel
    if b.spec.max() > 0:
        V = np.array([0, 0, 1], np.float32)
        Hh = L + V
        Hh /= np.linalg.norm(Hh)
        sp = np.clip((b.n * Hh).sum(-1), 0, 1) ** 28 * b.spec * (1 - 0.8 * (cast and sh))
        img = img + sp[..., None] * np.array([1.0, 0.95, 0.85], np.float32) * 0.9
    if rim > 0:                                                # warm rim light from behind-left: glow on silhouettes
        edge = np.clip(1 - b.n[..., 2], 0, 1) ** 1.8
        side = np.clip(-b.n[..., 0] * np.sign(L[0] or 1), 0, 1)
        img = img + (edge * side * rim)[..., None] * np.asarray(rim_color, np.float32)
    return np.clip(img, 0, 1) * (b.alpha[..., None])


# ----------------------------------------------------------------------------------------------- ink lines
def ink_lines(b: Buf, scale: float = 1.0, seed: int = 0, silhouette: float = 2.6, crease: float = 1.1, scratch: float = 0.55,
              min_gap: float = 0.0) -> np.ndarray:
    """Scratchy hand-drawn line art from the g-buffer: heavy silhouette, lighter lines where parts overlap or creases fold.
    Returns a float mask in [0,1] (1 = ink)."""
    H, W = b.H, b.W
    a = b.alpha
    ab = _blur(a, 0.8)
    # silhouette: boundary of coverage
    gx = np.abs(np.gradient(ab, axis=1))
    gy = np.abs(np.gradient(ab, axis=0))
    sil = np.clip((gx + gy) * 2.2, 0, 1)
    # occlusion edges inside the shape: depth jumps between parts + part-id changes
    z = np.where(a > 0, b.z, b.z[a > 0].min() if (a > 0).any() else 0)
    zs = _blur(z, 0.9)
    zx, zy = np.gradient(zs, axis=1), np.gradient(zs, axis=0)
    zg = np.hypot(zx, zy)
    occl = np.clip((zg - 2.2) / 6.0, 0, 1) * (a > 0)
    # crease edges: normal discontinuities
    n = b.n
    nx = np.hypot(*np.gradient(n[..., 0])) + np.hypot(*np.gradient(n[..., 1])) + np.hypot(*np.gradient(n[..., 2]))
    cre = np.clip((nx - 0.16) / 0.5, 0, 1) * (a > 0)
    part = b.part.astype(np.float32)
    pg = np.hypot(*np.gradient(part)) > 0.5
    pe = pg & (a > 0) & (zg > 0.8)
    m = np.clip(sil * silhouette + occl * 1.6 + cre * crease * 0.8 + pe * 0.6, 0, 1.4)
    # make the line a stroke: widen by blur + threshold, then break it up with noise (hand-drawn scratchiness)
    wide = _blur(m, 0.9 * scale)
    nz1 = fnoise(H, W, 9 * scale, 9 * scale, seed + 1)
    nz2 = fnoise(H, W, 3 * scale, 3 * scale, seed + 2)
    thr = 0.22 + scratch * (0.18 * nz1 + 0.10 * nz2)
    lines = np.clip((wide - thr) / 0.16, 0, 1)
    return lines.astype(np.float32)


# ----------------------------------------------------------------------------------------------- painterly finish
def paint_finish(rgb: np.ndarray, seed: int = 0, brush: float = 1.0, grain: float = 0.5, flow: Optional[np.ndarray] = None,
                 mask: Optional[np.ndarray] = None) -> np.ndarray:
    """Make a smooth render look brushed: low-frequency colour drift, streaks along the form, edge pooling and paper tooth."""
    H, W = rgb.shape[:2]
    s = max(H, W) / 800.0
    d1 = fnoise(H, W, 26 * s, 26 * s, seed)
    d2 = fnoise(H, W, 7 * s, 22 * s, seed + 1)       # vertical-ish streaks
    d3 = fnoise(H, W, 22 * s, 7 * s, seed + 2)       # horizontal-ish streaks
    streak = 0.5 * d2 + 0.5 * d3
    out = rgb * (1 + brush * (0.045 * d1 + 0.05 * streak))[..., None]
    fine = fnoise(H, W, 1.6 * s, 1.6 * s, seed + 3)
    out = out * (1 + grain * 0.04 * fine)[..., None]
    return np.clip(out, 0, 1)


def to_img(a: np.ndarray) -> Image.Image:
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))


def from_img(im: Image.Image) -> np.ndarray:
    return np.asarray(im.convert("RGB"), np.float32) / 255.0


# ----------------------------------------------------------------------------------------------- 2-D drawing on float canvases
class Ink:
    """Hand-drawn strokes (pressure-tapered, wobbling) on an RGBA PIL layer at a given supersample."""

    def __init__(self, W: int, H: int, seed: int = 0, color=(18, 14, 16)):
        self.W, self.H = W, H
        self.im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.rng = np.random.default_rng(seed)
        self.color = color

    def stroke(self, pts, width: float, color=None, alpha: float = 1.0, taper: tuple = (0.25, 0.25), wobble: float = 0.0, mid: float = 1.0) -> None:
        P = np.asarray(pts, np.float64)
        if len(P) < 2:
            return
        seg = np.hypot(*np.diff(P, axis=0).T)
        tot = float(seg.sum())
        if tot < 1.0:
            return
        n = max(4, int(tot / max(1.0, width * 0.6)))
        s_old = np.concatenate([[0], np.cumsum(seg)])
        s_new = np.linspace(0, tot, n)
        Q = np.stack([np.interp(s_new, s_old, P[:, 0]), np.interp(s_new, s_old, P[:, 1])], 1)
        T = np.gradient(Q, axis=0)
        T /= (np.hypot(T[:, 0], T[:, 1])[:, None] + 1e-9)
        N = np.stack([-T[:, 1], T[:, 0]], 1)
        u = s_new / tot
        if wobble > 0:
            ph = self.rng.uniform(0, 6.28, 2)
            Q = Q + N * (np.sin(u * tot / (width * 14) * 6.28 + ph[0]) * 0.6 + np.sin(u * tot / (width * 5) * 6.28 + ph[1]) * 0.4)[:, None] * wobble * width
        w = width * (taper[0] + (1 - taper[0]) * np.clip(u / 0.35, 0, 1)) * (taper[1] + (1 - taper[1]) * np.clip((1 - u) / 0.35, 0, 1))
        w = w * (1 + (mid - 1) * np.sin(np.pi * u))
        w = np.maximum(0.5, w)
        left, right = Q + N * (w / 2)[:, None], Q - N * (w / 2)[:, None]
        poly = [tuple(p) for p in left] + [tuple(p) for p in right[::-1]]
        col = tuple(int(c) for c in (color or self.color)) + (int(255 * alpha),)
        if alpha >= 0.98:
            ImageDraw.Draw(self.im).polygon(poly, fill=col)
        else:
            x0, y0 = max(0, int(min(p[0] for p in poly)) - 2), max(0, int(min(p[1] for p in poly)) - 2)
            x1, y1 = min(self.W, int(max(p[0] for p in poly)) + 3), min(self.H, int(max(p[1] for p in poly)) + 3)
            if x1 <= x0 or y1 <= y0:
                return
            tile = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
            ImageDraw.Draw(tile).polygon([(a - x0, b - y0) for a, b in poly], fill=col)
            self.im.alpha_composite(tile, (x0, y0))

    def blob(self, poly, color=None, alpha: float = 1.0) -> None:
        col = tuple(int(c) for c in (color or self.color)) + (int(255 * alpha),)
        if alpha >= 0.98:
            ImageDraw.Draw(self.im).polygon([tuple(p) for p in poly], fill=col)
        else:
            tile = Image.new("RGBA", self.im.size, (0, 0, 0, 0))
            ImageDraw.Draw(tile).polygon([tuple(p) for p in poly], fill=col)
            self.im.alpha_composite(tile)

    def composite_onto(self, rgb: np.ndarray) -> np.ndarray:
        a = np.asarray(self.im, np.float32) / 255.0
        return rgb * (1 - a[..., 3:4]) + a[..., :3] * a[..., 3:4]


def bez(p0, p1, p2, p3, n: int = 18):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = (np.asarray(p, float) for p in (p0, p1, p2, p3))
    return ((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3)
