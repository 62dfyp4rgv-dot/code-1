"""Panels 5-13: the VFW hall, the bar, the dressing room."""
from __future__ import annotations

import math

import numpy as np

from .grade import finish_sepia
from .r3d import _blur, fnoise
from .registry import panel
from .world import Canvas, smoothstep

WARM = (1.0, 0.78, 0.45)
CREAM = (0.93, 0.86, 0.70)


@panel(5)
def p05(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    # night sky with low cloud
    c.gradient((0.025, 0.03, 0.05), (0.17, 0.12, 0.08), 0, H * 0.60, power=0.85)
    cl = fnoise(H, W, 220 * k, 70 * k, ctx.seed + 1) * 0.5 + 0.5
    c.a += (cl * np.clip(1 - np.arange(H)[:, None] / (H * 0.55), 0, 1) ** 1.2 * 0.06)[..., None] * np.array([0.9, 0.8, 0.7], np.float32)
    # power lines
    for i, (y0, y1) in enumerate(((0.05, 0.075), (0.065, 0.088), (0.08, 0.1))):
        pts = [(x, H * (y0 + (y1 - y0) * (x / W)) + math.sin(x / W * 3.1 + i) * 6 * k + 18 * k * (1 - (2 * x / W - 1) ** 2)) for x in np.linspace(0, W, 40)]
        c.line(pts, (0.02, 0.02, 0.025), 1.4, 0.9)
    # the building: flat-roofed brick hall
    bx0, bx1, by0, by1 = W * 0.06, W * 0.94, H * 0.30, H * 0.625
    wall = c.mask_rect(bx0, by0, bx1, by1)
    c.bricks(wall, (0.30, 0.16, 0.11), (0.10, 0.08, 0.07), 46, 21)
    c.multiply(c.mask_rect(bx0, by0, bx1, by0 + (by1 - by0) * 0.22, blur=40 * k), (0.55, 0.52, 0.55), 0.8)     # dark at the top
    c.rect(bx0 - 8 * k, by0 - 16 * k, bx1 + 8 * k, by0 + 2 * k, (0.14, 0.10, 0.08), 0.05)                   # parapet
    c.rect(bx0 - 8 * k, by0 - 16 * k, bx1 + 8 * k, by0 - 12 * k, (0.35, 0.28, 0.22), 0.05)
    # boarded windows and a lit one
    for i, (wx0, wx1) in enumerate(((0.12, 0.26), (0.55, 0.69), (0.75, 0.89))):
        x0, x1, y0, y1 = W * wx0, W * wx1, H * 0.40, H * 0.49
        c.rect(x0 - 6 * k, y0 - 6 * k, x1 + 6 * k, y1 + 6 * k, (0.12, 0.10, 0.09), 0.04)
        c.rect(x0, y0, x1, y1, (0.05, 0.045, 0.045) if i != 1 else (0.55, 0.38, 0.18), 0.05)
        if i == 1:
            for j in range(1, 6):                                                                           # blinds
                c.rect(x0, y0 + (y1 - y0) * j / 6, x1, y0 + (y1 - y0) * j / 6 + 2 * k, (0.2, 0.13, 0.07), 0.0)
            c.glow((x0 + x1) / 2, (y0 + y1) / 2, 150 * k, (0.6, 0.35, 0.12), 0.45)
        else:
            c.line([(x0, y0 + 4 * k), (x1, y1 - 4 * k)], (0.2, 0.15, 0.12), 3, 0.7)                      # boards
            c.line([(x0, y1 - 4 * k), (x1, y0 + 4 * k)], (0.2, 0.15, 0.12), 3, 0.7)
    # door with an awning and a wall lamp
    dx0, dx1 = W * 0.31, W * 0.41
    c.rect(dx0 - 10 * k, H * 0.405, dx1 + 10 * k, by1, (0.12, 0.09, 0.07), 0.04)
    c.rect(dx0, H * 0.42, dx1, by1, (0.42, 0.27, 0.12), 0.06)
    c.rect(dx0 + 8 * k, H * 0.44, dx1 - 8 * k, H * 0.50, (0.7, 0.5, 0.22), 0.0)
    c.line([((dx0 + dx1) / 2, H * 0.44), ((dx0 + dx1) / 2, by1)], (0.15, 0.1, 0.06), 3, 0.8)
    c.poly([(dx0 - 22 * k, H * 0.405), (dx1 + 22 * k, H * 0.405), (dx1 + 30 * k, H * 0.425), (dx0 - 30 * k, H * 0.425)], (0.30, 0.10, 0.08), 0.05)
    c.rect((dx0 + dx1) / 2 - 12 * k, H * 0.38, (dx0 + dx1) / 2 + 12 * k, H * 0.395, (1.0, 0.85, 0.5), 0.0)
    c.glow((dx0 + dx1) / 2, H * 0.40, 190 * k, WARM, 0.55)
    c.cone_light(((dx0 + dx1) / 2, H * 0.395), 90, 38, 330 * k, (1.0, 0.75, 0.4), 0.22)
    # somebody smoking at the door: a silhouette with an ember
    fx, fy = W * 0.27, by1 + 6 * k
    c.poly([(fx - 15 * k, fy), (fx - 13 * k, fy - 52 * k), (fx + 13 * k, fy - 52 * k), (fx + 15 * k, fy)], (0.03, 0.025, 0.025), 0.0)
    c.ellipse(fx, fy - 63 * k, 11 * k, 13 * k, (0.03, 0.025, 0.025), 0.0)
    c.rect(fx + 15 * k, fy - 48 * k, fx + 34 * k, fy - 44 * k, (0.03, 0.025, 0.025), 0.0)
    c.ellipse(fx + 35 * k, fy - 46 * k, 2.4 * k, 2.4 * k, (1.0, 0.55, 0.15), 0.0)
    c.glow(fx + 35 * k, fy - 46 * k, 26 * k, (1.0, 0.45, 0.1), 0.9)
    # the sign on two posts
    sx0, sx1, sy0, sy1 = W * 0.56, W * 0.86, H * 0.07, H * 0.185
    for px in (sx0 + 22 * k, sx1 - 22 * k):
        c.rect(px - 5 * k, sy1, px + 5 * k, by1 + 40 * k, (0.08, 0.06, 0.05), 0.04)
    c.rect(sx0 - 6 * k, sy0 - 6 * k, sx1 + 6 * k, sy1 + 6 * k, (0.10, 0.08, 0.07), 0.03)
    c.rect(sx0, sy0, sx1, sy1, (0.93, 0.86, 0.68), 0.05)
    c.text((sx0 + sx1) / 2, sy0 + (sy1 - sy0) * 0.24, "VFW POST 1173", 21, (0.08, 0.06, 0.05))
    c.text((sx0 + sx1) / 2, sy0 + (sy1 - sy0) * 0.54, "WRESTLING", 29, (0.08, 0.06, 0.05))
    c.text((sx0 + sx1) / 2, sy0 + (sy1 - sy0) * 0.83, "TONITE — $10", 21, (0.08, 0.06, 0.05))
    c.glow((sx0 + sx1) / 2, (sy0 + sy1) / 2, 260 * k, (0.9, 0.7, 0.4), 0.55)
    # wet asphalt lot
    gy = by1
    c.gradient((0.05, 0.045, 0.045), (0.02, 0.018, 0.02), gy, H, power=0.9)
    gm = c.mask_rect(0, gy, W, H)
    c.concrete(gm * 0.85, (0.09, 0.085, 0.085))
    c.rect(0, gy, W, gy + 7 * k, (0.2, 0.16, 0.13), 0.04)                                                   # kerb
    for i in range(5):                                                                                       # painted bay lines
        x = W * (0.05 + 0.22 * i)
        c.poly([(x, H * 0.78), (x + 10 * k, H * 0.78), (x - 50 * k, H * 1.0), (x - 64 * k, H * 1.0)], (0.55, 0.5, 0.42), 0.0, alpha=0.5)
    # reflections of the door, window and sign streaked down the wet ground
    refl = np.zeros((H, W), np.float32)
    for rx, rw, rs in (((dx0 + dx1) / 2, 85 * k, 1.0), (W * 0.62, 60 * k, 0.5), ((sx0 + sx1) / 2, 130 * k, 0.45)):
        yy = np.clip((np.arange(H, dtype=np.float32) - gy) / (H - gy), 0, 1)[:, None]
        xx = np.arange(W, dtype=np.float32)[None, :]
        refl += rs * np.exp(-((xx - rx) / (rw * (0.6 + 0.9 * yy))) ** 2) * (1 - yy) ** 1.3 * (yy > 0)
    ripple = 0.65 + 0.35 * fnoise(H, W, 220 * k, 5 * k, ctx.seed + 2)
    c.a += (refl * ripple * 0.65)[..., None] * np.array([1.0, 0.72, 0.4], np.float32)
    # puddles holding the sky
    for px, py, pr in ((W * 0.18, H * 0.93, 150), (W * 0.62, H * 0.96, 190), (W * 0.9, H * 0.86, 90)):
        pm = c.mask_ellipse(px, py, pr * k, pr * k * 0.16, blur=2)
        c.fill(pm, (0.28, 0.22, 0.18), 0.1, alpha=0.55)
        c.rim(pm, (0.9, 0.7, 0.45), 2, (0, -1), 0.5)
    # two pickup trucks, in silhouette with a glint of headlight
    for tx, ty, ts, flip in ((W * 0.06, H * 0.78, 0.62, 1), (W * 0.52, H * 0.84, 0.82, -1)):
        s = ts * k
        body = [(tx, ty), (tx + 8 * s * 10, ty - 14 * s), (tx + 36 * s * 3, ty - 46 * s), (tx + 38 * s * 3.6, ty - 80 * s), (tx + 62 * s * 3.6, ty - 80 * s), (tx + 75 * s * 3.6, ty - 46 * s),
                (tx + 118 * s * 3.2, ty - 44 * s), (tx + 118 * s * 3.2, ty - 5 * s), (tx + 112 * s * 3.2, ty)]
        c.poly(body, (0.025, 0.022, 0.025), 0.0)
        c.rim(c.mask_poly(body), (0.8, 0.6, 0.4), 3, (-1, -1), 0.55)
        for wx in (tx + 28 * s * 3, tx + 98 * s * 3.2):
            c.ellipse(wx, ty + 2 * s, 20 * s * 1.4, 20 * s * 1.4, (0.012, 0.012, 0.014), 0.0)
        c.glow(tx + 4 * s, ty - 30 * s, 40 * s, (1.0, 0.8, 0.5), 0.5)
    # a street lamp in the near distance with its halo
    lx = W * 0.47
    c.rect(lx - 3 * k, H * 0.16, lx + 3 * k, gy + 20 * k, (0.04, 0.04, 0.045), 0.0)
    c.poly([(lx - 30 * k, H * 0.15), (lx + 30 * k, H * 0.15), (lx + 14 * k, H * 0.17), (lx - 14 * k, H * 0.17)], (0.04, 0.04, 0.045), 0.0)
    c.glow(lx, H * 0.172, 250 * k, (0.95, 0.8, 0.55), 0.55)
    c.cone_light((lx, H * 0.17), 90, 40, 480 * k, (0.95, 0.8, 0.55), 0.3)
    # rain, mist and splashes
    c.rain(520, 85, 82, (0.85, 0.75, 0.6), 0.28)
    c.rain(260, 130, 80, (0.9, 0.8, 0.65), 0.20, 2.2)
    c.haze((0.55, 0.42, 0.3), 0.12, 0.35, 0.9)
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.2, bloom_strength=0.35)


@panel(6)
def p06(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.07, 0.05, 0.04), (0.12, 0.085, 0.06), 0, H)
    # back wall: dark wood paneling with framed photos, a flag and a clock
    wall = c.mask_rect(0, H * 0.07, W, H * 0.60)
    c.planks(wall, (0.20, 0.12, 0.075), True, 56)
    c.rect(0, 0, W, H * 0.075, (0.09, 0.075, 0.06), 0.05)                                                  # drop ceiling
    for fx in (0.17, 0.31, 0.70):
        c.rect(W * fx - 28 * k, H * 0.15, W * fx + 28 * k, H * 0.215, (0.05, 0.04, 0.035), 0.03)
        c.rect(W * fx - 23 * k, H * 0.158, W * fx + 23 * k, H * 0.207, (0.42, 0.34, 0.26), 0.06)
        c.ellipse(W * fx, H * 0.18, 9 * k, 11 * k, (0.25, 0.2, 0.16), 0.0)
    c.rect(W * 0.88 - 36 * k, H * 0.13, W * 0.88 + 36 * k, H * 0.23, (0.08, 0.06, 0.05), 0.03)
    for i in range(7):                                                                                     # the flag, folded in a frame
        c.rect(W * 0.88 - 32 * k, H * 0.138 + i * 11 * k, W * 0.88 + 32 * k, H * 0.138 + i * 11 * k + 6 * k, (0.5, 0.18, 0.15) if i % 2 == 0 else (0.7, 0.65, 0.58), 0.04)
    c.rect(W * 0.88 - 32 * k, H * 0.138, W * 0.88 - 4 * k, H * 0.138 + 44 * k, (0.14, 0.17, 0.3), 0.04)
    c.rect(W * 0.54, H * 0.11, W * 0.585, H * 0.145, (0.78, 0.7, 0.55), 0.04)                              # a notice board
    # ceiling fluorescents and their light
    for fx in (0.28, 0.72):
        for fy in (0.025, 0.05):
            x0, x1, y0 = W * fx - 70 * k, W * fx + 70 * k, H * fy
            c.rect(x0, y0, x1, y0 + 9 * k, (0.95, 0.92, 0.8), 0.0)
            c.glow((x0 + x1) / 2, y0 + 5 * k, 140 * k, (0.8, 0.78, 0.6), 0.5)
        c.cone_light((W * fx, H * 0.06), 90, 34, H * 0.7, (0.85, 0.8, 0.6), 0.22)
    # the ring on a low riser
    rx0, rx1, ry0, ry1 = W * 0.2, W * 0.8, H * 0.405, H * 0.575
    c.poly([(rx0 + 14 * k, ry1 - 6 * k), (rx1 - 14 * k, ry1 - 6 * k), (rx1 + 4 * k, ry1 + 22 * k), (rx0 - 4 * k, ry1 + 22 * k)], (0.13, 0.095, 0.07), 0.05)           # apron
    c.poly([(rx0 + 30 * k, ry0 + 40 * k), (rx1 - 30 * k, ry0 + 40 * k), (rx1 - 6 * k, ry1 - 6 * k), (rx0 + 6 * k, ry1 - 6 * k)], (0.55, 0.42, 0.28), 0.1)                    # canvas
    c.glow(W * 0.5, ry0 + 90 * k, 330 * k, (0.7, 0.55, 0.3), 0.6)
    for sx, sy in ((0.40, 0.49), (0.58, 0.505), (0.5, 0.44)):                                                 # stains and tape marks on the canvas
        c.ellipse(W * sx, H * sy, 32 * k, 8 * k, (0.40, 0.28, 0.18), 0.1, 0.5, 4)
    for (px0, py0), (px1, py1) in (((rx0 + 30 * k, ry0 + 40 * k), (rx0 + 6 * k, ry1 - 6 * k)), ((rx1 - 30 * k, ry0 + 40 * k), (rx1 - 6 * k, ry1 - 6 * k))):
        pass
    for post_x, post_top, post_bot in ((rx0 + 28 * k, ry0 + 8 * k, ry0 + 46 * k), (rx1 - 28 * k, ry0 + 8 * k, ry0 + 46 * k), (rx0 + 4 * k, ry0 + 76 * k, ry1 - 6 * k),
                                      (rx1 - 4 * k, ry0 + 76 * k, ry1 - 6 * k)):
        c.rect(post_x - 5 * k, post_top, post_x + 5 * k, post_bot + 26 * k, (0.07, 0.06, 0.055), 0.03)
        for pad_y in (0.1, 0.45, 0.8):
            c.rect(post_x - 6 * k, post_top + (post_bot - post_top) * pad_y, post_x + 6 * k, post_top + (post_bot - post_top) * pad_y + 7 * k, (0.5, 0.15, 0.1), 0.04)
    for j, ry in enumerate((0.0, 0.34, 0.68)):                                                                # ropes, back and front
        yb = ry0 + 10 * k + ry * 40 * k
        c.line([(rx0 + 28 * k, yb), (rx1 - 28 * k, yb)], (0.88, 0.8, 0.62), 4, 0.9)
        yf = ry1 - 52 * k + ry * 52 * k
        c.line([(rx0 + 4 * k, yf), (rx1 - 4 * k, yf)], (0.9, 0.82, 0.64), 5, 1.0)
        c.line([(rx0 + 4 * k, yf + 3 * k), (rx1 - 4 * k, yf + 3 * k)], (0.2, 0.14, 0.1), 2, 0.5)
    # people at the apron: a ring announcer's table and a few standing silhouettes
    c.rect(W * 0.06, H * 0.52, W * 0.20, H * 0.54, (0.22, 0.16, 0.11), 0.04)
    c.rect(W * 0.07, H * 0.54, W * 0.19, H * 0.62, (0.14, 0.1, 0.08), 0.04)
    for i in range(3):
        c.ellipse(W * (0.09 + 0.045 * i), H * 0.505, 7 * k, 9 * k, (0.7, 0.65, 0.6), 0.0)
        c.rect(W * (0.09 + 0.045 * i) - 3 * k, H * 0.508, W * (0.09 + 0.045 * i) + 3 * k, H * 0.52, (0.7, 0.65, 0.6), 0.0)
    # floor, folding chairs and the crowd
    c.gradient((0.15, 0.1, 0.07), (0.07, 0.05, 0.04), H * 0.60, H, mask=c.mask_rect(0, H * 0.60, W, H))
    c.planks(c.mask_rect(0, H * 0.60, W, H) * 0.45, (0.2, 0.13, 0.08), False, 40)
    for r, (cy, cs) in enumerate(((0.675, 26), (0.745, 34), (0.83, 44), (0.935, 58))):
        n = int(W / (cs * 1.9 * k)) + 1
        for i in range(n):
            x = (i + 0.5 + (0.35 if r % 2 else 0)) * W / n
            c.rect(x - cs * 0.55 * k, H * cy + cs * 0.25 * k, x + cs * 0.55 * k, H * cy + cs * 1.05 * k, (0.12, 0.09, 0.07), 0.03)         # chair back
            c.rect(x - cs * 0.5 * k, H * cy + cs * 1.05 * k, x + cs * 0.5 * k, H * cy + cs * 1.18 * k, (0.2, 0.15, 0.1), 0.03)
    c.crowd(H * 0.64, H * 0.9, 4, 30, (0.17, 0.12, 0.09), ctx.seed, (0.95, 0.7, 0.4), 0.13, 0.05, 0.85)
    # smoke / haze in the light, then the grade
    c.haze((0.6, 0.5, 0.35), 0.2, 0.0, 0.7)
    c.dust(120, (1.0, 0.85, 0.6), 0.5, area=(W * 0.2, H * 0.1, W * 0.8, H * 0.6))
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(7)
def p07(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.045, 0.035, 0.03), (0.09, 0.065, 0.05), 0, H)
    c.planks(c.mask_rect(0, 0, W, H * 0.55) * 0.55, (0.13, 0.09, 0.06), True, 62)
    # the TV, glowing with a blurred anchor and a lower third
    tx0, tx1, ty0, ty1 = W * 0.2, W * 0.8, H * 0.02, H * 0.46
    c.rect(tx0 - 14 * k, ty0 - 10 * k, tx1 + 14 * k, ty1 + 12 * k, (0.03, 0.028, 0.03), 0.02)
    c.rect(tx0, ty0, tx1, ty1, (0.42, 0.40, 0.36), 0.04)
    c.gradient((0.55, 0.52, 0.46), (0.30, 0.28, 0.26), ty0, ty1, mask=c.mask_rect(tx0, ty0, tx1, ty1))
    ax, ay = W * 0.5, ty0 + (ty1 - ty0) * 0.38                                                              # out-of-focus anchor (Adrian)
    c.ellipse(ax, ay - 8 * k, 34 * k, 42 * k, (0.78, 0.66, 0.5), 0.0, 1.0, 9)
    c.ellipse(ax, ay - 36 * k, 38 * k, 24 * k, (0.78, 0.62, 0.3), 0.0, 1.0, 9)                              # blond hair
    c.poly([(ax - 80 * k, ty1 - 52 * k), (ax - 60 * k, ay + 40 * k), (ax + 60 * k, ay + 40 * k), (ax + 80 * k, ty1 - 52 * k)], (0.14, 0.17, 0.30), 0.0, blur=7)
    c.rect(tx0, ty1 - 56 * k, tx1, ty1, (0.08, 0.1, 0.18), 0.0)
    c.rect(tx0, ty1 - 56 * k, tx0 + 90 * k, ty1, (0.65, 0.12, 0.1), 0.0)
    c.text(tx0 + 45 * k, ty1 - 28 * k, "LIVE", 22, (0.95, 0.9, 0.85))
    c.rect(tx0 + 90 * k, ty1 - 56 * k, tx1, ty1, (0.9, 0.84, 0.7), 0.0)
    c.text((tx0 + 90 * k + tx1) / 2, ty1 - 38 * k, "LEGEND ADRIAN COLE", 20, (0.08, 0.06, 0.05))
    c.text((tx0 + 90 * k + tx1) / 2, ty1 - 14 * k, "HOSPITALIZED IN TAMPA", 17, (0.08, 0.06, 0.05), bold=False)
    for i in range(0, int(ty1 - ty0), 4):                                                                    # scan lines
        c.rect(tx0, ty0 + i, tx1, ty0 + i + 1, (0.0, 0.0, 0.0), 0.0, 0.10)
    c.glow(W * 0.5, H * 0.24, 480 * k, (0.5, 0.55, 0.65), 0.55)
    # bottle shelf with warm back light
    c.rect(0, H * 0.465, W, H * 0.49, (0.18, 0.12, 0.08), 0.04)
    rng = np.random.default_rng(ctx.seed + 7)
    for i in range(14):
        bx = W * (0.03 + 0.07 * i) + rng.uniform(-6, 6) * k
        bh = rng.uniform(34, 52) * k
        col = [(0.35, 0.18, 0.08), (0.12, 0.22, 0.12), (0.4, 0.3, 0.12), (0.18, 0.1, 0.1)][int(rng.integers(4))]
        c.rect(bx - 8 * k, H * 0.465 - bh, bx + 8 * k, H * 0.465, col, 0.03)
        c.rect(bx - 3 * k, H * 0.465 - bh - 12 * k, bx + 3 * k, H * 0.465 - bh, col, 0.03)
        c.rect(bx - 5 * k, H * 0.465 - bh * 0.7, bx - 2 * k, H * 0.465 - bh * 0.15, (0.9, 0.75, 0.5), 0.0, 0.5)
    # the bar top
    c.rect(0, H * 0.55, W, H * 0.60, (0.28, 0.17, 0.10), 0.06)
    c.rect(0, H * 0.58, W, H * 0.60, (0.1, 0.07, 0.05), 0.04)
    c.gradient((0.1, 0.07, 0.05), (0.04, 0.03, 0.025), H * 0.60, H, mask=c.mask_rect(0, H * 0.6, W, H))
    c.glow(W * 0.5, H * 0.56, 330 * k, (0.5, 0.5, 0.55), 0.35)
    # the man at the bar, seen from behind, lit by the screen: head, thinning hair, collar, shoulders
    mx = W * 0.5
    c.poly([(mx - 230 * k, H), (mx - 200 * k, H * 0.84), (mx - 130 * k, H * 0.76), (mx - 56 * k, H * 0.72), (mx + 56 * k, H * 0.72), (mx + 130 * k, H * 0.76), (mx + 200 * k, H * 0.84), (mx + 230 * k, H)],
           (0.07, 0.06, 0.06), 0.03)
    c.rim(c.mask_poly([(mx - 230 * k, H), (mx - 200 * k, H * 0.84), (mx - 130 * k, H * 0.76), (mx - 56 * k, H * 0.72), (mx + 56 * k, H * 0.72), (mx + 130 * k, H * 0.76), (mx + 200 * k, H * 0.84), (mx + 230 * k, H)]),
          (0.7, 0.75, 0.85), 3, (0, -1), 0.65)
    c.rect(mx - 30 * k, H * 0.64, mx + 30 * k, H * 0.74, (0.34, 0.26, 0.2), 0.05)                           # neck
    hm = c.mask_ellipse(mx, H * 0.585, 56 * k, 70 * k, blur=0.6)
    c.fill(hm, (0.30, 0.23, 0.18), 0.04)
    c.fill(c.mask_ellipse(mx, H * 0.56, 54 * k, 52 * k, blur=0.6), (0.06, 0.05, 0.05), 0.05)               # hair
    c.fill(c.mask_ellipse(mx - 50 * k, H * 0.60, 9 * k, 15 * k), (0.28, 0.21, 0.17), 0.0)
    c.fill(c.mask_ellipse(mx + 50 * k, H * 0.60, 9 * k, 15 * k), (0.28, 0.21, 0.17), 0.0)
    c.rim(hm, (0.7, 0.75, 0.9), 4, (0, -1), 0.9)
    for sx in (-34, 0, 34):                                                                                    # grey strands at the crown
        c.line([(mx + sx * k, H * 0.53), (mx + sx * 1.1 * k, H * 0.575)], (0.45, 0.43, 0.42), 1.5, 0.5)
    # a mug and a napkin on the bar
    c.ellipse(mx + 95 * k, H * 0.585, 36 * k, 8 * k, (0.12, 0.09, 0.07), 0.0)
    c.rect(mx + 60 * k, H * 0.53, mx + 130 * k, H * 0.585, (0.82, 0.76, 0.62), 0.04)
    c.rect(mx + 128 * k, H * 0.545, mx + 146 * k, H * 0.57, (0.82, 0.76, 0.62), 0.0)
    c.ellipse(mx + 95 * k, H * 0.53, 35 * k, 8 * k, (0.2, 0.1, 0.05), 0.0)
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.3)


@panel(8)
def p08(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.1, 0.075, 0.055), (0.05, 0.04, 0.03), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H) * 0.4, (0.16, 0.12, 0.09))
    # a cap and the back of a head, a work jacket, a bowl of soup and a spoon
    cx = W * 0.4
    c.poly([(0, H), (W * 0.06, H * 0.6), (W * 0.24, H * 0.5), (W * 0.58, H * 0.5), (W * 0.78, H * 0.62), (W * 0.86, H)], (0.2, 0.22, 0.17), 0.06)
    c.fill(c.mask_ellipse(cx, H * 0.33, W * 0.19, H * 0.22, blur=1), (0.06, 0.05, 0.05), 0.04)                 # head in shadow
    c.fill(c.mask_ellipse(cx, H * 0.16, W * 0.21, H * 0.10, blur=1), (0.28, 0.30, 0.22), 0.06)                # cap crown
    c.poly([(cx - W * 0.2, H * 0.2), (cx + W * 0.3, H * 0.2), (cx + W * 0.34, H * 0.235), (cx - W * 0.18, H * 0.235)], (0.2, 0.22, 0.16), 0.05)  # brim
    c.rim(c.mask_ellipse(cx, H * 0.16, W * 0.21, H * 0.10), (0.9, 0.7, 0.4), 4, (-1, -1), 0.8)
    c.multiply(c.mask_ellipse(cx, H * 0.34, W * 0.2, H * 0.26, blur=10), (0.6, 0.55, 0.55), 0.5)
    bx, by = W * 0.78, H * 0.80
    c.poly([(bx - W * 0.2, by - H * 0.1), (bx + W * 0.2, by - H * 0.18), (bx + W * 0.22, by + H * 0.1), (bx - W * 0.18, by + H * 0.16)], (0.85, 0.8, 0.68), 0.05)     # paper bowl
    c.ellipse(bx, by - H * 0.04, W * 0.17, H * 0.075, (0.74, 0.52, 0.2), 0.08)
    c.ellipse(bx, by - H * 0.045, W * 0.15, H * 0.062, (0.85, 0.65, 0.3), 0.1)
    c.line([(bx - W * 0.1, by - H * 0.2), (bx + W * 0.05, by - H * 0.03)], (0.75, 0.62, 0.4), 6, 1.0)
    for i in range(3):                                                                                        # steam
        sx = bx - W * 0.08 + i * W * 0.08
        c.ellipse(sx, by - H * 0.2 - i * H * 0.02, 22 * k, 40 * k, (0.8, 0.75, 0.65), 0.0, 0.14, 14)
    c.glow(bx, by - H * 0.06, 150 * k, WARM, 0.5)
    c.dust(40, (1, 0.85, 0.6), 0.4)
    c.vignette(0.6)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(9)
def p09(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.5, 0.38, 0.24), (0.33, 0.24, 0.15), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H) * 0.25, (0.5, 0.4, 0.28))
    c.rect(0, H * 0.78, W, H, (0.2, 0.14, 0.1), 0.06)                                                         # skirting + floor
    c.planks(c.mask_rect(0, H * 0.82, W, H) * 0.7, (0.24, 0.16, 0.1), False, 38)
    x0, x1, y0, y1 = W * 0.30, W * 0.70, H * 0.07, H * 0.90
    c.rect(x0 - 16 * k, y0 - 14 * k, x1 + 16 * k, y1 + 4 * k, (0.2, 0.14, 0.09), 0.05)                         # frame
    c.rect(x0, y0, x1, y1, (0.62, 0.45, 0.28), 0.07)
    c.planks(c.mask_rect(x0, y0, x1, y1) * 0.35, (0.55, 0.38, 0.22), True, 48)
    c.rect(x0 + 18 * k, y0 + 24 * k, x1 - 18 * k, y0 + (y1 - y0) * 0.44, (0.55, 0.39, 0.23), 0.06)              # panels
    c.rect(x0 + 18 * k, y0 + (y1 - y0) * 0.50, x1 - 18 * k, y1 - 24 * k, (0.55, 0.39, 0.23), 0.06)
    for yy in (y0 + 24 * k, y0 + (y1 - y0) * 0.50):
        c.line([(x0 + 18 * k, yy), (x1 - 18 * k, yy)], (0.3, 0.2, 0.12), 3, 0.7)
    c.rect(x0, y1 - 90 * k, x1, y1, (0.5, 0.4, 0.3), 0.04)                                                    # kick plate, scuffed
    for i in range(14):
        sx = x0 + 10 * k + (i * 37 % 100) / 100 * (x1 - x0 - 20 * k)
        c.line([(sx, y1 - 80 * k + (i * 19 % 60) * k), (sx + 24 * k, y1 - 60 * k + (i * 13 % 50) * k)], (0.3, 0.24, 0.16), 1.5, 0.6)
    c.ellipse(x1 - 36 * k, H * 0.55, 15 * k, 22 * k, (0.35, 0.22, 0.12), 0.0)                                  # knob
    c.rim(c.mask_ellipse(x1 - 36 * k, H * 0.55, 15 * k, 22 * k), (1, 0.85, 0.6), 2, (-1, -1), 0.9)
    # the paper sign, taped crookedly
    sx0, sx1, sy0, sy1 = W * 0.37, W * 0.63, H * 0.19, H * 0.36
    sign = [(sx0, sy0 + 10 * k), (sx1, sy0), (sx1 + 6 * k, sy1 - 8 * k), (sx0 + 4 * k, sy1)]
    c.shadow_of(c.mask_poly(sign), 6, 8, 6, 0.55)
    c.poly(sign, (0.92, 0.88, 0.78), 0.04)
    c.text((sx0 + sx1) / 2 + 3 * k, (sy0 + sy1) / 2 + 2 * k, "TALENT", 46, (0.07, 0.05, 0.04), angle=-2.5)
    for tx, ty in ((sx0 + 4 * k, sy0 + 12 * k), (sx1 - 2 * k, sy0 + 4 * k)):                                  # tape
        c.poly([(tx - 20 * k, ty - 8 * k), (tx + 22 * k, ty - 14 * k), (tx + 24 * k, ty + 4 * k), (tx - 18 * k, ty + 10 * k)], (0.85, 0.78, 0.55), 0.0, 0.7)
    c.cone_light((W * 0.5, 0), 90, 30, H * 1.1, (1.0, 0.8, 0.5), 0.25)
    c.vignette(0.6)
    return finish_sepia(c.a, ctx.seed, keep=0.18)
