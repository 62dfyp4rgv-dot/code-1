"""Small numeric / drawing helpers shared by the procedural renderer."""
from __future__ import annotations

import functools
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageFont

RGB = tuple[int, int, int]


# ------------------------------------------------------------------ colour
def clamp8(v: float) -> int:
    return int(max(0, min(255, round(v))))


def mix(a: RGB, b: RGB, t: float) -> RGB:
    return tuple(clamp8(a[i] + (b[i] - a[i]) * t) for i in range(3))  # type: ignore[return-value]


def shade(c: RGB, f: float) -> RGB:
    return tuple(clamp8(x * f) for x in c)  # type: ignore[return-value]


def tint(c: RGB, tcol: RGB, amount: float) -> RGB:
    return mix(c, tcol, amount)


def lum(c: RGB) -> float:
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255.0


# ------------------------------------------------------------------ arrays
def to_arr(img: Image.Image) -> np.ndarray:
    return np.asarray(img.convert("RGB"), dtype=np.float32)


def to_img(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def vgradient(w: int, h: int, stops: list[tuple[float, RGB]]) -> np.ndarray:
    """Vertical multi-stop gradient as float HxWx3."""
    ys = np.linspace(0.0, 1.0, h, dtype=np.float32)
    pos = [s[0] for s in stops]
    out = np.empty((h, 1, 3), dtype=np.float32)
    for ch in range(3):
        out[:, 0, ch] = np.interp(ys, pos, [s[1][ch] for s in stops])
    return np.repeat(out, w, axis=1)


def radial_mask(w: int, h: int, cx: float, cy: float, radius: float, power: float = 2.0) -> np.ndarray:
    """Smooth radial falloff 1 -> 0, computed at quarter resolution and upsampled (it is a smooth field)."""
    f = 4 if min(w, h) >= 400 else 1
    sw, sh = max(1, w // f), max(1, h // f)
    ys = (np.arange(sh, dtype=np.float32)[:, None] + 0.5) * f
    xs = (np.arange(sw, dtype=np.float32)[None, :] + 0.5) * f
    d = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2) / max(radius, 1.0)
    m = np.clip(1.0 - d, 0.0, 1.0) ** power
    if f == 1:
        return m
    img = Image.fromarray(m, "F").resize((w, h), Image.BILINEAR)
    return np.asarray(img, dtype=np.float32)


def radial_blend(arr: np.ndarray, cx: float, cy: float, radius: float, color: RGB, alpha: float, power: float = 1.6) -> None:
    """In-place blend of `color` into `arr` with a radial falloff, touching only the bounding box."""
    H, W = arr.shape[:2]
    x0, x1 = max(0, int(cx - radius)), min(W, int(cx + radius) + 1)
    y0, y1 = max(0, int(cy - radius)), min(H, int(cy + radius) + 1)
    if x1 <= x0 or y1 <= y0:
        return
    ys = np.arange(y0, y1, dtype=np.float32)[:, None]
    xs = np.arange(x0, x1, dtype=np.float32)[None, :]
    d = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2) / max(radius, 1.0)
    m = (np.clip(1.0 - d, 0.0, 1.0) ** power * alpha)[..., None]
    reg = arr[y0:y1, x0:x1]
    reg *= 1 - m
    reg += np.array(color, dtype=np.float32) * m


def grid(w: int, h: int) -> tuple[np.ndarray, np.ndarray]:
    return np.arange(w, dtype=np.float32)[None, :], np.arange(h, dtype=np.float32)[:, None]


def blur_arr(arr: np.ndarray, radius: float) -> np.ndarray:
    from PIL import ImageFilter
    if radius <= 0.3:
        return arr
    if arr.ndim == 2:
        img = Image.fromarray(np.clip(arr * 255, 0, 255).astype(np.uint8), "L")
        return np.asarray(img.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32) / 255.0
    return to_arr(to_img(arr).filter(ImageFilter.GaussianBlur(radius)))


# ------------------------------------------------------------------ geometry
def smooth_closed(points: list[tuple[float, float]], samples: int = 8) -> list[tuple[float, float]]:
    """Catmull-Rom spline through a closed loop of points."""
    n = len(points)
    out: list[tuple[float, float]] = []
    for i in range(n):
        p0, p1, p2, p3 = points[(i - 1) % n], points[i], points[(i + 1) % n], points[(i + 2) % n]
        for s in range(samples):
            t = s / samples
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2
                       + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
                       + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    return out


def smooth_open(points: list[tuple[float, float]], samples: int = 8) -> list[tuple[float, float]]:
    pts = [points[0]] + list(points) + [points[-1]]
    out: list[tuple[float, float]] = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for s in range(samples):
            t = s / samples
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2
                       + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
                       + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    out.append(points[-1])
    return out


def rotate_point(p: tuple[float, float], center: tuple[float, float], deg: float) -> tuple[float, float]:
    a = math.radians(deg)
    dx, dy = p[0] - center[0], p[1] - center[1]
    return (center[0] + dx * math.cos(a) - dy * math.sin(a), center[1] + dx * math.sin(a) + dy * math.cos(a))


# ------------------------------------------------------------------ fonts
_FONT_CANDIDATES = {
    "bold": ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
             "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
             "/usr/share/fonts/opentype/inter/Inter-Bold.otf",
             "/Library/Fonts/Arial Bold.ttf", "C:/Windows/Fonts/arialbd.ttf"],
    "regular": ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                "/usr/share/fonts/opentype/inter/Inter-Regular.otf",
                "/Library/Fonts/Arial.ttf", "C:/Windows/Fonts/arial.ttf"],
    "heavy": ["/usr/share/fonts/opentype/inter/Inter-Black.otf",
              "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"],
}


@functools.lru_cache(maxsize=64)
def get_font(kind: str, size: int) -> ImageFont.ImageFont:
    for path in _FONT_CANDIDATES.get(kind, []):
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default(size=size)
