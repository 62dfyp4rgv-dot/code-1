#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI HANDS - an autonomous multi-agent studio that draws vector art stroke by stroke.

    pip install pygame numpy
    python ai_hands.py                         # draws the default still life
    python ai_hands.py --concept mandala       # still_life | landscape | mandala
    python ai_hands.py --image photo.jpg       # trace and draw any seed image
    python ai_hands.py --headless --speed 60   # no window, runs flat out, writes PNG + JSON

HOW THE PIPELINE WORKS
======================
Four agents run cooperatively inside ONE main loop (`while not job_complete:` in Studio.run).
Each frame every agent gets a small time slice (`step`). They never call each other directly;
they only talk through a MessageBus (publish/subscribe inboxes), so the stages overlap exactly
like a decentralised system: the Hand is already drawing the skeleton while the Planner is still
tracing contours and the Kinematics agent is shaping strokes in between.

    PlannerAgent  (the Eye)    --path_batch-->   KinematicsAgent (the Muscle)
    KinematicsAgent            --trajectory-->   HandAgent       (the Hand)
    HandAgent                  --layer_done-->   CriticAgent     (the Mind)
    CriticAgent                --refine------>   PlannerAgent        (self-correction loop)
    CriticAgent sets studio.job_complete = True  -> the main loop ends -> files are saved.

  Eye      reads a concept / seed image, analyses it (Gaussian blur, Sobel, Canny non-max
           suppression + hysteresis), chains edge pixels, fits cubic Beziers with Schneider's
           least-squares algorithm, and plans four hierarchical layers:
           Gesture Skeleton -> Primary Contours -> Shading Hatches -> Fine Details.
           The first pass is deliberately economical (like a real artist); the Critic asks for more.
  Muscle   turns every Bezier path into a physical movement: curvature-limited speed
           (two-thirds power law), forward/backward acceleration clamping, a minimum-jerk blend
           for ease-in / ease-out, physiological tremor (8-12 Hz) + slow drift, and
           pressure-dependent line weight. Pen-up travel between strokes is planned too.
  Hand     replays the trajectories in real time, stamping a grainy pencil nib onto the canvas,
           drawing the visible pencil (hovering while travelling, touching down to draw). The nib
           wears: lines get fatter and softer until the Hand stops to sharpen the pencil, and it
           pauses to step back after every finished layer.
  Mind     after each layer it measures the real canvas against the master plan (tone
           correlation + edge recall). If a layer is under-done it requests a refinement
           pass; it keeps correcting only while each pass still pays off (adaptive budget) and
           ends the job when quality is reached or returns diminish.

OUTPUT: drawing_<name>.png (the pencil drawing), drawing_<name>.svg (the plan as layered vector art),
        plan_<name>.json (the Bezier path queue), run_log_<name>.json (agent messages + Critic history).
"""
from __future__ import annotations

import argparse
import json
import math
import os
import random
import sys
import time
from collections import deque
from dataclasses import dataclass
from typing import Any, Optional

import numpy as np

CANVAS = 768            # drawing surface, pixels
RES = 320               # analysis resolution of the reference image
SCALE = CANVAS / RES    # reference px -> canvas px
FS = 240.0              # trajectory sampling rate (Hz)
HUD_W = 420
WEAR_LEN = 9000.0       # px of line a pencil draws before it is blunt enough to need sharpening

# per-stroke-kind physical parameters:  vmax px/s, amax px/s^2, line width range, opacity range,
# tremor amplitude px, drift amplitude px, pencil colour
KIN = {
    "skeleton": dict(vmax=1500, amax=7000, wmin=1.0, wmax=1.9, op=(0.25, 0.50), tremor=0.50, drift=1.7, color=(104, 140, 188)),
    "contour": dict(vmax=820, amax=4300, wmin=1.0, wmax=2.7, op=(0.55, 0.95), tremor=0.35, drift=0.9, color=(34, 31, 40)),
    "hatch": dict(vmax=1900, amax=11000, wmin=0.8, wmax=1.8, op=(0.20, 0.50), tremor=0.30, drift=0.55, color=(60, 57, 68)),
    "detail": dict(vmax=430, amax=2700, wmin=1.2, wmax=3.3, op=(0.70, 1.00), tremor=0.25, drift=0.5, color=(18, 14, 21)),
}
LAYER_ORDER = ["skeleton", "contours", "shading", "details"]
LAYER_WEIGHT = {"skeleton": 0.05, "contours": 0.35, "shading": 0.45, "details": 0.15}
PALETTES = {  # multiply the kind colours: graphite (default) or warm sepia
    "graphite": (1.0, 1.0, 1.0),
    "sepia": (1.9, 1.35, 0.85),
}


# =====================================================================================
#  1. BEZIER MATH  (cubic evaluation, derivatives, flattening, Schneider curve fitting)
# =====================================================================================
def bez_pt(c: np.ndarray, t: np.ndarray) -> np.ndarray:
    """B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3   (c: 4x2, t: n)"""
    t = np.asarray(t, float)[..., None]
    u = 1 - t
    return u**3 * c[0] + 3 * u * u * t * c[1] + 3 * u * t * t * c[2] + t**3 * c[3]


def bez_d1(c: np.ndarray, t: np.ndarray) -> np.ndarray:
    """B'(t) = 3(1-t)^2 (P1-P0) + 6(1-t) t (P2-P1) + 3 t^2 (P3-P2)"""
    t = np.asarray(t, float)[..., None]
    u = 1 - t
    return 3 * u * u * (c[1] - c[0]) + 6 * u * t * (c[2] - c[1]) + 3 * t * t * (c[3] - c[2])


def bez_d2(c: np.ndarray, t: np.ndarray) -> np.ndarray:
    """B''(t) = 6(1-t)(P2-2P1+P0) + 6 t (P3-2P2+P1)"""
    t = np.asarray(t, float)[..., None]
    return 6 * (1 - t) * (c[2] - 2 * c[1] + c[0]) + 6 * t * (c[3] - 2 * c[2] + c[1])


def de_casteljau_split(c: np.ndarray, t: float) -> tuple[np.ndarray, np.ndarray]:
    """Split a cubic at t with de Casteljau's repeated linear interpolation."""
    a, b, d = c[0] + t * (c[1] - c[0]), c[1] + t * (c[2] - c[1]), c[2] + t * (c[3] - c[2])
    e, f = a + t * (b - a), b + t * (d - b)
    g = e + t * (f - e)
    return np.array([c[0], a, e, g]), np.array([g, f, d, c[3]])


def flatten(segments: list, step: float = 1.2) -> dict:
    """Densify a chain of cubic Beziers into points with arc length s, tangent and signed curvature
    kappa = (x'y'' - y'x'') / (x'^2 + y'^2)^(3/2), computed analytically from the derivatives."""
    pts, kap, tan = [], [], []
    for k, seg in enumerate(segments):
        c = np.asarray(seg, float)
        poly_len = np.hypot(*np.diff(c, axis=0).T).sum()
        n = int(np.clip(poly_len / step, 10, 600))
        t = np.linspace(0, 1, n + (1 if k == len(segments) - 1 else 0), endpoint=(k == len(segments) - 1))
        d1, d2 = bez_d1(c, t), bez_d2(c, t)
        sp = np.hypot(d1[:, 0], d1[:, 1]) + 1e-9
        kap.append((d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / sp**3)
        tan.append(d1 / sp[:, None])
        pts.append(bez_pt(c, t))
    P, K, T = np.vstack(pts), np.concatenate(kap), np.vstack(tan)
    s = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))])
    return dict(pts=P, s=s, kappa=K, tan=T)


def rdp_indices(p: np.ndarray, eps: float) -> list[int]:
    """Ramer-Douglas-Peucker simplification (iterative); returns kept vertex indices."""
    keep = np.zeros(len(p), bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(p) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        ab = p[b] - p[a]
        L = np.hypot(*ab) + 1e-12
        d = np.abs(ab[0] * (p[a + 1:b, 1] - p[a, 1]) - ab[1] * (p[a + 1:b, 0] - p[a, 0])) / L
        i = int(np.argmax(d))
        if d[i] > eps:
            m = a + 1 + i
            keep[m] = True
            stack += [(a, m), (m, b)]
    return list(np.nonzero(keep)[0])


# ---- Schneider, "An Algorithm for Automatically Fitting Digitized Curves" (Graphics Gems I) ----
def _unit(v: np.ndarray) -> np.ndarray:
    n = np.hypot(*v)
    return v / n if n > 1e-12 else v


def _chord_param(p: np.ndarray) -> np.ndarray:
    u = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(p, axis=0).T))])
    return u / u[-1] if u[-1] > 0 else np.linspace(0, 1, len(p))


def _generate_bezier(p, u, t1, t2) -> np.ndarray:
    """Least-squares solve for the two tangent magnitudes alpha_l, alpha_r (normal equations)."""
    b0, b1, b2, b3 = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u**3
    A1, A2 = t1[None, :] * b1[:, None], t2[None, :] * b2[:, None]
    C00, C01, C11 = (A1 * A1).sum(), (A1 * A2).sum(), (A2 * A2).sum()
    tmp = p - (np.outer(b0 + b1, p[0]) + np.outer(b2 + b3, p[-1]))
    X0, X1 = (A1 * tmp).sum(), (A2 * tmp).sum()
    det = C00 * C11 - C01 * C01
    seg = np.hypot(*(p[-1] - p[0]))
    al = ar = seg / 3
    if abs(det) > 1e-12:
        al, ar = (X0 * C11 - X1 * C01) / det, (C00 * X1 - C01 * X0) / det
    if al < 1e-6 * seg or ar < 1e-6 * seg:          # degenerate: fall back to Wu/Barsky heuristic
        al = ar = seg / 3
    return np.array([p[0], p[0] + t1 * al, p[-1] + t2 * ar, p[-1]])


def _max_error(p, c, u) -> tuple[float, int]:
    d = np.sum((bez_pt(c, u) - p) ** 2, axis=1)
    i = int(np.argmax(d))
    return float(d[i]), i


def _reparam(p, c, u) -> np.ndarray:
    """Newton-Raphson: u' = u - (Q(u)-P).Q'(u) / (Q'(u).Q'(u) + (Q(u)-P).Q''(u))"""
    q, d1, d2 = bez_pt(c, u), bez_d1(c, u), bez_d2(c, u)
    num = ((q - p) * d1).sum(axis=1)
    den = (d1 * d1).sum(axis=1) + ((q - p) * d2).sum(axis=1)
    return np.clip(np.where(np.abs(den) > 1e-12, u - num / np.where(den == 0, 1, den), u), 0, 1)


def _fit_cubic(p, t1, t2, err2) -> list[np.ndarray]:
    if len(p) == 2:
        d = np.hypot(*(p[1] - p[0])) / 3
        return [np.array([p[0], p[0] + t1 * d, p[1] + t2 * d, p[1]])]
    u = _chord_param(p)
    c = _generate_bezier(p, u, t1, t2)
    e, split = _max_error(p, c, u)
    if e < err2:
        return [c]
    if e < err2 * 16:                                  # close: try to improve the parameterisation
        for _ in range(12):
            u = _reparam(p, c, u)
            c = _generate_bezier(p, u, t1, t2)
            e, split = _max_error(p, c, u)
            if e < err2:
                return [c]
    split = int(np.clip(split, 1, len(p) - 2))
    tc = _unit(p[split - 1] - p[split + 1])
    return _fit_cubic(p[:split + 1], t1, tc, err2) + _fit_cubic(p[split:], -tc, t2, err2)


def fit_curve(points: np.ndarray, max_err: float) -> list[np.ndarray]:
    p = np.asarray(points, float)
    if len(p) < 2:
        return []
    k = min(3, len(p) - 1)
    return _fit_cubic(p, _unit(p[k] - p[0]), _unit(p[-1 - k] - p[-1]), max_err**2)


def chain_to_beziers(chain: np.ndarray, err: float) -> list[list]:
    """Smooth the pixel staircase, cut the chain at real corners, fit each piece with Schneider."""
    p = np.asarray(chain, float)
    if len(p) >= 5:
        q = p.copy()
        q[1:-1] = (p[:-2] + 2 * p[1:-1] + p[2:]) / 4
        p = q
    keep = rdp_indices(p, 1.6)
    cuts = [0]
    for j in range(1, len(keep) - 1):
        a, b, c = p[keep[j - 1]], p[keep[j]], p[keep[j + 1]]
        v1, v2 = b - a, c - b
        n1, n2 = np.hypot(*v1), np.hypot(*v2)
        if n1 > 4 and n2 > 4 and np.dot(v1, v2) / (n1 * n2) < 0.55:    # turn sharper than ~57 degrees
            cuts.append(keep[j])
    cuts.append(len(p) - 1)
    out: list[list] = []
    for a, b in zip(cuts[:-1], cuts[1:]):
        if b > a:
            out += [c.tolist() for c in fit_curve(p[a:b + 1], err)]
    return out


# =====================================================================================
#  2. IMAGE ANALYSIS PRIMITIVES (blur, Sobel, Canny, edge chaining)  -- numpy only
# =====================================================================================
def box_blur(a: np.ndarray, r: int) -> np.ndarray:
    if r <= 0:
        return a
    out = a
    for axis in (0, 1):
        pad = [(0, 0), (0, 0)]
        pad[axis] = (r + 1, r)
        cs = np.cumsum(np.pad(out, pad, mode="edge"), axis=axis)
        n = out.shape[axis]
        hi = np.take(cs, range(2 * r + 1, 2 * r + 1 + n), axis=axis)
        lo = np.take(cs, range(0, n), axis=axis)
        out = (hi - lo) / (2 * r + 1)
    return out


def gaussian_blur(a: np.ndarray, sigma: float) -> np.ndarray:
    """Three box passes approximate a Gaussian (Wells 1986)."""
    r = max(1, int(round((math.sqrt(12 * sigma * sigma / 3 + 1) - 1) / 2)))
    for _ in range(3):
        a = box_blur(a, r)
    return a


def sobel(a: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    p = np.pad(a, 1, mode="edge")
    gx = (p[:-2, 2:] + 2 * p[1:-1, 2:] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[1:-1, :-2] + p[2:, :-2])
    gy = (p[2:, :-2] + 2 * p[2:, 1:-1] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[:-2, 1:-1] + p[:-2, 2:])
    return gx, gy


def _shift(a: np.ndarray, dy: int, dx: int) -> np.ndarray:
    p = np.pad(a, 1, mode="constant")
    return p[1 + dy:1 + dy + a.shape[0], 1 + dx:1 + dx + a.shape[1]]


def canny(gray: np.ndarray, sigma: float, lo_q: float, hi_q: float) -> tuple[np.ndarray, np.ndarray]:
    """Gradient -> non-maximum suppression along the gradient direction -> hysteresis. Returns (edges, magnitude)."""
    g = gaussian_blur(gray, sigma)
    gx, gy = sobel(g)
    mag = np.hypot(gx, gy)
    ang = (np.degrees(np.arctan2(gy, gx)) + 180) % 180
    q = np.select([(ang < 22.5) | (ang >= 157.5), ang < 67.5, ang < 112.5], [0, 1, 2], 3)
    nbr = {0: ((0, -1), (0, 1)), 1: ((-1, -1), (1, 1)), 2: ((-1, 0), (1, 0)), 3: ((1, -1), (-1, 1))}
    nms = np.zeros_like(mag, bool)
    for k, ((ay, ax), (by, bx)) in nbr.items():
        nms |= (q == k) & (mag >= _shift(mag, ay, ax)) & (mag > _shift(mag, by, bx))
    nz = mag[mag > 1e-6]
    if nz.size == 0:
        return np.zeros_like(nms), mag
    lo, hi = np.percentile(nz, lo_q), np.percentile(nz, hi_q)
    strong, weak = nms & (mag >= hi), nms & (mag >= lo)
    for _ in range(40):                                   # hysteresis: grow strong edges through weak ones
        grown = strong.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                grown |= _shift(strong, dy, dx)
        grown &= weak
        if (grown == strong).all():
            break
        strong = grown
    return strong, mag


_DIRS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def trace_chains(edge: np.ndarray, min_len: int = 6) -> list[np.ndarray]:
    """Link 1-px edge pixels into ordered chains (start at endpoints, prefer to keep going straight)."""
    H, W = edge.shape
    ys, xs = np.nonzero(edge)
    pix = set(zip(ys.tolist(), xs.tolist()))
    deg = {p: sum((p[0] + dy, p[1] + dx) in pix for dy, dx in _DIRS) for p in pix}
    seen: set = set()
    chains = []
    order = sorted(pix, key=lambda p: (deg[p] != 1, p))      # endpoints first, then loops / junction remainders
    for start in order:
        if start in seen:
            continue
        chain, cur, last = [start], start, (0, 0)
        seen.add(start)
        while True:
            cand = [(cur[0] + dy, cur[1] + dx) for dy, dx in _DIRS if (cur[0] + dy, cur[1] + dx) in pix and (cur[0] + dy, cur[1] + dx) not in seen]
            if not cand:
                break
            nxt = max(cand, key=lambda c: (c[0] - cur[0]) * last[0] + (c[1] - cur[1]) * last[1] - 0.01 * abs(c[0] - cur[0]) * abs(c[1] - cur[1]))
            last = (nxt[0] - cur[0], nxt[1] - cur[1])
            seen.add(nxt)
            chain.append(nxt)
            cur = nxt
        if len(chain) >= min_len:
            chains.append(np.array([(x, y) for y, x in chain], float))
    return chains


# =====================================================================================
#  3. CONCEPT LIBRARY: procedural "reference photographs" the Eye can look at
#     (each returns a darkness map in [0,1]; 0 = paper white)
# =====================================================================================
def concept_still_life(res: int, rng: random.Random) -> np.ndarray:
    """Tiny analytic ray tracer: three spheres, a vase and a ground plane, one lamp, hard shadows."""
    ax = (np.arange(res) - res / 2) / (res / 2)
    X, Y = np.meshgrid(ax, -ax)
    O = np.array([0.0, 2.3, -4.6])
    D = np.stack([X * 0.50, Y * 0.50 - 0.34, np.ones_like(X)], -1)
    D /= np.linalg.norm(D, axis=-1, keepdims=True)
    spheres = [((-0.95, 0.62, 0.15), 0.62, 0.85), ((0.5, 0.40, -0.7), 0.40, 0.62), ((0.15, 0.74, 0.95), 0.74, 0.75)]
    vase = ((1.5, 0.55), 0.42, 1.5)                        # (cx, cz), radius, height
    L = np.array([-0.55, 0.85, -0.55])
    L /= np.linalg.norm(L)

    def hit_sphere(o, d, c, r):
        oc = o - np.array(c)
        b = (oc * d).sum(-1)
        disc = b * b - ((oc * oc).sum(-1) - r * r)
        t = -b - np.sqrt(np.maximum(disc, 0))
        return np.where((disc > 0) & (t > 1e-3), t, np.inf)

    def hit_vase(o, d):
        (cx, cz), r, h = vase
        ox, oz, dx, dz = o[..., 0] - cx, o[..., 2] - cz, d[..., 0], d[..., 2]
        a, b, c = dx * dx + dz * dz, ox * dx + oz * dz, ox * ox + oz * oz - r * r
        disc = b * b - a * c
        t = (-b - np.sqrt(np.maximum(disc, 0))) / np.maximum(a, 1e-9)
        y = o[..., 1] + t * d[..., 1]
        side = np.where((disc > 0) & (t > 1e-3) & (y > 0) & (y < h), t, np.inf)
        tc = (h - o[..., 1]) / np.where(np.abs(d[..., 1]) < 1e-9, 1e-9, d[..., 1])
        px, pz = o[..., 0] + tc * dx - cx, o[..., 2] + tc * dz - cz
        cap = np.where((tc > 1e-3) & (px * px + pz * pz < r * r), tc, np.inf)
        return side, cap

    def scene(o, d):
        ts = [hit_sphere(o, d, c, r) for c, r, _ in spheres]
        side, cap = hit_vase(o, d)
        tg = np.where(d[..., 1] < -1e-6, -o[..., 1] / np.where(d[..., 1] == 0, 1e-9, d[..., 1]), np.inf)
        return ts + [side, cap, tg]

    ts = scene(O[None, None, :] * np.ones_like(D), D)
    T = np.stack(ts, -1)
    k = T.argmin(-1)
    t = T.min(-1)
    P = O + D * np.where(np.isfinite(t), t, 0)[..., None]
    N = np.zeros_like(P)
    alb = np.full(t.shape, 0.9)
    for i, (c, r, a) in enumerate(spheres):
        m = k == i
        N[m] = (P[m] - np.array(c)) / r
        alb[m] = a
    m = k == 3
    N[m] = np.stack([P[m][:, 0] - vase[0][0], np.zeros(m.sum()), P[m][:, 2] - vase[0][1]], -1) / vase[1]
    alb[m] = 0.58
    N[k == 4] = [0, 1, 0]
    alb[k == 4] = 0.58
    N[k == 5] = [0, 1, 0]
    alb[k == 5] = 0.9
    sh = scene(P + N * 2e-3, np.broadcast_to(L, P.shape))
    lit = np.where(np.isfinite(np.stack(sh[:5], -1)).any(-1), 0.0, 1.0)
    lum = 0.16 + 0.84 * np.clip((N * L).sum(-1), 0, 1) * lit
    lum = np.where(np.isfinite(t), lum * alb, 1.0)
    dark = 1 - lum
    ground = (k == 5) | (k == 6)
    near = np.hypot(P[..., 0] - 0.35, P[..., 2] - 0.4)                # world distance from the group of objects
    fade = np.clip(1.25 - near / 2.8, 0, 1) ** 1.3                    # the table dissolves into paper: no horizon line
    dark = np.where(ground, dark * fade, dark)
    return np.clip(gaussian_blur(dark, 0.8), 0, 1)


def concept_landscape(res: int, rng: random.Random) -> np.ndarray:
    """Layered mountain ridges (midpoint displacement), a low sun, hazy sky and a reflecting lake."""
    H = W = res
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    dark = 0.04 + 0.12 * (1 - yy / H)                      # sky: slightly darker at the top
    sun = (W * 0.68, H * 0.30)
    d = np.hypot(xx - sun[0], yy - sun[1])
    dark = np.where(d < 22, 0.0, dark * np.clip(d / 140, 0.25, 1))
    horizon = int(H * 0.72)
    n = 1 << int(math.ceil(math.log2(W)))
    for i in range(5):                                     # far (light) -> near (dark)
        h = np.zeros(n + 1)
        h[0], h[n] = rng.uniform(-1, 1), rng.uniform(-1, 1)
        step, amp = n, 1.0
        while step > 1:
            half = step // 2
            for j in range(half, n, step):
                h[j] = (h[j - half] + h[j + half]) / 2 + rng.uniform(-1, 1) * amp
            step, amp = half, amp * 0.52
        h = h[:W]
        h = (h - h.min()) / (np.ptp(h) + 1e-9)
        ridge = horizon - (0.52 - 0.075 * i) * H * (0.35 + 0.65 * h)
        slope = np.gradient(gaussian_blur(np.tile(h, (3, 1)), 4.0)[1])
        facet = np.clip(0.5 - slope * 45, 0, 1)            # light from the left: right-facing slopes are darker
        body = (yy > ridge[None, :]) & (yy < horizon)
        below = (yy - ridge[None, :]) / (0.25 * H)
        base = 0.13 + 0.10 * i
        dark = np.where(body, base + 0.34 * facet[None, :] * np.exp(-below * 1.3) + 0.05 * np.clip(below, 0, 1.5), dark)
    lake = yy >= horizon
    refl = dark[np.clip(2 * horizon - yy.astype(int), 0, H - 1), xx.astype(int)]
    ripples = 0.06 * np.sin(yy * 0.9 + 3 * np.sin(xx * 0.05))
    dark = np.where(lake, np.clip(gaussian_blur(refl, 1.5) * 0.8 + 0.12 + ripples, 0, 1), dark)
    return np.clip(dark, 0, 1)


def concept_mandala(res: int, rng: random.Random) -> np.ndarray:
    """Nested petal rings: dark at the petal root, fading to paper at the tip, plus beaded bands."""
    ax = (np.arange(res) - res / 2) / (res / 2) * 1.02
    X, Y = np.meshgrid(ax, ax)
    r, th = np.hypot(X, Y), np.arctan2(Y, X)
    dark = np.zeros_like(r)
    for r0, r1, k in [(0.52, 0.90, 24), (0.30, 0.64, 16), (0.12, 0.40, 12), (0.0, 0.17, 8)]:
        prof = np.abs(np.cos(k * th / 2)) ** 0.7
        u = (r - r0) / (r1 - r0)
        inside = (u > 0) & (u < prof)
        outline = (u > -0.01) & (np.abs(u - prof) < 0.012) & (u < 1.02)                              # a thin drawn petal edge
        dark = np.where(inside, 0.20 + 0.60 * (1 - np.clip(u / np.maximum(prof, 1e-6), 0, 1)) ** 1.3, np.where((r > r0) & (r < r1), 0.0, dark))
        dark = np.where(outline, np.maximum(dark, 0.62), dark)
    dark = np.where((r > 0.92) & (r < 0.945), 0.75, dark)
    dark = np.where((r > 0.96) & (r < 0.99) & (np.cos(60 * th) > 0.55), 0.85, dark)
    return np.clip(gaussian_blur(dark, 0.7), 0, 1)


CONCEPTS = {"still_life": concept_still_life, "landscape": concept_landscape, "mandala": concept_mandala}


def load_seed_image(path: str, res: int) -> np.ndarray:
    import pygame
    img = pygame.image.load(path)
    w, h = img.get_size()
    k = res / max(w, h)
    img = pygame.transform.smoothscale(img, (max(1, int(w * k)), max(1, int(h * k))))
    g = pygame.surfarray.array3d(img).astype(float).mean(axis=2).T / 255.0
    lo, hi = np.percentile(g, 2), np.percentile(g, 98)
    dark = 1 - np.clip((g - lo) / max(hi - lo, 1e-6), 0, 1)
    out = np.zeros((res, res))
    oy, ox = (res - dark.shape[0]) // 2, (res - dark.shape[1]) // 2
    out[oy:oy + dark.shape[0], ox:ox + dark.shape[1]] = dark
    return out


# =====================================================================================
#  4. INFRASTRUCTURE: message bus + agent base class
# =====================================================================================
@dataclass
class Message:
    src: str
    dst: str
    topic: str
    payload: Any


class MessageBus:
    """Publish/subscribe mailboxes. Agents only ever communicate through here."""

    def __init__(self):
        self.boxes: dict[str, deque] = {}
        self.sent = 0

    def register(self, name: str) -> deque:
        self.boxes[name] = deque()
        return self.boxes[name]

    def send(self, src: str, dst: str, topic: str, payload: Any = None) -> None:
        self.boxes[dst].append(Message(src, dst, topic, payload))
        self.sent += 1


class Agent:
    name = "agent"
    color = (200, 200, 200)

    def __init__(self, studio: "Studio"):
        self.studio = studio
        self.bus = studio.bus
        self.inbox = self.bus.register(self.name)
        self.status = "idle"

    def send(self, dst: str, topic: str, payload: Any = None) -> None:
        self.bus.send(self.name, dst, topic, payload)

    def log(self, msg: str) -> None:
        self.studio.log(self.name, msg)

    def set_status(self, s: str) -> None:
        self.status = s


# =====================================================================================
#  5. THE PLANNER  (the Eye)
# =====================================================================================
class PlannerAgent(Agent):
    name = "Planner"
    color = (120, 190, 255)

    def __init__(self, studio: "Studio", concept: str, image: Optional[str], seed: int):
        super().__init__(studio)
        self.concept, self.image, self.rng = concept, image, random.Random(seed)
        self.paths: list[dict] = []                 # the whole master plan (JSON-serialisable)
        self.next_id = 0
        self.tone = np.zeros((RES, RES))            # reference darkness (what the Critic compares against)
        self.must_edges = np.zeros((RES, RES), bool)
        self.edge_pool: list[tuple[float, np.ndarray]] = []   # (strength, chain) reserved for refinement
        self.mag = np.zeros((RES, RES))
        self.gen = self._plan()
        self.done = False
        self.refine_jobs: deque = deque()
        self.refine_gen = None

    # ---- cooperative scheduling: run the planning generator for at most `budget` seconds
    def step(self, budget: float) -> None:
        t0 = time.perf_counter()
        while self.inbox:
            m = self.inbox.popleft()
            if m.topic == "refine":
                self.refine_jobs.append(m.payload)
        while not self.done and time.perf_counter() - t0 < budget:
            try:
                next(self.gen)
            except StopIteration:
                self.done = True
        while self.done and time.perf_counter() - t0 < budget:          # self-correction passes are time-sliced too
            if self.refine_gen is None:
                if not self.refine_jobs:
                    break
                self.refine_gen = self._refine(self.refine_jobs.popleft())
            try:
                next(self.refine_gen)
            except StopIteration:
                self.refine_gen = None

    # ---- emit helpers
    def _emit(self, layer: str, kind: str, segments: list, tone: float = 0.0) -> None:
        p = dict(id=self.next_id, layer=layer, kind=kind, segments=[[[round(float(x), 2) for x in pt] for pt in s] for s in segments], tone=round(tone, 3))
        self.next_id += 1
        self.paths.append(p)
        self._batch.append(p)

    def _open_layer(self, layer: str) -> None:
        self._batch: list[dict] = []
        self.set_status(f"Planning layer '{layer}'")
        self.send("Critic", "layer_announce", layer)

    def _close_layer(self, layer: str) -> None:
        self.send("Kinematics", "path_batch", dict(layer=layer, paths=self._batch))
        self.log(f"layer '{layer}': {len(self._batch)} paths queued")

    @staticmethod
    def _order(chains: list[np.ndarray]) -> list[np.ndarray]:
        """Greedy nearest-neighbour ordering (vectorised), reversing a chain when its far end is closer: less pen travel."""
        n = len(chains)
        if n == 0:
            return []
        a = np.array([c[0] for c in chains])
        b = np.array([c[-1] for c in chains])
        alive, out, pos = np.ones(n, bool), [], np.zeros(2)
        for _ in range(n):
            d0 = np.where(alive, np.hypot(*(a - pos).T), np.inf)
            d1 = np.where(alive, np.hypot(*(b - pos).T), np.inf)
            i = int(np.argmin(np.minimum(d0, d1)))
            c = chains[i][::-1] if d1[i] < d0[i] else chains[i]
            alive[i] = False
            out.append(c)
            pos = c[-1]
        return out

    # ---- the planning pipeline (a generator so it can be time-sliced across frames)
    def _plan(self):
        self.set_status(f"Eye: looking at '{self.image or self.concept}'")
        yield
        dark = load_seed_image(self.image, RES) if self.image else CONCEPTS[self.concept](RES, self.rng)
        self.tone = gaussian_blur(dark, 1.0)
        gray = 1 - dark
        yield
        # ------------------------------------------------------------ analysis
        self.set_status("Eye: Gaussian + Sobel + Canny non-max suppression")
        fine, self.mag = canny(gray, 1.0, 40, 80)
        coarse, _ = canny(gray, 4.0, 70, 93)
        self.log(f"edge analysis: {int(fine.sum())} fine px, {int(coarse.sum())} coarse px")
        yield
        self.set_status("Eye: chaining edge pixels")
        fine_chains = trace_chains(fine, 8)
        strength = lambda c: float(self.mag[c[:, 1].astype(int), c[:, 0].astype(int)].mean())  # noqa: E731
        scored = sorted(((strength(c) * math.sqrt(len(c)), c) for c in fine_chains), key=lambda z: -z[0])
        self.edge_pool = scored
        must = np.zeros_like(fine)
        for sc, c in scored[: max(8, int(len(scored) * 0.55))]:
            must[c[:, 1].astype(int), c[:, 0].astype(int)] = True
        self.must_edges = must
        yield
        # ------------------------------------------------------------ layer 1: gesture skeleton
        self._open_layer("skeleton")
        self.set_status("Planner: gesture skeleton (principal axes + coarse flow lines)")
        ys, xs = np.nonzero(self.tone > 0.18)
        if len(xs) > 10:
            w = self.tone[ys, xs]
            cx, cy = (xs * w).sum() / w.sum(), (ys * w).sum() / w.sum()
            cov = np.cov(np.vstack([xs - cx, ys - cy]), aweights=w)
            ev, evec = np.linalg.eigh(cov)
            ra, rb = 2.1 * math.sqrt(max(ev[1], 1)), 2.1 * math.sqrt(max(ev[0], 1))
            ang = math.atan2(evec[1, 1], evec[0, 1])
            self._emit("skeleton", "skeleton", self._ellipse(cx, cy, ra, rb, ang))
            for s in (-1, 1):                                  # centre-line and cross line
                a = np.array([cx, cy]) + np.array([math.cos(ang), math.sin(ang)]) * ra * s
                b = np.array([cx, cy]) - np.array([math.cos(ang), math.sin(ang)]) * ra * 0.2 * s
                self._emit("skeleton", "skeleton", [self._line_bez(a * SCALE, b * SCALE, 6)])
        gc = sorted(trace_chains(coarse, 24), key=lambda c: -len(c))[:16]
        for c in self._order(gc):
            segs = chain_to_beziers(c * SCALE, 7.0)
            if segs:
                self._emit("skeleton", "skeleton", segs)
            yield
        self._close_layer("skeleton")
        # ------------------------------------------------------------ layer 2: primary contours (economy pass)
        self._open_layer("contours")
        self.set_status("Planner: primary contours (Schneider cubic fit)")
        main = [c for sc, c in scored if sc >= scored[min(len(scored) - 1, int(len(scored) * 0.6))][0] and len(c) >= 12] if scored else []
        for c in self._order(main):
            segs = chain_to_beziers(c * SCALE, 2.0)
            if segs:
                self._emit("contours", "contour", segs)
            yield
        self._close_layer("contours")
        # ------------------------------------------------------------ layer 3: shading hatches (economy: sparse, one direction)
        self._open_layer("shading")
        for lvl, spacing, ang, ph in [(0.34, 8.0, 48, 0.0), (0.52, 8.0, 48, 0.5)]:      # economy pass: sparse, one direction, highlights stay paper
            self.set_status(f"Planner: optimizing hatch density (tone >= {lvl:.2f}, spacing {spacing:.1f}px, {ang} deg)")
            for p in self._hatch(self.tone, None, lvl, spacing, ang, "shading", ph):
                self._emit("shading", "hatch", p[0], p[1])
            yield
        self._close_layer("shading")
        # ------------------------------------------------------------ layer 4: fine details
        self._open_layer("details")
        self.set_status("Planner: fine details (weighted line accents on the strongest edges)")
        top = [c for sc, c in scored[: max(6, int(len(scored) * 0.2))] if len(c) >= 16]
        for c in self._order(top):
            segs = chain_to_beziers(c * SCALE, 1.6)
            if segs:
                self._emit("details", "detail", segs)
            yield
        self.set_status("Planner: core-shadow accents in the darkest tones")
        near_edge = box_blur(self.must_edges.astype(float), 3) > 0.01
        ys, xs = np.nonzero((self.tone > 0.5) & near_edge)
        if len(xs):
            for i in self.rng.sample(range(len(xs)), min(60, len(xs))):
                p0 = np.array([xs[i], ys[i]], float)
                ang = math.radians(48 + self.rng.uniform(-8, 8))
                p1 = p0 + np.array([math.cos(ang), math.sin(ang)]) * self.rng.uniform(3, 7)
                self._emit("details", "detail", [self._line_bez(p0 * SCALE, p1 * SCALE, 0.6)], float(self.tone[ys[i], xs[i]]))
        self._close_layer("details")
        self.set_status("Planner: master plan complete - standing by for Critic")
        self.log(f"master plan: {len(self.paths)} Bezier paths")

    # ---- hatching: rotated scan lines through the tone map; each dark run becomes one slightly bowed cubic
    def _hatch(self, tone: np.ndarray, mask: Optional[np.ndarray], level: float, spacing: float, angle_deg: float, layer: str, phase: float = 0.0):
        H, W = tone.shape
        a = math.radians(angle_deg)
        d, n = np.array([math.cos(a), math.sin(a)]), np.array([-math.sin(a), math.cos(a)])
        R = math.hypot(W, H) / 2
        t = np.arange(-R, R, 1.0)
        out, flip = [], False
        for off in np.arange(-R + phase * spacing, R, spacing):
            off += self.rng.uniform(-0.2, 0.2) * spacing
            xs, ys = W / 2 + d[0] * t + n[0] * off, H / 2 + d[1] * t + n[1] * off
            ok = (xs >= 0) & (xs < W - 1) & (ys >= 0) & (ys < H - 1)
            xi, yi = np.clip(xs.astype(int), 0, W - 1), np.clip(ys.astype(int), 0, H - 1)
            hit = ok & (tone[yi, xi] >= level) & (True if mask is None else mask[yi, xi])
            if not hit.any():
                continue
            edges = np.diff(np.concatenate([[0], hit.astype(int), [0]]))
            runs = list(zip(np.nonzero(edges == 1)[0], np.nonzero(edges == -1)[0] - 1))
            runs = [r_ for r_ in runs if r_[1] - r_[0] >= 4 and self.rng.random() > 0.04]
            if flip:
                runs = runs[::-1]
            for i0, i1 in runs:
                p0 = np.array([xs[i0], ys[i0]]) + d * self.rng.uniform(-0.9, 0.3)
                p1 = np.array([xs[i1], ys[i1]]) + d * self.rng.uniform(-0.3, 0.9)
                if flip:
                    p0, p1 = p1, p0
                mid_tone = float(tone[yi[(i0 + i1) // 2], xi[(i0 + i1) // 2]])
                out.append(([self._line_bez(p0 * SCALE, p1 * SCALE, self.rng.uniform(0.3, 1.2))], mid_tone))
            flip = not flip
        return out

    def _line_bez(self, a: np.ndarray, b: np.ndarray, bow: float) -> list:
        """A straight stroke as a cubic with a little hand-made bow (control points pushed sideways)."""
        v = b - a
        L = np.hypot(*v) + 1e-9
        nrm = np.array([-v[1], v[0]]) / L
        return [a.tolist(), (a + v / 3 + nrm * bow * self.rng.uniform(-1, 1)).tolist(), (a + 2 * v / 3 + nrm * bow * self.rng.uniform(-1, 1)).tolist(), b.tolist()]

    def _ellipse(self, cx, cy, ra, rb, ang) -> list:
        """Four cubic arcs approximating an ellipse (kappa = 0.5523)."""
        k = 0.5523
        base = [[(1, 0), (1, k), (k, 1), (0, 1)], [(0, 1), (-k, 1), (-1, k), (-1, 0)], [(-1, 0), (-1, -k), (-k, -1), (0, -1)], [(0, -1), (k, -1), (1, -k), (1, 0)]]
        ca, sa = math.cos(ang), math.sin(ang)
        out = []
        for seg in base:
            out.append([[(cx + x * ra * ca - y * rb * sa) * SCALE, (cy + x * ra * sa + y * rb * ca) * SCALE] for x, y in seg])
        return out

    # ---- self-correction requests from the Critic (a generator, run in slices like the main plan)
    def _refine(self, job: dict):
        n = job["pass"]
        if job["kind"] == "edges":
            layer = f"refine-edges-{n}"
            self._open_layer(layer)
            self.set_status(f"Planner: recovering {int(job['mask'].sum())} missed edge pixels (pass {n})")
            chains = [c for c in trace_chains(job["mask"], 5)]
            for c in self._order(chains):
                segs = chain_to_beziers(c * SCALE, 1.8)
                if segs:
                    self._emit(layer, "contour", segs)
            yield
            self._close_layer(layer)
        else:
            layer = f"refine-hatch-{n}"
            self._open_layer(layer)
            ang = [105, 20, 75, 160][(n - 1) % 4]
            self.set_status(f"Planner: optimizing hatch density - cross-hatching {int(job['mask'].sum())} under-toned px at {ang} deg (pass {n})")
            tight = max(0.62, 0.88 ** (n - 1))                                                           # each pass hatches closer than the last
            for lvl, sp, ph in [(0.20, 6.0, 0.0), (0.38, 5.0, 0.3), (0.56, 4.2, 0.6), (0.74, 3.6, 0.15)]:      # darker tone -> denser lines
                sp *= tight
                for p in self._hatch(self.tone, job["mask"], lvl, sp, ang, layer, ph):
                    self._emit(layer, "hatch", p[0], p[1])
                yield
            self._close_layer(layer)


# =====================================================================================
#  6. THE KINEMATICS AGENT  (the Muscle)
# =====================================================================================
@dataclass
class Trajectory:
    path_id: int
    layer: str
    kind: str
    xy: np.ndarray            # (n,2) pen position sampled at FS Hz
    pressure: np.ndarray      # (n,)  0..1
    width: np.ndarray         # (n,)  px
    alpha: np.ndarray         # (n,)  0..1
    speed: np.ndarray         # (n,)  px/s
    length: float
    duration: float
    color: tuple


def _band_noise(n: int, fs: float, f_lo: float, f_hi: float, rng: np.random.Generator, k: int = 6) -> np.ndarray:
    """Band-limited smooth noise: a sum of k sinusoids with random frequency in [f_lo, f_hi] and random phase."""
    t = np.arange(n) / fs
    f = rng.uniform(f_lo, f_hi, k)
    ph = rng.uniform(0, 2 * np.pi, k)
    return (np.sin(2 * np.pi * f[None, :] * t[:, None] + ph[None, :]).sum(axis=1)) / math.sqrt(k / 2)


class KinematicsAgent(Agent):
    name = "Kinematics"
    color = (255, 190, 90)

    def __init__(self, studio: "Studio", seed: int):
        super().__init__(studio)
        self.todo: deque = deque()          # paths (and layer-end markers) waiting to be shaped
        self.in_flight = 0                  # trajectories handed to the Hand and not yet started
        self.rng = np.random.default_rng(seed)
        self.last_info = ""
        self.count = 0

    def step(self, budget: float) -> None:
        while self.inbox:
            m = self.inbox.popleft()
            if m.topic == "path_batch":
                for p in m.payload["paths"]:
                    self.todo.append(("path", p))
                self.todo.append(("layer_end", m.payload["layer"]))
            elif m.topic == "consumed":
                self.in_flight -= 1
        t0 = time.perf_counter()
        while self.todo and self.in_flight < 10 and time.perf_counter() - t0 < budget:
            kind, item = self.todo.popleft()
            if kind == "layer_end":
                self.send("Hand", "layer_end", item)
                continue
            traj = self.shape(item)
            self.count += 1
            self.in_flight += 1
            self.send("Hand", "trajectory", traj)
        if not self.todo:
            self.set_status("idle - waiting for paths")

    # -------------------------------------------------------------------------------
    def shape(self, path: dict) -> Trajectory:
        """Turn a Bezier path into a human-like movement:
           1. v_lim(s) = vmax * (k0/(|kappa|+k0))^(1/3)     two-thirds power law (slow in tight curves)
           2. minimum-jerk (quintic) speed ramps at both ends = ease-in / ease-out
           3. forward/backward passes enforce |dv/dt| <= amax, then a light smoothing of v
           4. integrate time, resample at FS, add tremor + drift, derive pressure -> width / opacity."""
        p = KIN[path["kind"]]
        fl = flatten(path["segments"], 1.2)
        P, s, kap = fl["pts"], fl["s"], fl["kappa"]
        L = float(s[-1])
        if L < 1.0:
            P = np.vstack([P[0], P[0] + [0.8, 0.3]])
            s, kap, L = np.array([0, 0.85]), np.zeros(2), 0.85
            fl["tan"] = np.array([[1.0, 0.0], [1.0, 0.0]])
        kap = np.convolve(np.pad(kap, 3, mode="edge"), np.ones(7) / 7, mode="valid")
        k0 = 0.012
        v_curv = p["vmax"] * (k0 / (np.abs(kap) + k0)) ** (1 / 3)         # slower where the path bends
        u0 = s / L

        def smoother(x):                                                   # minimum-jerk quintic 10x^3 - 15x^4 + 6x^5
            x = np.clip(x, 0.0, 1.0)
            return x**3 * (6 * x * x - 15 * x + 10)
        env = (0.12 + 0.88 * smoother(u0 / 0.14)) * (0.12 + 0.88 * smoother((1 - u0) / 0.14))   # jerk-free ease-in / ease-out
        v = np.clip(np.minimum(v_curv, p["vmax"] * env), 0.04 * p["vmax"], p["vmax"])
        v[0] = v[-1] = 0.04 * p["vmax"]
        ds = np.diff(s)
        for i in range(len(ds)):                                           # accelerate no harder than amax
            v[i + 1] = min(v[i + 1], math.sqrt(v[i] ** 2 + 2 * p["amax"] * ds[i]))
        for i in range(len(ds) - 1, -1, -1):                               # ... and brake no harder than amax
            v[i] = min(v[i], math.sqrt(v[i + 1] ** 2 + 2 * p["amax"] * ds[i]))
        v = np.convolve(np.pad(v, 4, mode="edge"), np.ones(9) / 9, mode="valid")     # light smoothing = less jerk
        dt = ds * 2 / np.maximum(v[:-1] + v[1:], 1e-3)
        t = np.concatenate([[0], np.cumsum(dt)]) * float(np.exp(self.rng.normal(0, 0.07)))     # tempo varies stroke to stroke
        T = float(t[-1])
        n = max(3, int(T * FS) + 1)
        tk = np.linspace(0, T, n)
        sk = np.interp(tk, t, s)
        xy = np.stack([np.interp(sk, s, P[:, 0]), np.interp(sk, s, P[:, 1])], 1)
        tan = np.stack([np.interp(sk, s, fl["tan"][:, 0]), np.interp(sk, s, fl["tan"][:, 1])], 1)
        tan /= (np.hypot(tan[:, 0], tan[:, 1])[:, None] + 1e-9)
        nrm = np.stack([-tan[:, 1], tan[:, 0]], 1)
        speed = np.gradient(sk) * (n / T)
        u = sk / L
        env = np.sin(np.pi * np.clip(u, 0, 1)) ** 0.6                  # drift fades at both ends: the nib lands where aimed
        sp = np.clip(speed / p["vmax"], 0, 1)
        tremor = p["tremor"] * (0.55 + 0.45 * sp)
        n_per = _band_noise(n, n / T, 8, 12, self.rng) * tremor
        n_tan = _band_noise(n, n / T, 8, 12, self.rng) * tremor * 0.6
        drift = _band_noise(n, n / T, 0.5, 1.7, self.rng) * p["drift"] * min(1.0, L / 220) * env
        land = self.rng.normal(0, 0.45, 2) * (u**3)[:, None]           # small landing error
        xy = xy + nrm * (n_per + drift)[:, None] + tan * n_tan[:, None] + land
        # pressure: ramps up, releases at the end, lighter when moving fast, plus slow variation
        rise = np.clip(u / 0.10, 0, 1) ** 0.7 if L > 6 else np.ones(n)
        fall = np.clip((1 - u) / 0.18, 0, 1) ** 0.8 if L > 6 else np.ones(n)
        base = float(self.rng.uniform(0.62, 0.95))                         # this stroke's overall hand pressure
        if path["kind"] == "hatch":                                        # press harder where the reference is darker
            base = min(1.0, base * (0.72 + 0.55 * float(np.clip(path.get("tone", 0.5), 0, 1))))
        press = np.clip(base * (1.06 - 0.55 * sp) * rise * fall * (1 + 0.08 * _band_noise(n, n / T, 1, 4, self.rng)), 0.04, 1.0)
        width = p["wmin"] + (p["wmax"] - p["wmin"]) * press
        alpha = p["op"][0] + (p["op"][1] - p["op"][0]) * press
        self.set_status(f"Applying min-jerk ease-in/out + 2/3-power law to path #{path['id']} [{path['kind']}]")
        self.last_info = f"{L:.0f}px  T={T*1000:.0f}ms  vpeak={speed.max():.0f}px/s"
        scale = PALETTES[self.studio.palette]
        col = tuple(int(np.clip(c * m, 0, 255)) for c, m in zip(p["color"], scale))
        return Trajectory(path["id"], path["layer"], path["kind"], xy, press, width, alpha, speed, L, T, col)


# =====================================================================================
#  7. THE HAND  (execution agent): replays trajectories onto the canvas with a pencil nib
# =====================================================================================
class HandAgent(Agent):
    name = "Hand"
    color = (150, 235, 150)

    def __init__(self, studio: "Studio", canvas):
        super().__init__(studio)
        import pygame
        self.pg = pygame
        self.canvas = canvas
        self.queue: deque = deque()
        self.cur: Optional[Trajectory] = None       # stroke being drawn
        self.travel: Optional[dict] = None          # pen-up movement being performed
        self.t = 0.0                                # time inside the current phase
        self.idx = 0
        self.pen = np.array([CANVAS * 0.5, CANVAS * 0.5])
        self.z = 18.0                               # pen height above the paper (0 = touching)
        self.sprites: dict = {}
        self.rng = np.random.default_rng(5)
        self.layer_done: dict[str, int] = {}
        self.strokes_done = 0
        self.stroke_total = 0
        self.last_stamp: Optional[tuple] = None
        self.wear = 0.0                             # drawn length since the last sharpening
        self.sharpenings = 0
        self.pause_t = 0.0                          # remaining time of a deliberate pause (sharpening / stepping back)
        self.pause_msg = ""
        self.pause_z = 0.0

    def _pause(self, secs: float, msg: str, z: float) -> None:
        self.pause_t, self.pause_msg, self.pause_z = secs, msg, z

    def step(self, dt: float) -> None:
        while self.inbox:
            m = self.inbox.popleft()
            if m.topic == "trajectory":
                self.queue.append(("traj", m.payload))
                self.stroke_total += 1
            elif m.topic == "layer_end":
                self.queue.append(("end", m.payload))
        budget = dt
        guard = 0
        while budget > 1e-9 and guard < 400:
            guard += 1
            if self.pause_t > 1e-9:                      # pencil held off the paper: sharpening or stepping back to look
                use = min(budget, self.pause_t)
                self.pause_t -= use
                budget -= use
                self.z = self.pause_z + 2.5 * math.sin(self.pause_t * 40.0) * (1.0 if "sharpen" in self.pause_msg else 0.0)
                self.set_status(self.pause_msg)
                continue
            if self.travel is None and self.cur is None:
                if not self.queue:
                    self.set_status("idle - waiting for strokes")
                    break
                kind, item = self.queue.popleft()
                if kind == "end":
                    self.send("Critic", "layer_done", item)
                    self._pause(0.45, f"stepping back to look at the '{item}' layer", 15.0)
                    continue
                self.send("Kinematics", "consumed", 1)
                self.cur_next = item
                self.travel = self._plan_travel(self.pen, item.xy[0])
                self.t = 0.0
            if self.travel is not None:
                use = min(budget, self.travel["dur"] - self.t)
                self.t += use
                budget -= use
                k = min(len(self.travel["xy"]) - 1, int(self.t * FS))
                self.pen, self.z = self.travel["xy"][k], self.travel["z"][k]
                self.set_status(f"lifting + travelling to stroke {self.cur_next.path_id}")
                if self.t >= self.travel["dur"] - 1e-9:
                    self.travel, self.cur, self.t, self.idx, self.last_stamp = None, self.cur_next, 0.0, 0, None
            elif self.cur is not None:
                tr = self.cur
                use = min(budget, tr.duration - self.t)
                self.t += use
                budget -= use
                new_idx = min(len(tr.xy) - 1, int(self.t * FS))
                self._stamp(tr, self.idx, new_idx)
                self.idx = new_idx
                self.pen, self.z = tr.xy[new_idx], 0.0
                self.set_status(f"drawing {tr.kind} stroke #{tr.path_id} on layer '{tr.layer}'")
                if self.t >= tr.duration - 1e-9:
                    self.strokes_done += 1
                    self.layer_done[tr.layer] = self.layer_done.get(tr.layer, 0) + 1
                    self.cur, self.t = None, 0.0
                    if self.wear >= WEAR_LEN:
                        self.sharpenings += 1
                        self.wear = 0.0
                        self._pause(1.3, f"sharpening pencil (#{self.sharpenings}) - nib was blunt", 26.0)
                        self.log(f"nib worn after {WEAR_LEN:.0f}px of line - pausing to sharpen the pencil (#{self.sharpenings})")

    @staticmethod
    def _plan_travel(a: np.ndarray, b: np.ndarray) -> dict:
        """Pen-up reach to the next stroke: Fitts-style duration, minimum-jerk path, parabolic lift."""
        d = float(np.hypot(*(b - a)))
        dur = 0.05 + 0.11 * math.log2(1 + d / 22.0)
        n = max(2, int(dur * FS) + 1)
        tau = np.linspace(0, 1, n)
        mj = 10 * tau**3 - 15 * tau**4 + 6 * tau**5
        xy = a[None, :] + (b - a)[None, :] * mj[:, None]
        z = np.clip(4 + 0.045 * d, 4, 22) * np.sin(np.pi * tau) ** 0.7 + 0.8
        return dict(xy=xy, z=z, dur=dur)

    # ---- graphite nib sprites: soft round alpha * paper-tooth grain, cached per (size, colour, opacity)
    def _sprite(self, r: float, col: tuple, a: float):
        key = (int(r * 3), col, int(a * 9), int(self.rng.integers(0, 3)))
        s = self.sprites.get(key)
        if s is None:
            rad = max(0.55, key[0] / 3.0)
            size = int(2 * rad + 4)
            yy, xx = np.mgrid[0:size, 0:size] - (size - 1) / 2
            d = np.hypot(xx, yy) / rad
            grain = 0.62 + 0.38 * self.rng.random((size, size))
            alpha = np.clip(1 - d**2.4, 0, 1) * grain * (key[2] / 9.0 + 0.04)
            s = self.pg.Surface((size, size), self.pg.SRCALPHA)
            self.pg.surfarray.pixels3d(s)[:] = np.array(col, np.uint8)[None, None, :]
            self.pg.surfarray.pixels_alpha(s)[:] = (alpha.T * 255).astype(np.uint8)
            self.sprites[key] = s
        return s

    def _stamp(self, tr: Trajectory, i0: int, i1: int) -> None:
        if i1 < i0 or len(tr.xy) < 2:
            return
        lo = max(0, i0 - 1)
        for i in range(lo, i1):
            a, b = tr.xy[i], tr.xy[i + 1]
            dist = float(np.hypot(*(b - a)))
            self.wear += dist
            blunt = 1.0 + 0.5 * min(1.0, self.wear / WEAR_LEN)             # a worn nib draws a fatter, softer line
            w, al = float(tr.width[i + 1]) * blunt, float(tr.alpha[i + 1]) / (0.9 + 0.1 * blunt)
            steps = max(1, int(dist / max(0.6, 0.22 * w)))
            for k in range(1, steps + 1):
                q = a + (b - a) * (k / steps)
                spr = self._sprite(w / 2, tr.color, al)
                self.canvas.blit(spr, (int(q[0] - spr.get_width() / 2 + 0.5), int(q[1] - spr.get_height() / 2 + 0.5)))


# =====================================================================================
#  8. THE CRITIC / LOOP CONTROLLER  (the Mind)
# =====================================================================================
class CriticAgent(Agent):
    name = "Critic"
    color = (255, 130, 160)

    def __init__(self, studio: "Studio", target: float, max_passes: int = 8):
        super().__init__(studio)
        self.target, self.max_passes = target, max_passes
        self.announced: set[str] = set()
        self.finished: set[str] = set()
        self.passes = {"edges": 0, "hatch": 0}
        self.score = 0.0
        self.metrics = dict(tone=0.0, edge=0.0)
        self.history: list[dict] = []
        self.prev_hatch_score = 0.0           # score at the previous shading review: a pass must keep paying off
        self.outstanding = 0                  # refine requests sent whose layer the Planner has not announced yet

    def step(self) -> None:
        while self.inbox:
            m = self.inbox.popleft()
            if m.topic == "layer_announce":
                self.announced.add(m.payload)
                if m.payload.startswith("refine"):
                    self.outstanding -= 1
            elif m.topic == "layer_done":
                self.finished.add(m.payload)
                self._review(m.payload)
        pl = self.studio.planner
        if not self.studio.job_complete and pl.done and self.announced and self.announced <= self.finished and not pl.refine_jobs and self.outstanding == 0:
            self._finalize()

    # ---- measure the real canvas against the master plan
    def _measure(self) -> tuple[float, float, np.ndarray, np.ndarray]:
        pg = self.studio.pg
        small = pg.transform.smoothscale(self.studio.hand.canvas, (RES, RES))
        lum = pg.surfarray.array3d(small).astype(float).mean(axis=2).T / 255.0
        paper = float(self.studio.paper_lum)
        ink = np.clip((paper - lum) / paper, 0, 1)
        pl = self.studio.planner
        T = 8
        f = lambda a: a[:RES // T * T, :RES // T * T].reshape(RES // T, T, RES // T, T).mean(axis=(1, 3))  # noqa: E731
        ti, tt = f(ink), f(pl.tone)
        g = float((ti * tt).sum() / max((tt * tt).sum(), 1e-9))              # how dark the pencil can get relative to the target
        corr = float(np.corrcoef(ti.ravel(), tt.ravel())[0, 1]) if tt.std() > 1e-6 and ti.std() > 1e-6 else 0.0
        inkb = box_blur((ink > 0.10).astype(float), 2) > 0.001
        me = pl.must_edges
        recall = float((me & inkb).sum() / max(me.sum(), 1))
        deficit = np.kron((tt > 0.2) & (ti < 0.6 * g * tt), np.ones((T, T), bool))
        deficit = np.pad(deficit, ((0, RES - deficit.shape[0]), (0, RES - deficit.shape[1])))
        missing = me & ~inkb
        return max(corr, 0.0), recall, deficit, missing

    def _review(self, layer: str) -> None:
        if layer == "skeleton":
            self.set_status("skeleton inked - checking proportions")
            return
        corr, recall, deficit, missing = self._measure()
        self.metrics = dict(tone=corr, edge=recall)
        self.score = 0.55 * corr + 0.45 * recall
        self.history.append(dict(after=layer, tone=round(corr, 3), edge=round(recall, 3), score=round(self.score, 3)))
        self.log(f"after '{layer}': tone corr {corr:.2f}, edge recall {recall:.2f}, score {self.score:.2f}")
        self.set_status(f"measured {layer}: tone {corr:.2f} / edges {recall:.2f}")
        if layer in ("contours",) or layer.startswith("refine-edges"):
            if recall < 0.90 and self.passes["edges"] < self.max_passes and missing.sum() > 12:
                self.passes["edges"] += 1
                self.outstanding += 1
                self.send("Planner", "refine", dict(kind="edges", mask=missing, **{"pass": self.passes["edges"]}))
                self.log(f"edge recall {recall:.2f} < 0.90: requesting contour refinement pass {self.passes['edges']}")
        elif layer in ("shading",) or layer.startswith("refine-hatch"):
            gain = self.score - self.prev_hatch_score
            self.prev_hatch_score = self.score
            worthwhile = layer == "shading" or gain >= 0.012                               # adaptive budget: stop when a pass no longer helps
            if not worthwhile:
                self.log(f"last hatch pass only gained {gain:+.3f}: diminishing returns, no further hatching")
            if worthwhile and self.score < self.target and self.passes["hatch"] < self.max_passes and deficit.sum() > 80:
                self.passes["hatch"] += 1
                self.outstanding += 1
                self.send("Planner", "refine", dict(kind="hatch", mask=deficit, **{"pass": self.passes["hatch"]}))
                self.log(f"score {self.score:.2f} < target {self.target:.2f}, {int(deficit.sum())}px under-toned: requesting hatch pass {self.passes['hatch']}")

    def _finalize(self) -> None:
        corr, recall, _, _ = self._measure()
        self.score = 0.55 * corr + 0.45 * recall
        self.metrics = dict(tone=corr, edge=recall)
        verdict = "quality target reached" if self.score >= self.target else "best effort within the correction budget (target not reached)"
        self.history.append(dict(after="final", tone=round(corr, 3), edge=round(recall, 3), score=round(self.score, 3)))
        self.log(f"FINAL review: score {self.score:.2f} (target {self.target:.2f}) - {verdict}. Job complete.")
        self.set_status(f"final score {self.score:.2f} - {verdict}")
        self.studio.job_complete = True


# =====================================================================================
#  9. STUDIO: window, HUD, nib drawing and THE autonomous main loop
# =====================================================================================
class Studio:
    def __init__(self, a: argparse.Namespace):
        if a.headless:
            os.environ["SDL_VIDEODRIVER"] = "dummy"
        import pygame
        self.pg = pygame
        pygame.display.init()                              # no audio subsystem needed
        pygame.font.init()
        self.args, self.palette = a, a.palette
        self.headless = a.headless
        self.speed = float(a.speed)
        self.paused = False
        self.show_hud = not a.no_hud
        self.job_complete = False
        self.logs: deque = deque(maxlen=9)
        self.run_log: list = []
        self.t_start = time.perf_counter()
        self.sim_time = 0.0
        self._prog = 0.0
        self.W, self.H = CANVAS + 40 + HUD_W, CANVAS + 40
        self.screen = pygame.display.set_mode((self.W, self.H), pygame.RESIZABLE | pygame.SCALED) if not a.headless else pygame.display.set_mode((self.W, self.H))
        pygame.display.set_caption("AI Hands - autonomous multi-agent drawing")
        self.clock = pygame.time.Clock()
        fonts = "dejavusansmono,menlo,consolas,couriernew,monospace"
        self.f_s, self.f_m, self.f_b = (pygame.font.SysFont(fonts, 13), pygame.font.SysFont(fonts, 15), pygame.font.SysFont(fonts, 22, bold=True))
        self.canvas = self._make_paper()
        self.paper_lum = pygame.surfarray.array3d(self.canvas).astype(float).mean() / 255.0
        self.paper_rgb = pygame.surfarray.array3d(self.canvas).astype(float).mean(axis=(0, 1))
        self.bus = MessageBus()
        self.planner = PlannerAgent(self, a.concept, a.image, a.seed)
        self.kin = KinematicsAgent(self, a.seed + 1)
        self.hand = HandAgent(self, self.canvas)
        self.critic = CriticAgent(self, a.quality)
        self.agents = [self.planner, self.kin, self.hand, self.critic]

    # ---- plumbing ------------------------------------------------------------------
    def log(self, who: str, msg: str) -> None:
        self.logs.append((who, msg))
        self.run_log.append(dict(t=round(self.sim_time, 2), agent=who, msg=msg))
        if self.args.verbose:
            print(f"[{self.sim_time:7.1f}s] {who:<10} {msg}", flush=True)

    def _make_paper(self):
        pg = self.pg
        rng = np.random.default_rng(11)
        fib = gaussian_blur(rng.random((CANVAS, CANVAS)), 0.9) * 0.6 + rng.random((CANVAS, CANVAS)) * 0.4
        yy, xx = np.mgrid[0:CANVAS, 0:CANVAS]
        vig = 1 - 0.07 * (((xx - CANVAS / 2) / (CANVAS / 2)) ** 2 + ((yy - CANVAS / 2) / (CANVAS / 2)) ** 2)
        base = np.array([246, 241, 229], float)
        arr = (base[None, None, :] * (0.965 + 0.05 * fib)[..., None] * vig[..., None]).clip(0, 255).astype(np.uint8)
        surf = pg.Surface((CANVAS, CANVAS))
        pg.surfarray.blit_array(surf, arr.transpose(1, 0, 2))
        return surf

    def progress(self) -> float:
        """Weighted layer completion: each planned layer contributes weight * (strokes drawn / strokes planned)."""
        total = 0.0
        planned: dict[str, int] = {}
        for p in self.planner.paths:
            planned[p["layer"]] = planned.get(p["layer"], 0) + 1
        for layer in LAYER_ORDER:
            if layer in planned:
                total += 0.92 * LAYER_WEIGHT[layer] * min(1.0, self.hand.layer_done.get(layer, 0) / planned[layer])
        extra = [k for k in planned if k.startswith("refine")]
        if extra:                                           # correction passes can only fill the last 8 %
            total += 0.08 * (sum(min(self.hand.layer_done.get(k, 0), planned[k]) for k in extra) / max(1, sum(planned[k] for k in extra)))
        self._prog = max(self._prog, min(total, 0.99))      # monotonic: a new correction pass never makes the bar go backwards
        return 1.0 if self.job_complete else self._prog

    # ---- the autonomous loop ------------------------------------------------------------
    def run(self) -> None:
        pg = self.pg
        frame = 0
        while not self.job_complete:                       # <-- the whole job is driven from here, no manual stepping
            dt = 1 / 60 if self.headless else min(self.clock.tick(60) / 1000.0, 0.05)
            for e in pg.event.get():
                if e.type == pg.QUIT or (e.type == pg.KEYDOWN and e.key == pg.K_ESCAPE):
                    self.log("Studio", "aborted by user - saving partial drawing")
                    self.save_outputs()
                    pg.quit()
                    sys.exit(0)
                if e.type == pg.KEYDOWN:
                    if e.key == pg.K_SPACE:
                        self.paused = not self.paused
                    elif e.key in (pg.K_PLUS, pg.K_EQUALS, pg.K_KP_PLUS):
                        self.speed = min(200, self.speed * 1.5)
                    elif e.key in (pg.K_MINUS, pg.K_KP_MINUS):
                        self.speed = max(0.25, self.speed / 1.5)
                    elif e.key == pg.K_h:
                        self.show_hud = not self.show_hud
                    elif e.key == pg.K_s:
                        pg.image.save(self.screen, os.path.join(self.args.out, "screenshot.png"))
            if not self.paused:
                self.sim_time += dt * self.speed
                # one cooperative tick of every agent; messages are delivered between agent slices
                self.planner.step(0.004)
                self.kin.step(0.004)
                self.hand.step(dt * self.speed)
                self.critic.step()
            if not self.headless or (self.args.shots and frame % self.args.shots == 0):
                self.render()
                if self.headless:
                    pg.image.save(self.screen, os.path.join(self.args.out, f"frame_{frame:06d}.png"))
            if not self.headless:
                pg.display.flip()
            frame += 1
            if time.perf_counter() - self.t_start > self.args.max_seconds:
                self.log("Studio", "wall-clock limit reached - finishing")
                self.job_complete = True
        # ---- job complete: hold the finished drawing, write files
        self.save_outputs()
        if not self.headless:
            t0 = time.perf_counter()
            while time.perf_counter() - t0 < self.args.hold:
                for e in pg.event.get():
                    if e.type in (pg.QUIT, pg.KEYDOWN):
                        t0 = -1e9
                self.render()
                pg.display.flip()
                self.clock.tick(30)
        pg.quit()

    def save_outputs(self) -> None:
        os.makedirs(self.args.out, exist_ok=True)
        name = self.args.concept if not self.args.image else os.path.splitext(os.path.basename(self.args.image))[0]
        png = os.path.join(self.args.out, f"drawing_{name}.png")
        self.pg.image.save(self.canvas, png)
        with open(os.path.join(self.args.out, f"plan_{name}.json"), "w") as f:
            json.dump(dict(concept=name, canvas=[CANVAS, CANVAS], layers=LAYER_ORDER, paths=self.planner.paths), f)
        with open(os.path.join(self.args.out, f"run_log_{name}.json"), "w") as f:
            json.dump(dict(score=self.critic.score, passes=self.critic.passes, history=self.critic.history, log=self.run_log), f, indent=1)
        svg = os.path.join(self.args.out, f"drawing_{name}.svg")
        with open(svg, "w") as f:
            f.write(self.to_svg())
        print(f"saved {png}  (paths: {len(self.planner.paths)}, strokes drawn: {self.hand.strokes_done}, "
              f"final score {self.critic.score:.2f}, correction passes {self.critic.passes})")

    def to_svg(self) -> str:
        """The master plan as a layered SVG: every planned cubic Bezier path becomes one <path>, grouped by layer, with
        the stroke colour, mean line weight and opacity of its kind (hatches are weighted by their tone)."""
        r, g, b = (int(round(v)) for v in self.paper_rgb)
        out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS} {CANVAS}" width="{CANVAS}" height="{CANVAS}">',
               f'<rect width="{CANVAS}" height="{CANVAS}" fill="#{r:02x}{g:02x}{b:02x}"/>',
               '<g fill="none" stroke-linecap="round" stroke-linejoin="round">']
        scale = PALETTES[self.palette]
        layers: dict[str, list[dict]] = {}
        for p in self.planner.paths:
            layers.setdefault(p["layer"], []).append(p)
        for layer in LAYER_ORDER + sorted(k for k in layers if k.startswith("refine")):
            if layer not in layers:
                continue
            out.append(f'<g id="{layer}">')
            for p in layers[layer]:
                k = KIN[p["kind"]]
                col = tuple(int(np.clip(c * m, 0, 255)) for c, m in zip(k["color"], scale))
                w = 0.5 * (k["wmin"] + k["wmax"])
                op = 0.5 * (k["op"][0] + k["op"][1]) * (0.6 + 0.8 * min(1.0, p["tone"]) if p["kind"] == "hatch" else 1.0)
                seg = p["segments"]
                d = f"M{seg[0][0][0]:.1f} {seg[0][0][1]:.1f}" + "".join(
                    f"C{c[1][0]:.1f} {c[1][1]:.1f} {c[2][0]:.1f} {c[2][1]:.1f} {c[3][0]:.1f} {c[3][1]:.1f}" for c in seg)
                out.append(f'<path d="{d}" stroke="#{col[0]:02x}{col[1]:02x}{col[2]:02x}" stroke-width="{w:.2f}" stroke-opacity="{min(op, 1.0):.2f}"/>')
            out.append("</g>")
        out.append("</g></svg>")
        return "\n".join(out)

    # ---- drawing the window ----------------------------------------------------------------
    def render(self) -> None:
        pg, scr = self.pg, self.screen
        scr.fill((26, 27, 33))
        scr.blit(self.canvas, (20, 20))
        pg.draw.rect(scr, (70, 72, 84), (19, 19, CANVAS + 2, CANVAS + 2), 1)
        self._draw_nib()
        if self.show_hud:
            self._draw_hud()

    def _draw_nib(self) -> None:
        """The visible pencil: a shadow on the paper, and the pencil itself rising off the paper when the pen is lifted."""
        pg, scr = self.pg, self.screen
        h = self.hand
        if h.cur is None and h.travel is None and self.job_complete:
            return
        x, y = 20 + h.pen[0], 20 + h.pen[1]
        z = h.z
        pg.draw.ellipse(scr, (60, 55, 50), (x - 4 + z * 0.5, y - 1 + z * 0.4, 8 + z * 0.2, 4 + z * 0.1), 0) if z > 0.5 else None
        tx, ty = x - z * 0.55, y - z * 1.0                 # tip position (lifted)
        ang = math.radians(-62)
        d = np.array([math.cos(ang), math.sin(ang)])
        n = np.array([-d[1], d[0]])
        tip = np.array([tx, ty])
        cone_end, body_end = tip + d * 46, tip + d * 190
        pg.draw.polygon(scr, (226, 190, 140), [tip, cone_end + n * 6.5, cone_end - n * 6.5])
        pg.draw.polygon(scr, (52, 50, 58), [tip, tip + d * 11 + n * 1.9, tip + d * 11 - n * 1.9])
        pg.draw.polygon(scr, (232, 190, 40), [cone_end + n * 6.5, cone_end - n * 6.5, body_end - n * 6.5, body_end + n * 6.5])
        pg.draw.line(scr, (170, 130, 20), cone_end + n * 2, body_end + n * 2, 2)
        pg.draw.circle(scr, (255, 90, 90) if self.hand.cur is not None else (190, 190, 190), (int(tx), int(ty)), 3, 1)

    def _draw_hud(self) -> None:
        pg, scr = self.pg, self.screen
        x0 = CANVAS + 40
        panel = pg.Surface((HUD_W - 10, self.H - 40), pg.SRCALPHA)
        panel.fill((14, 15, 20, 235))
        scr.blit(panel, (x0 - 10 + 10, 20))
        y = 30
        pct = self.progress() * 100
        scr.blit(self.f_b.render("AI HANDS", True, (240, 240, 245)), (x0, y))
        scr.blit(self.f_b.render(f"{pct:5.1f}%", True, (255, 220, 120)), (x0 + HUD_W - 120, y))
        y += 32
        pg.draw.rect(scr, (45, 47, 58), (x0, y, HUD_W - 30, 10), border_radius=5)
        pg.draw.rect(scr, (255, 200, 90), (x0, y, int((HUD_W - 30) * pct / 100), 10), border_radius=5)
        y += 22
        for ag in self.agents:
            pg.draw.circle(scr, ag.color, (x0 + 6, y + 8), 5)
            scr.blit(self.f_m.render(f"{ag.name}", True, ag.color), (x0 + 18, y))
            txt = ag.status
            lines = self._wrap(txt, 47)[:2]
            for i, ln in enumerate(lines):
                scr.blit(self.f_s.render(ln, True, (200, 202, 212)), (x0 + 18, y + 18 + i * 14))
            y += 18 + 14 * max(1, len(lines)) + 8
        # layer bars
        planned: dict[str, int] = {}
        for p in self.planner.paths:
            planned[p["layer"]] = planned.get(p["layer"], 0) + 1
        scr.blit(self.f_m.render("Layers", True, (220, 220, 230)), (x0, y))
        y += 20
        names = LAYER_ORDER + sorted(k for k in planned if k.startswith("refine"))
        for nm in names:
            tot, done = planned.get(nm, 0), self.hand.layer_done.get(nm, 0)
            frac = done / tot if tot else 0.0
            scr.blit(self.f_s.render(f"{nm:<16}{done:>4}/{tot:<4}", True, (170, 172, 185)), (x0, y))
            pg.draw.rect(scr, (45, 47, 58), (x0 + 215, y + 2, HUD_W - 250, 8))
            pg.draw.rect(scr, (130, 200, 255) if not nm.startswith("refine") else (255, 150, 170), (x0 + 215, y + 2, int((HUD_W - 250) * frac), 8))
            y += 16
        y += 6
        scr.blit(self.f_m.render("Critic metrics", True, (220, 220, 230)), (x0, y))
        y += 19
        m = self.critic.metrics
        scr.blit(self.f_s.render(f"tone corr {m['tone']:.2f}   edge recall {m['edge']:.2f}   score {self.critic.score:.2f}/{self.critic.target:.2f}", True, (200, 202, 212)), (x0, y))
        y += 16
        scr.blit(self.f_s.render(f"corrections: edges {self.critic.passes['edges']}  hatch {self.critic.passes['hatch']}   msgs {self.bus.sent}", True, (200, 202, 212)), (x0, y))
        y += 24
        # live kinematic profile of the stroke being drawn
        tr = self.hand.cur
        scr.blit(self.f_m.render("Pen kinematics", True, (220, 220, 230)), (x0, y))
        y += 20
        gx, gw, gh = x0, HUD_W - 30, 70
        pg.draw.rect(scr, (24, 25, 32), (gx, y, gw, gh))
        if tr is not None:
            n = len(tr.speed)
            sp = tr.speed / max(1.0, float(tr.speed.max()))            # plotted relative to this stroke's own peak
            pts_v = [(gx + i * gw / (n - 1), y + gh - 4 - sp[i] * (gh - 8)) for i in range(0, n, max(1, n // 120))]
            pts_p = [(gx + i * gw / (n - 1), y + gh - 4 - tr.pressure[i] * (gh - 8)) for i in range(0, n, max(1, n // 120))]
            if len(pts_v) > 1:
                pg.draw.lines(scr, (255, 190, 90), False, pts_v, 2)
                pg.draw.lines(scr, (120, 220, 160), False, pts_p, 1)
            cx = gx + self.hand.idx * gw / max(1, n - 1)
            pg.draw.line(scr, (255, 255, 255), (cx, y), (cx, y + gh), 1)
        scr.blit(self.f_s.render("speed", True, (255, 190, 90)), (gx + 4, y + 2))
        scr.blit(self.f_s.render("pressure", True, (120, 220, 160)), (gx + 56, y + 2))
        y += gh + 4
        info = (f"#{tr.path_id} {tr.length:.0f}px  T={tr.duration*1000:.0f}ms  vpeak={tr.speed.max():.0f}px/s" if tr is not None else "pen lifted")
        scr.blit(self.f_s.render(info, True, (170, 172, 185)), (x0, y))
        y += 17
        wear = min(1.0, self.hand.wear / WEAR_LEN)
        scr.blit(self.f_s.render("nib wear", True, (170, 172, 185)), (x0, y))
        pg.draw.rect(scr, (45, 47, 58), (x0 + 72, y + 3, 150, 8))
        pg.draw.rect(scr, (255, 150, 90) if wear > 0.8 else (170, 200, 140), (x0 + 72, y + 3, int(150 * wear), 8))
        scr.blit(self.f_s.render(f"sharpened x{self.hand.sharpenings}", True, (170, 172, 185)), (x0 + 232, y))
        y += 22
        scr.blit(self.f_m.render("Message log", True, (220, 220, 230)), (x0, y))
        y += 19
        col = {"Planner": self.planner.color, "Kinematics": self.kin.color, "Hand": self.hand.color, "Critic": self.critic.color}
        lines = []
        for who, msg in list(self.logs):
            wrapped = self._wrap(f"{who}: {msg}", 47)[:2]
            lines += [(who, ln, i == 0) for i, ln in enumerate(wrapped)]
        room = max(0, (self.H - 62 - y) // 14)                            # only what fits above the footer
        for who, ln, first in lines[-room:] if room else []:
            scr.blit(self.f_s.render(ln, True, col.get(who, (200, 200, 200)) if first else (170, 172, 185)), (x0, y))
            y += 14
        y = self.H - 52
        scr.blit(self.f_s.render(f"sim speed x{self.speed:.1f}", True, (150, 154, 170)), (x0, y))
        scr.blit(self.f_s.render("[+/-] speed  [space] pause  [h] HUD  [esc] quit", True, (110, 114, 130)), (x0, y + 15))
        if self.job_complete:
            scr.blit(self.f_b.render("JOB COMPLETE", True, (140, 255, 170)), (x0 + 200, y - 4))

    @staticmethod
    def _wrap(s: str, n: int) -> list[str]:
        out, cur = [], ""
        for w in s.split():
            if len(cur) + len(w) + 1 > n:
                out.append(cur)
                cur = w
            else:
                cur = (cur + " " + w).strip()
        return out + [cur] if cur else out or [""]


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Autonomous multi-agent vector drawing studio")
    ap.add_argument("--concept", choices=list(CONCEPTS), default="still_life")
    ap.add_argument("--image", help="seed image to trace instead of a built-in concept")
    ap.add_argument("--palette", choices=list(PALETTES), default="graphite")
    ap.add_argument("--speed", type=float, default=4.0, help="simulation speed multiplier (1 = real time)")
    ap.add_argument("--quality", type=float, default=0.80, help="Critic's target score (0..1)")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", default="drawing_output")
    ap.add_argument("--hold", type=float, default=8.0, help="seconds to show the finished drawing")
    ap.add_argument("--headless", action="store_true", help="no window; run flat out and write files")
    ap.add_argument("--shots", type=int, default=0, help="headless: save a full-window frame every N frames")
    ap.add_argument("--no-hud", action="store_true")
    ap.add_argument("--verbose", action="store_true", help="print the agents' message log")
    ap.add_argument("--max-seconds", type=float, default=3600, help="wall-clock safety limit")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    return a


if __name__ == "__main__":
    Studio(parse_args()).run()
