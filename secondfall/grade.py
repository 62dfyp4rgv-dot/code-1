"""Colour script and film finish: the first-life scenes are sepia; the white threshold scenes are clean and bright."""
from __future__ import annotations

import numpy as np

from .paintfx import lum
from .r3d import _blur, fnoise

# gradient map stops (luminance -> colour): warm black -> brown -> amber -> cream
SEPIA = [(0.0, (0.020, 0.012, 0.010)), (0.18, (0.085, 0.052, 0.036)), (0.40, (0.30, 0.19, 0.12)), (0.65, (0.62, 0.43, 0.26)),
         (0.85, (0.86, 0.70, 0.48)), (1.0, (0.98, 0.93, 0.80))]


def gradient_map(l: np.ndarray, stops=SEPIA) -> np.ndarray:
    xs = np.array([s[0] for s in stops], np.float32)
    out = np.zeros(l.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = np.interp(l, xs, np.array([s[1][c] for s in stops], np.float32))
    return out


def sepia(rgb: np.ndarray, keep: float = 0.22, contrast: float = 1.12, gamma: float = 0.95, exposure: float = 1.0) -> np.ndarray:
    """Map luminance through the sepia ramp but keep a fraction of the original chroma (red monitors, blue screens survive)."""
    l = np.clip(lum(rgb) * exposure, 0, 1)
    l = np.clip((l - 0.5) * contrast + 0.5, 0, 1) ** gamma
    g = gradient_map(l)
    chroma = rgb - lum(rgb)[..., None]
    return np.clip(g + chroma * keep, 0, 1)


def bloom(rgb: np.ndarray, thresh: float = 0.72, strength: float = 0.35, radius: float = 14.0) -> np.ndarray:
    l = lum(rgb)
    hi = np.clip((l - thresh) / (1 - thresh), 0, 1)[..., None] * rgb
    return np.clip(rgb + _blur(hi, radius) * strength + _blur(hi, radius * 3) * strength * 0.6, 0, 1)


def film(rgb: np.ndarray, seed: int = 0, grain: float = 0.035, vig: float = 0.35) -> np.ndarray:
    H, W = rgb.shape[:2]
    rng = np.random.default_rng(seed)
    g = rng.standard_normal((H, W)).astype(np.float32)
    g = 0.7 * g + 0.3 * _blur(g, 1.1) * 2
    out = rgb * (1 + grain * g[..., None])
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((X - W / 2) / (W * 0.65)) ** 2 + ((Y - H / 2) / (H * 0.65)) ** 2)
    out = out * (1 - np.clip(d, 0, 1.3) ** 2.3 * vig)[..., None]
    return np.clip(out, 0, 1)


def finish_sepia(rgb: np.ndarray, seed: int = 0, keep: float = 0.22, bloom_strength: float = 0.3, vig: float = 0.3, grain: float = 0.035,
                 contrast: float = 1.08, exposure: float = 1.3, gamma: float = 0.9) -> np.ndarray:
    out = sepia(rgb * 1.0, keep, contrast, gamma, exposure)
    out = bloom(out, 0.7, bloom_strength)
    return film(out, seed, grain, vig)


def finish_white(rgb: np.ndarray, seed: int = 0, grain: float = 0.02) -> np.ndarray:
    out = bloom(rgb, 0.8, 0.25, 18)
    return film(out, seed, grain, 0.06)
