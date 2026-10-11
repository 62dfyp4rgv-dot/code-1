"""A tiny pseudo-3D painter: analytic ellipsoid / swept-limb impostors rendered orthographically into a
z-buffer with normals and albedo, then shaded (ramped light, ambient occlusion, screen-space cast shadows),
outlined with scratchy ink lines and given a painterly finish.

Why: flat polygon figures look like clip-art. Rendering real volumes gives believable form shading from any
angle for free, and the ink / paint passes then turn it into something that looks drawn.

Conventions: x right, y down, z toward the viewer (bigger z = closer). Units are pixels.
"""
from __future__ import annotations

import math
from typing import Callable, Optional

import numpy as np

# ----------------------------------------------------------------------------------------------- noise
def _blur(a: np.ndarray, s: float) -> np.ndarray:
    """Separable gaussian blur of a 2-D (or HxWxC) float array."""
    if s < 0.3:
        return a
    r = max(1, int(s * 3))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / s) ** 2).astype(np.float32)
    k /= k.sum()
    out = a.astype(np.float32)
    for axis in (0, 1):
        pad = [(0, 0)] * out.ndim
        pad[axis] = (r, r)
        p = np.pad(out, pad, mode="edge")
        n = out.shape[axis]
        acc = np.zeros_like(out)
        for i, kv in enumerate(k):
            sl = [slice(None)] * out.ndim
            sl[axis] = slice(i, i + n)
            acc += kv * p[tuple(sl)]
        out = acc
    return out


def fnoise(h: int, w: int, sx: float, sy: Optional[float] = None, seed: int = 0) -> np.ndarray:
    """Smooth value noise in [-1, 1] with feature sizes sx, sy (anisotropic => brush streaks)."""
    sy = sy or sx
    rng = np.random.default_rng(seed)
    gh, gw = max(2, int(h / sy) + 3), max(2, int(w / sx) + 3)
    small = rng.standard_normal((gh, gw)).astype(np.float32)
    ys = np.linspace(0, gh - 1.001, h)
    xs = np.linspace(0, gw - 1.001, w)
    y0, x0 = ys.astype(int), xs.astype(int)
    fy, fx = (ys - y0)[:, None], (xs - x0)[None, :]
    fy, fx = fy * fy * (3 - 2 * fy), fx * fx * (3 - 2 * fx)
    a = small[y0][:, x0] * (1 - fx) + small[y0][:, x0 + 1] * fx
    b = small[y0 + 1][:, x0] * (1 - fx) + small[y0 + 1][:, x0 + 1] * fx
    out = a * (1 - fy) + b * fy
    return out / (np.abs(out).max() + 1e-6)


# ----------------------------------------------------------------------------------------------- buffers
MAT = dict(none=0, skin=1, hair=2, cloth=3, tape=4, wood=5, metal=6, paper=7, rubber=8, glass=9)


class Buf:
    """Orthographic g-buffer. `alpha` is 1 where a primitive covers the pixel."""

    def __init__(self, W: int, H: int):
        self.W, self.H = W, H
        self.z = np.full((H, W), -1e9, np.float32)
        self.n = np.zeros((H, W, 3), np.float32)
        self.alb = np.zeros((H, W, 3), np.float32)
        self.mat = np.zeros((H, W), np.int8)
        self.spec = np.zeros((H, W), np.float32)
        self.part = np.zeros((H, W), np.int16)       # id of the primitive group (for lines between overlapping parts)
        self._part_counter = 0

    @property
    def alpha(self) -> np.ndarray:
        return (self.z > -1e8).astype(np.float32)

    def new_part(self) -> int:
        self._part_counter += 1
        return self._part_counter

    # ---- ellipsoid impostor ------------------------------------------------------------------------
    def ellipsoid(self, c, r, color, mat="skin", rot=(0.0, 0.0, 0.0), spec=0.0, tex: Optional[Callable] = None, part: Optional[int] = None,
                  clip: Optional[Callable] = None) -> None:
        """c=(x,y,z) centre; r=(rx,ry,rz) radii; rot=(rx,ry,rz) Euler angles in radians (applied z, y, x)."""
        cx, cy, cz = c
        rx, ry, rz = r
        R = _rotmat(*rot)
        Mx = R @ np.diag([rx * rx, ry * ry, rz * rz]) @ R.T          # covariance
        A = np.linalg.inv(Mx)
        ex, ey = math.sqrt(Mx[0, 0]), math.sqrt(Mx[1, 1])
        x0, x1 = max(0, int(cx - ex) - 1), min(self.W, int(cx + ex) + 2)
        y0, y1 = max(0, int(cy - ey) - 1), min(self.H, int(cy + ey) + 2)
        if x1 <= x0 or y1 <= y0:
            return
        X, Y = np.meshgrid(np.arange(x0, x1, dtype=np.float32) + 0.5, np.arange(y0, y1, dtype=np.float32) + 0.5)
        dx, dy = X - cx, Y - cy
        a = A[2, 2]
        b = A[2, 0] * dx + A[2, 1] * dy
        c0 = A[0, 0] * dx * dx + 2 * A[0, 1] * dx * dy + A[1, 1] * dy * dy - 1
        disc = b * b - a * c0
        hit = disc > 0
        if not hit.any():
            return
        dz = (-b + np.sqrt(np.maximum(disc, 0))) / a
        z = cz + dz
        sub = self.z[y0:y1, x0:x1]
        ok = hit & (z > sub)
        if clip is not None:
            ok &= clip(X, Y, z)
        if not ok.any():
            return
        nx = A[0, 0] * dx + A[0, 1] * dy + A[0, 2] * dz
        ny = A[1, 0] * dx + A[1, 1] * dy + A[1, 2] * dz
        nz = A[2, 0] * dx + A[2, 1] * dy + A[2, 2] * dz
        inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz + 1e-12)
        sub[ok] = z[ok]
        self.n[y0:y1, x0:x1][ok] = np.stack([nx * inv, ny * inv, nz * inv], -1)[ok]
        col = np.asarray(color, np.float32)
        if tex is not None:
            P = np.stack([X, Y, z], -1)[ok]
            self.alb[y0:y1, x0:x1][ok] = np.clip(tex(P), 0, 1)
        else:
            self.alb[y0:y1, x0:x1][ok] = col
        self.mat[y0:y1, x0:x1][ok] = MAT[mat]
        self.spec[y0:y1, x0:x1][ok] = spec
        if part is not None:
            self.part[y0:y1, x0:x1][ok] = part

    def sphere(self, c, r, color, **kw) -> None:
        self.ellipsoid(c, (r, r, r), color, **kw)

    # ---- swept limb -----------------------------------------------------------------------------
    def limb(self, p0, p1, r0, r1, color, mat="skin", flat=1.0, spec=0.0, tex: Optional[Callable] = None, part: Optional[int] = None,
             bulge: float = 0.0, bulge_at: float = 0.5) -> None:
        """Round cone from p0 to p1 (radii r0 -> r1), rendered as a dense sweep of ellipsoids.
        `flat` squashes the depth radius (arms are flatter than they are wide); `bulge` adds a muscle belly."""
        p0, p1 = np.asarray(p0, np.float32), np.asarray(p1, np.float32)
        L = float(np.linalg.norm(p1 - p0))
        n = max(4, int(L / (0.22 * max(2.0, min(r0, r1)))))
        n = min(n, 120)
        for i in range(n + 1):
            t = i / n
            p = p0 + (p1 - p0) * t
            r = r0 + (r1 - r0) * t
            r *= 1 + bulge * math.exp(-((t - bulge_at) / 0.28) ** 2)
            self.ellipsoid(tuple(p), (r, r, r * flat), color, mat, spec=spec, tex=tex, part=part)

    def path(self, pts, radii, color, mat="skin", flat=1.0, spec=0.0, tex=None, part=None) -> None:
        for (a, b), (ra, rb) in zip(zip(pts[:-1], pts[1:]), zip(radii[:-1], radii[1:])):
            self.limb(a, b, ra, rb, color, mat, flat, spec, tex, part)

    # ---- flat shapes (props, screens, cloth) ---------------------------------------------------------
    def polygon(self, pts, z, color, mat="cloth", normal=(0.0, 0.0, 1.0), tex: Optional[Callable] = None, spec=0.0, part=None) -> None:
        from PIL import Image, ImageDraw
        m = Image.new("L", (self.W, self.H), 0)
        ImageDraw.Draw(m).polygon([tuple(map(float, p)) for p in pts], fill=255)
        mk = np.asarray(m) > 127
        ok = mk & (self.z < z)
        if not ok.any():
            return
        self.z[ok] = z
        self.n[ok] = np.asarray(normal, np.float32)
        if tex is not None:
            ys, xs = np.nonzero(ok)
            P = np.stack([xs + 0.5, ys + 0.5, np.full(len(xs), z)], -1).astype(np.float32)
            self.alb[ys, xs] = np.clip(tex(P), 0, 1)
        else:
            self.alb[ok] = np.asarray(color, np.float32)
        self.mat[ok] = MAT[mat]
        self.spec[ok] = spec
        if part is not None:
            self.part[ok] = part


def _rotmat(ax: float, ay: float, az: float) -> np.ndarray:
    cx, sx, cy, sy, cz, sz = math.cos(ax), math.sin(ax), math.cos(ay), math.sin(ay), math.cos(az), math.sin(az)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Rz @ Ry @ Rx


def rotate_pts(pts, yaw=0.0, pitch=0.0, roll=0.0, about=(0, 0, 0)):
    """Rotate 3D points about a centre (yaw about y, pitch about x, roll about z)."""
    R = _rotmat(pitch, yaw, roll)
    c = np.asarray(about, float)
    return [tuple(R @ (np.asarray(p, float) - c) + c) for p in pts]


# ----------------------------------------------------------------------------------------------- shading
def _shift(a: np.ndarray, dx: int, dy: int, fill: float) -> np.ndarray:
    H, W = a.shape[:2]
    out = np.full_like(a, fill)
    xs0, xs1 = max(0, dx), min(W, W + dx)
    ys0, ys1 = max(0, dy), min(H, H + dy)
    out[ys0:ys1, xs0:xs1] = a[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
    return out


def shadow_map(b: Buf, L, reach: float, steps: int = 20, bias: float = 2.0) -> np.ndarray:
    """Screen-space cast shadows: march from every pixel toward the light; if something is in front, the pixel is shadowed."""
    L = np.asarray(L, np.float32)
    L = L / np.linalg.norm(L)
    sh = np.zeros((b.H, b.W), np.float32)
    zc = b.z
    for i in range(1, steps + 1):
        t = reach * i / steps
        dx, dy = int(round(L[0] * t)), int(round(L[1] * t))
        zs = _shift(zc, -dx, -dy, -1e9)                  # depth of what lies toward the light
        occl = zs > zc + L[2] * t + bias + 0.02 * t
        sh = np.maximum(sh, occl.astype(np.float32))
    return sh * (b.z > -1e8)


def ambient_occlusion(b: Buf, radius: float, strength: float) -> np.ndarray:
    z = np.where(b.z > -1e8, b.z, np.nan)
    zf = np.where(np.isnan(z), np.nanmin(z) if np.isfinite(z).any() else 0, z).astype(np.float32)
    zb = _blur(zf, radius)
    ao = np.clip((zb - zf) / (radius * 1.4), 0, 1)
    return np.clip(1 - strength * ao, 0, 1)


def smooth_normals(b: Buf, s: float = 1.2) -> None:
    """Depth-aware blur of the normals so sweeps of spheres read as one smooth surface."""
    m = (b.z > -1e8).astype(np.float32)
    n = b.n * m[..., None]
    nb = _blur(n, s)
    mb = _blur(m, s)[..., None]
    nn = nb / np.maximum(mb, 1e-3)
    ln = np.linalg.norm(nn, axis=-1, keepdims=True)
    nn = nn / np.maximum(ln, 1e-6)
    b.n = np.where(m[..., None] > 0, nn, b.n).astype(np.float32)


def ramp(x: np.ndarray, soft: float = 0.18, levels=(0.0, 0.42, 0.78, 1.0)) -> np.ndarray:
    """Painterly light ramp: a few soft steps instead of a smooth gradient."""
    x = np.clip(x, 0, 1)
    out = np.zeros_like(x)
    k = len(levels) - 1
    for i in range(k):
        e = (i + 1) / k
        w = np.clip((x - (e - 0.5 / k) * 0.0 - (i + 0.5) / k) / soft * 0.5 + 0.5, 0, 1) if False else None
    # piecewise: smoothstep between plateau levels
    edges = np.linspace(0, 1, k + 1)
    out = np.full_like(x, levels[0])
    for i in range(1, k + 1):
        mid = (edges[i - 1] + edges[i]) / 2
        w = np.clip((x - mid) / soft + 0.5, 0, 1)
        w = w * w * (3 - 2 * w)
        out = out + (levels[i] - levels[i - 1]) * w
    return out
