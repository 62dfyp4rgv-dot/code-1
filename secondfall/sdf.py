"""Signed-distance-field volumes with smooth blending, ray-marched orthographically into an r3d.Buf.

Smooth unions are what make a head or a torso look sculpted instead of assembled from blobs: cheekbone melts into
cheek, brow ridge into forehead, deltoid into arm. Everything here is vectorised numpy.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from .r3d import Buf, MAT, _rotmat


def smin(a, b, k):
    if k <= 1e-6:
        return np.minimum(a, b)
    h = np.maximum(k - np.abs(a - b), 0.0) / k
    return np.minimum(a, b) - h * h * k * 0.25


def smax(a, b, k):
    return -smin(-a, -b, k)


@dataclass
class Op:
    kind: str
    p: tuple                      # primitive parameters
    k: float = 0.0                # smooth-blend radius (px)
    sub: bool = False             # carve instead of add
    color: tuple = (0.7, 0.6, 0.5)
    mat: str = "skin"
    spec: float = 0.0
    R: Optional[np.ndarray] = None
    cw: float = 6.0               # colour-blend width (px)
    group: int = 0
    prio: int = 0                 # clothing (prio 1) wins over skin (prio 0) where both are at the surface


class SDF:
    def __init__(self):
        self.ops: list[Op] = []

    # ---- primitives ---------------------------------------------------------------------------------
    def ellipsoid(self, c, r, rot=(0, 0, 0), k=0.0, sub=False, color=(0.7, 0.6, 0.5), mat="skin", spec=0.0, cw=6.0, group=0, prio=0):
        R = _rotmat(*rot)
        self.ops.append(Op("ell", (np.asarray(c, np.float32), np.asarray(r, np.float32)), k, sub, color, mat, spec, R.T.astype(np.float32), cw, group, prio))

    def sphere(self, c, r, **kw):
        self.ellipsoid(c, (r, r, r), **kw)

    def cone(self, a, b, r1, r2, k=0.0, sub=False, color=(0.7, 0.6, 0.5), mat="skin", spec=0.0, cw=6.0, group=0, prio=0):
        self.ops.append(Op("cone", (np.asarray(a, np.float32), np.asarray(b, np.float32), float(r1), float(r2)), k, sub, color, mat, spec, None, cw, group, prio))

    def box(self, c, half, rr=0.0, rot=(0, 0, 0), k=0.0, sub=False, color=(0.7, 0.6, 0.5), mat="cloth", spec=0.0, cw=4.0, group=0, prio=0):
        R = _rotmat(*rot)
        self.ops.append(Op("box", (np.asarray(c, np.float32), np.asarray(half, np.float32), float(rr)), k, sub, color, mat, spec, R.T.astype(np.float32), cw, group, prio))

    # ---- distance ---------------------------------------------------------------------------------------
    @staticmethod
    def _d(op: Op, P: np.ndarray) -> np.ndarray:
        if op.kind == "ell":
            c, r = op.p
            q = (P - c) @ op.R.T                    # local coords (R holds R^T)
            q = (P - c) @ op.R.T
            k0 = np.linalg.norm(q / r, axis=1)
            k1 = np.linalg.norm(q / (r * r), axis=1)
            return k0 * (k0 - 1.0) / np.maximum(k1, 1e-6)
        if op.kind == "cone":
            a, b, r1, r2 = op.p
            ba = b - a
            l2 = float(ba @ ba)
            rr = r1 - r2
            a2 = l2 - rr * rr
            il2 = 1.0 / l2
            pa = P - a
            y = pa @ ba
            z = y - l2
            t = pa * l2 - np.outer(y, ba)
            x2 = (t * t).sum(1)
            y2 = y * y * l2
            z2 = z * z * l2
            k = np.sign(rr) * rr * rr * x2
            d1 = np.sqrt(np.maximum(x2 + z2, 0)) * il2 - r2
            d2 = np.sqrt(np.maximum(x2 + y2, 0)) * il2 - r1
            d3 = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
            return np.where(np.sign(z) * a2 * z2 > k, d1, np.where(np.sign(y) * a2 * y2 < k, d2, d3))
        if op.kind == "box":
            c, half, rr = op.p
            q = np.abs((P - c) @ op.R.T) - half + rr
            return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(np.max(q, axis=1), 0) - rr
        raise ValueError(op.kind)

    def dist(self, P: np.ndarray) -> np.ndarray:
        d = np.full(len(P), 1e6, np.float32)
        for op in self.ops:
            di = self._d(op, P)
            d = smax(d, -di, op.k) if op.sub else smin(d, di, op.k)
        return d

    def color_at(self, P: np.ndarray):
        """Soft nearest-primitive colour / material / spec (union ops only)."""
        wsum = np.zeros(len(P), np.float32)
        col = np.zeros((len(P), 3), np.float32)
        spec = np.zeros(len(P), np.float32)
        best = np.full(len(P), 1e9, np.float32)
        mat = np.zeros(len(P), np.int8)
        grp = np.zeros(len(P), np.int16)
        for op in self.ops:
            if op.sub:
                continue
            di = self._d(op, P)
            w = np.exp(-np.maximum(di, 0) / max(op.cw, 0.5)) * (60.0 ** op.prio)
            wsum += w
            col += w[:, None] * np.asarray(op.color, np.float32)
            spec += w * op.spec
            m = di < best
            best = np.where(m, di, best)
            mat = np.where(m, MAT[op.mat], mat)
            grp = np.where(m, op.group, grp)
        return col / np.maximum(wsum, 1e-6)[:, None], mat, spec / np.maximum(wsum, 1e-6), grp

    def normal(self, P: np.ndarray, e: float = 1.2) -> np.ndarray:
        dx = self.dist(P + np.array([e, 0, 0], np.float32)) - self.dist(P - np.array([e, 0, 0], np.float32))
        dy = self.dist(P + np.array([0, e, 0], np.float32)) - self.dist(P - np.array([0, e, 0], np.float32))
        dz = self.dist(P + np.array([0, 0, e], np.float32)) - self.dist(P - np.array([0, 0, e], np.float32))
        n = np.stack([dx, dy, dz], 1)
        return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)

    # ---- ray-march into a g-buffer ------------------------------------------------------------------------
    def march(self, buf: Buf, bbox, z_range, part: Optional[int] = None, step: float = 0.85, maxit: int = 70, eps: float = 0.6,
              res: float = 1.0, tex=None) -> None:
        """Orthographic rays along -z through the pixel box bbox=(x0,y0,x1,y1), starting at z_range[1] and ending at z_range[0].
        `res` < 1 renders at reduced resolution and nearest-upsamples into the buffer (faster; buffers are smoothed anyway)."""
        x0, y0, x1, y1 = (int(max(0, bbox[0])), int(max(0, bbox[1])), int(min(buf.W, bbox[2])), int(min(buf.H, bbox[3])))
        if x1 <= x0 or y1 <= y0:
            return
        zn, zf = z_range
        sx = max(1, int(round(1 / res)))
        xs = np.arange(x0, x1, sx, dtype=np.float32) + 0.5 * sx
        ys = np.arange(y0, y1, sx, dtype=np.float32) + 0.5 * sx
        X, Y = np.meshgrid(xs, ys)
        gh, gw = X.shape
        n = gh * gw
        ox, oy = X.ravel(), Y.ravel()
        t = np.zeros(n, np.float32)                    # distance travelled down from zf
        alive = np.arange(n)
        hit = np.zeros(n, bool)
        for _ in range(maxit):
            if len(alive) == 0:
                break
            P = np.stack([ox[alive], oy[alive], zf - t[alive]], 1)
            d = self.dist(P)
            h = d < eps
            hit[alive[h]] = True
            t[alive] += np.maximum(d, 0.35) * step
            alive = alive[(~h) & (t[alive] < (zf - zn))]
        idx = np.nonzero(hit)[0]
        if len(idx) == 0:
            return
        P = np.stack([ox[idx], oy[idx], zf - t[idx]], 1)
        nrm = self.normal(P)
        nrm[:, 2] = np.maximum(nrm[:, 2], 0.0) * 0.999 + 0.001                 # (orthographic: surfaces face the viewer)
        col, mat, spec, grp = self.color_at(P)
        if tex is not None:
            col = tex(P, col, grp)
        # scatter to the buffer (replicate each sample over its sx x sx block)
        gy, gx = np.divmod(idx, gw)
        zz = P[:, 2]
        for oyy in range(sx):
            for oxx in range(sx):
                px = x0 + gx * sx + oxx
                py = y0 + gy * sx + oyy
                ok = (px < buf.W) & (py < buf.H) & (zz > buf.z[np.minimum(py, buf.H - 1), np.minimum(px, buf.W - 1)])
                buf.z[py[ok], px[ok]] = zz[ok]
                buf.n[py[ok], px[ok]] = nrm[ok]
                buf.alb[py[ok], px[ok]] = col[ok]
                buf.mat[py[ok], px[ok]] = mat[ok]
                buf.spec[py[ok], px[ok]] = spec[ok]
                if part is not None:
                    buf.part[py[ok], px[ok]] = part
