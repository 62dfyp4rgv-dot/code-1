"""Panels 10-22: the dressing room, the curtain, the walk to the ring."""
from __future__ import annotations

import math

import numpy as np

from .body import hand_builder
from .cast import make
from .grade import finish_sepia
from .poses import pose
from .r3d import _blur, fnoise
from .registry import panel
from .stage import Stage
from .world import Canvas

WARM = (1.0, 0.78, 0.45)


def _room_bulb(c: Canvas, bx: float, by: float, strength: float = 1.0) -> None:
    k = c.k
    c.rect(bx - 2 * k, 0, bx + 2 * k, by - 10 * k, (0.05, 0.045, 0.04), 0.0)
    c.ellipse(bx, by, 11 * k, 14 * k, (1.0, 0.95, 0.75), 0.0)
    c.glow(bx, by, 200 * k, (1.0, 0.85, 0.55), 0.9 * strength)
    c.cone_light((bx, by), 90, 36, c.H * 1.15, (1.0, 0.82, 0.5), 0.55 * strength)


@panel(10)
def p10(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.05, 0.04, 0.035), (0.14, 0.1, 0.07), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H * 0.72), (0.2, 0.16, 0.12))                                              # cinder-block wall
    for j in range(0, 14):
        c.line([(0, H * 0.05 * j), (W, H * 0.05 * j)], (0.06, 0.05, 0.045), 2, 0.5)
    for i in range(0, 12):
        for j in range(14):
            if (i + j) % 2 == 0:
                x = i * W / 6 + (W / 12 if j % 2 else 0)
                c.line([(x, H * 0.05 * j), (x, H * 0.05 * (j + 1))], (0.06, 0.05, 0.045), 2, 0.5)
    c.gradient((0.12, 0.09, 0.065), (0.05, 0.04, 0.035), H * 0.72, H)
    c.concrete(c.mask_rect(0, H * 0.72, W, H) * 0.6, (0.14, 0.11, 0.09))
    # shelves with cans and bottles, a bucket and a mop, a gear bag
    for sy, n in ((0.12, 7), (0.27, 5)):
        c.rect(W * 0.72, H * sy + 38 * k, W * 0.98, H * sy + 46 * k, (0.2, 0.14, 0.1), 0.04)
        for i in range(n):
            bx = W * (0.745 + 0.034 * i)
            c.rect(bx - 9 * k, H * sy, bx + 9 * k, H * sy + 38 * k, (0.5, 0.42, 0.3), 0.05)
            c.rect(bx - 9 * k, H * sy + 8 * k, bx + 9 * k, H * sy + 16 * k, (0.5, 0.18, 0.12), 0.0)
    c.rect(W * 0.10, H * 0.70, W * 0.24, H * 0.84, (0.34, 0.27, 0.2), 0.05)                                    # bucket
    c.ellipse(W * 0.17, H * 0.70, W * 0.07, 9 * k, (0.12, 0.09, 0.07), 0.0)
    c.line([(W * 0.15, H * 0.70), (W * 0.19, H * 0.58)], (0.36, 0.28, 0.2), 8, 1.0)
    c.poly([(W * 0.17, H * 0.58), (W * 0.2, H * 0.56), (W * 0.22, H * 0.6), (W * 0.18, H * 0.62)], (0.55, 0.5, 0.4), 0.06)
    c.poly([(W * 0.84, H * 0.86), (W * 0.92, H * 0.80), (W * 0.99, H * 0.85), (W * 0.97, H * 0.92), (W * 0.86, H * 0.94)], (0.14, 0.11, 0.09), 0.05)   # gear bag
    # the crate and Tommy sitting on it, taping his wrist
    cx = W * 0.5
    c.rect(cx - 95 * k, H * 0.80, cx + 95 * k, H * 0.93, (0.45, 0.33, 0.2), 0.07)
    c.planks(c.mask_rect(cx - 95 * k, H * 0.80, cx + 95 * k, H * 0.93) * 0.8, (0.42, 0.3, 0.18), False, 22)
    c.rect(cx - 95 * k, H * 0.795, cx + 95 * k, H * 0.815, (0.55, 0.42, 0.28), 0.05)
    _room_bulb(c, cx, H * 0.09)
    st = Stage(W, H, c.a, ctx.seed, res=0.55)
    h = 54 * k * 1.55
    fig = make("tommy", h)
    pose(fig, (cx, H * 0.775), spine=14, twist=18, head_off=(0.18, 0.22), arms=((18, -38), (24, -50)), legs=((22, -16), (24, -6)),
         arm_z=((0.2, 0.7), (0.2, 0.8)), leg_z=((0.9, 0.2), (0.9, 0.1)), z=0)
    fig.spec.outfit = "tights"
    st.figure(fig, yaw=0.35, pitch=0.35, roll=0.1, hand_fn=hand_builder(h, fig.spec.skin, (0.6, 0.5, 0.5, 0.5, 0.5)))
    rgb = st.render(light=(0.1, -0.9, 0.5), ambient=0.12, key_color=(1.0, 0.88, 0.62), rim=0.25, shadow_on_bg=0.5, ink_scale=1.0)
    c.a = rgb
    c.dust(120, (1, 0.85, 0.55), 0.55, area=(W * 0.25, H * 0.1, W * 0.75, H * 0.75))
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


def _forearm(st: Stage, p0, p1, r0, r1, skin):
    def f(sd):
        sd.cone(tuple(p0), tuple(p1), r0, r1, 20 * 1.0, False, skin, "skin", 0.0, 6.0, 1, 0)
    return f


def _hands_scene(ctx, stage_n: int):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.38, 0.27, 0.17), (0.17, 0.115, 0.075), 0, H)
    c.planks(c.mask_rect(0, 0, W, H) * 0.3, (0.3, 0.2, 0.12), False, 60)
    c.glow(W * 0.5, H * 0.2, 500 * k, (1.0, 0.8, 0.5), 0.5)
    skin = (0.70, 0.58, 0.49)
    st = Stage(W, H, c.a, ctx.seed, res=0.6)
    hs = hand_builder(88 * k, skin, (0.9, 0.95, 0.95, 0.95, 0.95))

    def build(sd):
        sk = skin
        # left forearm (wrapped in tape) with a fist; right hand holds the roll and the loose end
        sd.cone((W * -0.05, H * 1.0, 0), (W * 0.28, H * 0.52, 20), 62 * k, 44 * k, 30 * k, False, sk, "skin", 0.0, 6.0, 1, 0)
        sd.cone((W * 1.05, H * 1.0, 0), (W * 0.70, H * 0.56, 20), 62 * k, 44 * k, 30 * k, False, sk, "skin", 0.0, 6.0, 1, 0)
        n = {11: 3, 12: 4, 13: 5}[stage_n]
        for i in range(n):                                                                                          # tape wraps up the left wrist
            t = 0.55 + i * 0.12
            ctr = np.array([W * (-0.05 + 0.33 * t), H * (1.0 - 0.48 * t), 20 * t], np.float32)
            sd.ellipsoid(tuple(ctr), (50 * k, 20 * k, 50 * k), (0, 0, -0.9), 6 * k, False, (0.9, 0.88, 0.8), "tape", 0.0, 3.0, 1, 2)
        # the fist
        sd.ellipsoid((W * 0.34, H * 0.42, 40), (78 * k, 62 * k, 58 * k), (0, 0, -0.5), 20 * k, False, sk, "skin", 0.0, 6.0, 1, 0)
        for j in range(4):
            sd.ellipsoid((W * 0.37 + j * 24 * k, H * 0.33 + j * 6 * k, 66), (22 * k, 19 * k, 26 * k), (0, 0, 0), 8 * k, False, sk, "skin", 0.0, 4.0, 1, 0)
        # the roll of tape in the right hand
        rc = np.array([W * 0.60, H * 0.46, 50], np.float32)
        sd.ellipsoid(tuple(rc), (62 * k, 62 * k, 26 * k), (0, 0.3, 0), 5 * k, False, (0.9, 0.87, 0.78), "tape", 0.0, 3.0, 1, 2)
        sd.ellipsoid(tuple(rc + np.array([6 * k, 0, 24 * k], np.float32)), (34 * k, 34 * k, 8 * k), (0, 0.3, 0), 2 * k, True, sk, "skin", 0.0, 3.0, 1, 0)
        sd.ellipsoid((W * 0.68, H * 0.52, 60), (50 * k, 36 * k, 36 * k), (0, 0, 0.5), 14 * k, False, sk, "skin", 0.0, 6.0, 1, 0)       # right palm
        for j in range(3):
            sd.cone((W * 0.62 - j * 8 * k, H * 0.50 - j * 18 * k, 78), (W * 0.54 - j * 6 * k, H * 0.44 - j * 20 * k, 90), 12 * k, 10 * k, 4 * k, False, sk, "skin", 0.0, 4.0, 1, 0)

    st.sdf(build, (0, 0, W, H), (-100, 200))
    rgb = st.render(light=(-0.4, -0.7, 0.55), ambient=0.18, key_color=(1.0, 0.9, 0.68), rim=0.2, shadow_on_bg=0.5)
    c.a = rgb
    if stage_n == 12:                                                                                              # scissors, mid-cut
        sx, sy = W * 0.56, H * 0.30
        c.line([(sx - 55 * k, sy + 38 * k), (sx + 30 * k, sy - 20 * k)], (0.75, 0.75, 0.78), 8, 1.0)
        c.line([(sx - 50 * k, sy - 30 * k), (sx + 32 * k, sy + 10 * k)], (0.7, 0.7, 0.74), 8, 1.0)
        c.ellipse(sx - 64 * k, sy + 44 * k, 18 * k, 18 * k, (0.12, 0.09, 0.08), 0.0)
        c.ellipse(sx - 62 * k, sy - 38 * k, 18 * k, 18 * k, (0.12, 0.09, 0.08), 0.0)
    c.dust(60, (1, 0.85, 0.6), 0.5)
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(11)
def p11(ctx):
    return _hands_scene(ctx, 11)


@panel(12)
def p12(ctx):
    return _hands_scene(ctx, 12)


@panel(13)
def p13(ctx):
    return _hands_scene(ctx, 13)


@panel(14)
def p14(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.04, 0.03, 0.025), (0.1, 0.07, 0.05), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H) * 0.6, (0.16, 0.12, 0.09))
    # a bright doorway behind the promoter
    dx0, dx1, dy0 = W * 0.30, W * 0.56, H * 0.04
    c.rect(dx0 - 12 * k, dy0 - 10 * k, dx1 + 12 * k, H, (0.07, 0.055, 0.045), 0.03)
    c.rect(dx0, dy0, dx1, H * 0.92, (0.95, 0.85, 0.64), 0.04)
    c.poly([(dx0, H * 0.92), (dx1, H * 0.92), (dx1 + W * 0.22, H), (dx0 - W * 0.05, H)], (0.9, 0.78, 0.55), 0.04)   # light spilling on the floor
    c.glow((dx0 + dx1) / 2, H * 0.4, 520 * k, (1.0, 0.85, 0.55), 0.55)
    # a lamp in the foreground corner (silhouette)
    c.ellipse(W * 0.12, H * 0.72, 90 * k, 58 * k, (0.03, 0.025, 0.025), 0.0)
    c.rect(W * 0.12 - 3 * k, H * 0.72, W * 0.12 + 3 * k, H * 0.9, (0.03, 0.025, 0.025), 0.0)
    st = Stage(W, H, c.a, ctx.seed, res=0.5)
    h = 50 * k * 1.5
    fig = make("promoter", h)
    fig.spec.outfit = "none"
    pose(fig, (W * 0.43, H * 0.46), spine=-2, twist=-14, head_off=(0.0, 0.05), arms=((-14, -20), (22, -60)), legs=((3, -2), (4, -1)), arm_z=((0, 0.3), (0.2, 0.6)))
    st.figure(fig, yaw=-0.25, pitch=0.1, hand_fn=hand_builder(h, fig.spec.skin, (0.3, 0.4, 0.4, 0.8, 0.8)))
    rgb = st.render(light=(0.6, -0.2, -0.4), ambient=0.06, key_color=(1.0, 0.9, 0.7), rim=0.9, rim_color=(1.0, 0.85, 0.55), shadow_on_bg=0.2)
    c.a = rgb
    # the card with RYU on it, held out
    cx, cy = W * 0.62, H * 0.55
    c.poly([(cx - 40 * k, cy - 24 * k), (cx + 38 * k, cy - 34 * k), (cx + 44 * k, cy + 14 * k), (cx - 34 * k, cy + 24 * k)], (0.9, 0.86, 0.74), 0.04)
    c.text(cx + 3 * k, cy - 4 * k, "RYU", 22, (0.07, 0.05, 0.04), angle=-8)
    c.vignette(0.6)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(15)
def p15(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.1, 0.07, 0.05), (0.06, 0.045, 0.035), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H) * 0.4, (0.2, 0.15, 0.1))
    c.glow(W * 0.3, H * 0.2, 450 * k, (1.0, 0.8, 0.5), 0.6)
    st = Stage(W, H, c.a, ctx.seed, res=0.65)
    h = 380 * k * 0.95
    hd = make("tommy", h).head
    hd.s.lid = 0.45
    st.head(hd.s, (W * 0.55, H * 0.46, 0), h, yaw=-0.22, pitch=0.04, roll=-0.05, neck_to=(W * 0.55, H * 1.02, -30))
    # shoulder / arm in the lower frame holding an envelope
    def build(sd):
        sd.cone((W * 0.12, H * 1.05, 0), (W * 0.33, H * 0.84, 40), 62 * k, 40 * k, 20 * k, False, hd.s.skin, "skin", 0.0, 6.0, 1, 0)
        sd.cone((W * 0.95, H * 1.1, -20), (W * 0.78, H * 0.86, -20), 120 * k, 120 * k, 30 * k, False, (0.12, 0.1, 0.1), "cloth", 0.0, 6.0, 1, 1)
        sd.cone((W * 0.2, H * 1.1, -20), (W * 0.42, H * 0.9, -30), 130 * k, 130 * k, 30 * k, False, (0.12, 0.1, 0.1), "cloth", 0.0, 6.0, 1, 1)
    st.sdf(build, (0, H * 0.5, W, H), (-120, 160))
    rgb = st.render(light=(-0.6, -0.4, 0.5), ambient=0.1, key_color=(1.0, 0.88, 0.65), rim=0.4, shadow_on_bg=0.4)
    c.a = rgb
    # the envelope in his hand
    ex, ey = W * 0.23, H * 0.84
    env = [(ex - 90 * k, ey - 24 * k), (ex + 70 * k, ey - 56 * k), (ex + 92 * k, ey + 54 * k), (ex - 70 * k, ey + 78 * k)]
    c.shadow_of(c.mask_poly(env), 8, 10, 8, 0.5)
    c.poly(env, (0.92, 0.88, 0.76), 0.03)
    c.poly([env[0], env[1], ((env[0][0] + env[1][0]) / 2 + 12 * k, (env[0][1] + env[1][1]) / 2 + 52 * k)], (0.82, 0.77, 0.64), 0.03)
    c.line([env[0], ((env[0][0] + env[1][0]) / 2 + 12 * k, (env[0][1] + env[1][1]) / 2 + 52 * k), env[1]], (0.4, 0.33, 0.25), 2, 0.8)
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(16)
def p16(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.03, 0.025, 0.02), (0.1, 0.075, 0.055), 0, H)
    c.concrete(c.mask_rect(0, H * 0.78, W, H), (0.17, 0.13, 0.1))
    _room_bulb(c, W * 0.5, H * 0.03, 1.1)
    cx = W * 0.56
    c.rect(cx - 70 * k, H * 0.80, cx + 70 * k, H * 0.93, (0.45, 0.33, 0.2), 0.07)
    c.rect(cx - 70 * k, H * 0.795, cx + 70 * k, H * 0.815, (0.58, 0.44, 0.3), 0.05)
    st = Stage(W, H, c.a, ctx.seed, res=0.55)
    h = 40 * k * 1.55
    fig = make("tommy", h)
    pose(fig, (cx, H * 0.77), spine=22, twist=10, head_off=(0.14, 0.25), arms=((10, -10), (26, -35)), legs=((22, -10), (20, -8)), arm_z=((0.3, 0.6), (0.5, 0.9)), leg_z=((0.8, 0.1), (0.8, 0.0)))
    st.figure(fig, yaw=0.3, pitch=0.4, roll=0.1, hand_fn=hand_builder(h, fig.spec.skin, (0.6, 0.5, 0.5, 0.5, 0.5)))
    rgb = st.render(light=(0.0, -0.95, 0.4), ambient=0.1, key_color=(1.0, 0.88, 0.62), rim=0.3, shadow_on_bg=0.6)
    c.a = rgb
    c.dust(80, (1, 0.85, 0.55), 0.5, area=(W * 0.3, H * 0.1, W * 0.7, H * 0.8))
    c.vignette(0.6)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(17)
def p17(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.1, 0.075, 0.055), (0.05, 0.04, 0.03), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H) * 0.5, (0.16, 0.12, 0.09))
    fx0, fx1, fy0, fy1 = W * 0.12, W * 0.88, H * 0.1, H * 0.9
    c.rect(fx0 - 14 * k, fy0 - 14 * k, fx1 + 14 * k, fy1 + 14 * k, (0.04, 0.035, 0.03), 0.03)
    c.rect(fx0, fy0, fx1, fy1, (0.46, 0.32, 0.22), 0.06)
    c.gradient((0.55, 0.38, 0.26), (0.3, 0.2, 0.14), fy0, fy1, mask=c.mask_rect(fx0, fy0, fx1, fy1))
    c.text(fx0 + 40 * k, fy0 + 36 * k, "TCW", 24, (0.85, 0.75, 0.6), anchor="lm")
    c.text(fx1 - 18 * k, fy1 - 24 * k, "2007", 20, (0.85, 0.75, 0.6), anchor="rm")
    c.rect(fx0 - 22 * k, fy0 - 12 * k, fx0 + 52 * k, fy0 + 14 * k, (0.78, 0.7, 0.5), 0.0, 0.8)
    c.rect(fx1 - 52 * k, fy1 - 6 * k, fx1 + 22 * k, fy1 + 20 * k, (0.78, 0.7, 0.5), 0.0, 0.8)
    st = Stage(W, H, c.a, ctx.seed, res=0.5)
    h = 36 * k * 1.9
    fig = make("tommy", h)
    fig.head.s.age = 0.2
    fig.head.s.gray = 0.0
    fig.head.s.hair_style = "short"
    fig.head.s.lid = 0.4
    fig.spec.belly = 0.05
    fig.spec.muscle = 0.55
    pose(fig, (W * 0.5, H * 0.56), spine=0, twist=0, arms=((34, -18), (34, -18)), legs=((9, 0), (9, 0)), arm_z=((0.3, 0.5), (0.3, 0.5)))
    st.figure(fig, yaw=0.0, hand_fn=hand_builder(h, fig.spec.skin, (0.9, 0.95, 0.95, 0.95, 0.95)))
    rgb = st.render(light=(-0.4, -0.5, 0.7), ambient=0.2, key_color=(1.0, 0.88, 0.65), shadow_on_bg=0.4)
    c.a = rgb
    # glare across the glass
    c.poly([(fx0, fy0), (fx0 + 160 * k, fy0), (fx0 + 40 * k, fy1), (fx0, fy1)], (1, 0.95, 0.85), 0.0, 0.07)
    c.poly([(fx0 + 200 * k, fy0), (fx0 + 240 * k, fy0), (fx0 + 130 * k, fy1), (fx0 + 90 * k, fy1)], (1, 0.95, 0.85), 0.0, 0.05)
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(18)
def p18(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.04, 0.032, 0.028), (0.08, 0.06, 0.045), 0, H)
    # a black pipe-and-drape curtain, a bright seam where it parts, a taped hand pushing through
    mask = c.mask_rect(W * 0.12, H * 0.07, W * 0.88, H)
    c.folds(mask, (0.02, 0.018, 0.018), 15, (0.45, 0.35, 0.25), 0.55)
    gx = W * 0.5
    c.poly([(gx - 5 * k, H * 0.07), (gx + 7 * k, H * 0.07), (gx + 12 * k, H), (gx - 9 * k, H)], (1.0, 0.92, 0.7), 0.0)
    c.glow(gx, H * 0.5, 280 * k, (1.0, 0.85, 0.55), 0.7)
    c.rect(W * 0.1, H * 0.055, W * 0.9, H * 0.075, (0.12, 0.1, 0.09), 0.04)                                       # rod
    for i in range(10):
        x = W * (0.14 + 0.082 * i)
        c.ellipse(x, H * 0.065, 11 * k, 11 * k, (0.3, 0.25, 0.2), 0.0)
        c.ellipse(x, H * 0.065, 4 * k, 4 * k, (0.08, 0.07, 0.06), 0.0)
    st = Stage(W, H, c.a, ctx.seed, res=0.6)
    hs = hand_builder(86 * k, (0.70, 0.58, 0.49), (0.5, 0.4, 0.4, 0.45, 0.5))

    def build(sd):
        sd.cone((W * 1.05, H * 0.82, 40), (W * 0.60, H * 0.62, 70), 52 * k, 40 * k, 20 * k, False, (0.70, 0.58, 0.49), "skin", 0.0, 6.0, 1, 0)
        sd.cone((W * 0.78, H * 0.72, 55), (W * 0.62, H * 0.64, 70), 45 * k, 41 * k, 8 * k, False, (0.9, 0.88, 0.8), "tape", 0.0, 3.0, 1, 3)
        sd.ellipsoid((W * 0.54, H * 0.60, 82), (56 * k, 40 * k, 38 * k), (0, 0, 0.3), 12 * k, False, (0.70, 0.58, 0.49), "skin", 0.0, 6.0, 1, 0)
        for j in range(4):
            sd.cone((W * 0.50 - j * 4 * k, H * 0.57 + j * 16 * k, 88), (W * 0.43 - j * 6 * k, H * 0.56 + j * 18 * k, 94), 12 * k, 10 * k, 4 * k, False, (0.70, 0.58, 0.49), "skin", 0.0, 4.0, 1, 0)
        sd.cone((W * 0.52, H * 0.66, 88), (W * 0.46, H * 0.70, 96), 14 * k, 11 * k, 4 * k, False, (0.70, 0.58, 0.49), "skin", 0.0, 4.0, 1, 0)
    st.sdf(build, (0, 0, W, H), (-100, 200))
    rgb = st.render(light=(-0.9, -0.1, 0.4), ambient=0.1, key_color=(1.0, 0.9, 0.7), rim=0.6, shadow_on_bg=0.35)
    c.a = rgb
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(19)
def p19(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.015, 0.012, 0.012), (0.04, 0.03, 0.025), 0, H)
    # a gap in the curtain: a lit slice of the hall with numbered tables and a crowd
    gx0, gx1 = W * 0.30, W * 0.70
    c.rect(gx0, H * 0.08, gx1, H * 0.92, (0.35, 0.26, 0.17), 0.05)
    c.gradient((0.45, 0.34, 0.22), (0.17, 0.12, 0.08), H * 0.08, H * 0.92, mask=c.mask_rect(gx0, H * 0.08, gx1, H * 0.92))
    for fx in (0.36, 0.64):
        for fy in (0.12, 0.16):
            c.rect(W * fx - 50 * k, H * fy, W * fx + 50 * k, H * fy + 8 * k, (1, 0.95, 0.8), 0.0)
        c.glow(W * fx, H * 0.14, 150 * k, (0.9, 0.8, 0.55), 0.5)
    c.rect(gx0, H * 0.60, gx1, H * 0.92, (0.14, 0.1, 0.07), 0.05)                                                  # floor
    for ti, (tx, ty, lbl) in enumerate([(0.34, 0.45, "4"), (0.5, 0.45, "5"), (0.66, 0.45, "6"), (0.37, 0.58, "11"), (0.5, 0.58, "12"), (0.63, 0.58, "13"),
                                         (0.35, 0.72, "21"), (0.5, 0.72, "22"), (0.65, 0.72, "23")]):
        s = (0.6 + 0.9 * (ty - 0.4)) * k
        c.rect(W * tx - 40 * s, H * ty, W * tx + 40 * s, H * ty + 6 * s, (0.45, 0.35, 0.24), 0.0)
        c.rect(W * tx - 11 * s, H * ty - 26 * s, W * tx + 11 * s, H * ty - 6 * s, (0.93, 0.88, 0.72), 0.0)
        c.text(W * tx, H * ty - 16 * s, lbl, 11 * s / k, (0.1, 0.08, 0.06))
        c.crowd(H * ty + 12 * s, H * ty + 12 * s, 1, 26 * s / k, (0.18, 0.13, 0.1), 5 + ti, (0.95, 0.7, 0.4), 0.2, 0.0, 0.5, W * tx - 60 * s, W * tx + 60 * s, 0.7)
    c.haze((0.7, 0.55, 0.35), 0.18, 0.1, 0.9)
    # dark curtain edges
    c.multiply(c.mask_rect(0, 0, W * 0.3, H), (0.03, 0.03, 0.03), 1.0)
    c.multiply(c.mask_rect(W * 0.7, 0, W, H), (0.03, 0.03, 0.03), 1.0)
    c.folds(c.mask_rect(0, 0, gx0, H), (0.02, 0.018, 0.018), 4, (0.25, 0.2, 0.15), 0.35)
    c.folds(c.mask_rect(gx1, 0, W, H), (0.02, 0.018, 0.018), 4, (0.25, 0.2, 0.15), 0.35)
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.18)


@panel(20)
def p20(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.02, 0.016, 0.015), (0.03, 0.025, 0.02), 0, H)
    c.folds(c.mask_rect(0, 0, W, H), (0.02, 0.018, 0.018), 10, (0.25, 0.2, 0.15), 0.35)
    # the slit of light with an eye in it
    sx0, sx1 = W * 0.12, W * 0.88
    c.rect(sx0, H * 0.18, sx1, H * 0.82, (0.55, 0.42, 0.28), 0.05)
    c.glow(W * 0.5, H * 0.5, 420 * k, (1.0, 0.85, 0.55), 0.5)
    st = Stage(W, H, c.a, ctx.seed, res=0.7)
    h = 560 * k
    hd = make("tommy", h).head
    hd.s.lid = 0.5
    st.head(hd.s, (W * 0.5, H * 0.62, 0), h, yaw=0.0, pitch=0.0, neck_to=(W * 0.5, H * 1.4, -30), res=0.6)
    rgb = st.render(light=(0.1, -0.6, 0.7), ambient=0.12, key_color=(1.0, 0.9, 0.7), rim=0.2, features=True)
    c.a = rgb
    # the curtain edges close the frame to a letterbox slit
    c.rect(0, 0, W, H * 0.30, (0.015, 0.012, 0.012), 0.02)
    c.rect(0, H * 0.74, W, H, (0.015, 0.012, 0.012), 0.02)
    c.folds(c.mask_rect(0, 0, W, H * 0.30), (0.02, 0.018, 0.018), 10, (0.3, 0.24, 0.17), 0.35)
    c.folds(c.mask_rect(0, H * 0.74, W, H), (0.02, 0.018, 0.018), 10, (0.3, 0.24, 0.17), 0.35)
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.18)


@panel(21)
def p21(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.05, 0.04, 0.032), (0.12, 0.09, 0.065), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H * 0.8) * 0.5, (0.18, 0.14, 0.1))
    c.rect(0, H * 0.80, W, H, (0.1, 0.075, 0.055), 0.05)
    c.rect(0, 0, W * 0.13, H, (0.02, 0.016, 0.015), 0.02)                                                           # the curtain on the left
    c.folds(c.mask_rect(0, 0, W * 0.13, H), (0.02, 0.018, 0.018), 3, (0.3, 0.24, 0.17), 0.4)
    c.line([(W * 0.135, 0), (W * 0.135, H)], (1, 0.92, 0.7), 4, 0.9)
    c.rect(W * 0.25, 0.0, W * 0.75, H * 0.045, (0.9, 0.85, 0.7), 0.0)
    c.glow(W * 0.5, H * 0.02, 360 * k, (1.0, 0.9, 0.65), 0.6)
    c.cone_light((W * 0.5, H * 0.04), 90, 40, H * 1.1, (1.0, 0.88, 0.6), 0.3)
    st = Stage(W, H, c.a, ctx.seed, res=0.5)
    h = 60 * k * 1.5
    tom = make("tommy", h)
    pose(tom, (W * 0.34, H * 0.55), spine=1, arms=((10, 4), (8, 6)), legs=((3, 0), (3, 0)), arm_z=((0.2, 0.3), (0.2, 0.3)))
    st.figure(tom, yaw=0.25, hand_fn=hand_builder(h, tom.spec.skin, (0.6, 0.6, 0.6, 0.6, 0.6)))
    bro = make("brody", h * 0.97)
    pose(bro, (W * 0.70, H * 0.55), spine=-1, arms=((12, 6), (10, 4)), legs=((4, 0), (4, 0)), arm_z=((0.2, 0.3), (0.2, 0.3)))
    st.figure(bro, yaw=-0.25, hand_fn=hand_builder(h * 0.97, bro.spec.skin, (0.6, 0.6, 0.6, 0.6, 0.6)))
    rgb = st.render(light=(-0.45, -0.55, 0.12), ambient=0.07, key_color=(1.0, 0.86, 0.6), rim=1.1, rim_color=(1.0, 0.8, 0.5), contrast_steps=(0.0, 0.2, 0.7, 1.0), shadow_on_bg=0.45)
    c.a = rgb
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(22)
def p22(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.1, 0.075, 0.055), (0.05, 0.04, 0.03), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H) * 0.35, (0.22, 0.17, 0.12))
    c.ellipse(W * 0.14, H * 0.46, 36 * k, 60 * k, (0.04, 0.03, 0.03), 0.0, 0.6, 12)
    c.glow(W * 0.65, H * 0.25, 420 * k, (1.0, 0.85, 0.55), 0.5)
    st = Stage(W, H, c.a, ctx.seed, res=0.65)
    h = 330 * k * 1.0
    hd = make("brody", h).head
    hd.s.eye = "wide"
    hd.s.lid = 0.0
    hd.s.brow_angle = -0.8
    st.head(hd.s, (W * 0.55, H * 0.48, 0), h, yaw=-0.12, pitch=0.0, roll=0.06, neck_to=(W * 0.55, H * 1.05, -30))
    rgb = st.render(light=(-0.5, -0.5, 0.6), ambient=0.12, key_color=(1.0, 0.9, 0.7), rim=0.35)
    c.a = rgb
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.2)
