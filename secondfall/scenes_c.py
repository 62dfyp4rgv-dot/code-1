"""Panels 23-37: the match."""
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

NOIR = dict(ambient=0.07, key_color=(1.0, 0.86, 0.6), rim=1.1, rim_color=(1.0, 0.8, 0.5), contrast_steps=(0.0, 0.2, 0.7, 1.0))


def light_bars(c: Canvas, y: float, xs, w: float = 90, n_rows: int = 1, dy: float = 0.0, strength: float = 0.7) -> None:
    k = c.k
    for r in range(n_rows):
        for x in xs:
            yy = y + r * dy
            c.rect(x - w * k / 2, yy, x + w * k / 2, yy + 9 * k, (1.0, 0.96, 0.82), 0.0)
            c.glow(x, yy + 5 * k, w * k * 1.4, (0.9, 0.8, 0.55), strength * 0.55)


def ring_rope(c: Canvas, p0, p1, width: float = 5, col=(0.9, 0.82, 0.64)) -> None:
    c.line([p0, p1], col, width, 1.0)
    c.line([(p0[0], p0[1] + 3 * c.k), (p1[0], p1[1] + 3 * c.k)], (0.18, 0.12, 0.08), width * 0.4, 0.5)


def speed_lines(c: Canvas, cx: float, cy: float, n: int = 40, r0: float = 0.2, r1: float = 1.2, alpha: float = 0.35, col=(1, 0.92, 0.75)) -> None:
    rng = np.random.default_rng(c.seed + 77)
    R = max(c.W, c.H)
    for _ in range(n):
        a = rng.uniform(0, 6.283)
        d0, d1 = R * rng.uniform(r0, r0 + 0.2), R * rng.uniform(r1 - 0.3, r1)
        c.line([(cx + math.cos(a) * d0, cy + math.sin(a) * d0), (cx + math.cos(a) * d1, cy + math.sin(a) * d1)], col, rng.uniform(1, 3.5), alpha * rng.uniform(0.4, 1))


def ring_perspective(c: Canvas, top_y: float, bot_y: float, top_w: float, bot_w: float, cx: float, mat=(0.5, 0.38, 0.25)) -> None:
    c.poly([(cx - top_w / 2, top_y), (cx + top_w / 2, top_y), (cx + bot_w / 2, bot_y), (cx - bot_w / 2, bot_y)], mat, 0.1)


def hall_bg(c: Canvas, crowd_y=0.35, glow=True) -> None:
    W, H, k = c.W, c.H, c.k
    c.gradient((0.025, 0.02, 0.018), (0.1, 0.075, 0.055), 0, H)
    if glow:
        c.glow(W * 0.5, H * 0.3, 520 * k, (1.0, 0.8, 0.5), 0.45)


@panel(23)
def p23(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.03, 0.025, 0.02), (0.06, 0.045, 0.035), 0, H)
    # the ring seen from the apron, high angle: canvas, ropes, post pads and stains
    ring_perspective(c, H * 0.06, H * 0.96, W * 0.86, W * 1.18, W * 0.5, (0.58, 0.44, 0.29))
    c.glow(W * 0.5, H * 0.45, 520 * k, (0.9, 0.7, 0.4), 0.55)
    for sx, sy in ((0.28, 0.30), (0.7, 0.4), (0.38, 0.62), (0.76, 0.78), (0.18, 0.84)):
        c.ellipse(W * sx, H * sy, 48 * k * (0.7 + sy), 10 * k * (0.7 + sy), (0.38, 0.26, 0.17), 0.1, 0.5, 5)
    for i in range(1, 8):                                                                                      # seams in the canvas
        y = H * (0.06 + 0.9 * (i / 8) ** 1.25)
        w = W * (0.86 + 0.32 * (i / 8))
        c.line([(W * 0.5 - w / 2, y), (W * 0.5 + w / 2, y)], (0.3, 0.22, 0.15), 1.5, 0.35)
    for j, f in enumerate((0.0, 0.5, 1.0)):                                                                    # three ropes round the border
        yo = H * 0.0 + 14 * k * j
        ring_rope(c, (W * 0.07 - W * 0.01 * j, H * 0.045 + yo), (W * 0.93 + W * 0.01 * j, H * 0.045 + yo), 4 + j)
        ring_rope(c, (W * 0.07 - W * 0.01 * j, H * 0.045 + yo), (W * -0.09 - W * 0.01 * j, H * 0.99 + yo * 0.0), 5 + j)
        ring_rope(c, (W * 0.93 + W * 0.01 * j, H * 0.045 + yo), (W * 1.09 + W * 0.01 * j, H * 0.99 + yo * 0.0), 5 + j)
    for x in (0.07, 0.93):
        c.rect(W * x - 12 * k, H * 0.0, W * x + 12 * k, H * 0.1, (0.07, 0.06, 0.055), 0.03)
        for py in (0.015, 0.045, 0.075):
            c.rect(W * x - 14 * k, H * py, W * x + 14 * k, H * py + 14 * k, (0.5, 0.15, 0.1), 0.04)
    st = Stage(W, H, c.a, ctx.seed, res=0.5)
    # the referee (stripes) and Brody in the middle, Tommy kneeling near the camera
    ref = make("ref", 26 * k)
    pose(ref, (W * 0.44, H * 0.40), arms=((8, 4), (8, 4)), legs=((3, 0), (3, 0)))
    st.figure(ref, yaw=0.1, hand_fn=hand_builder(26 * k, ref.spec.skin, (0.6,) * 5), res=0.8)
    bro = make("brody", 27 * k)
    pose(bro, (W * 0.60, H * 0.40), arms=((10, 5), (8, 4)), legs=((4, 0), (4, 0)))
    st.figure(bro, yaw=-0.2, hand_fn=hand_builder(27 * k, bro.spec.skin, (0.6,) * 5), res=0.8)
    tom = make("tommy", 40 * k)
    pose(tom, (W * 0.17, H * 0.86), spine=8, arms=((10, 5), (14, 6)), legs=((14, -22), (-14, 24)), leg_z=((0.9, 0.2), (0.9, 0.2)), crouch=0.9, z=40)
    st.figure(tom, yaw=0.3, pitch=0.15, hand_fn=hand_builder(40 * k, tom.spec.skin, (0.7,) * 5), res=0.6)
    rgb = st.render(light=(0.1, -0.8, 0.5), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    c.haze((0.6, 0.45, 0.3), 0.15, 0.0, 0.6)
    c.dust(80, (1, 0.85, 0.6), 0.4)
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(24)
def p24(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.07, 0.05, 0.04), (0.04, 0.03, 0.025), 0, H)
    c.rect(0, H * 0.70, W, H, (0.42, 0.3, 0.19), 0.06)                                                          # the timekeeper's table
    c.planks(c.mask_rect(0, H * 0.70, W, H) * 0.4, (0.4, 0.28, 0.17), False, 30)
    # the bell: a domed brass cup with a flared lip, a knob on top, mounted on a post, with the hammer swinging in
    bx, by = W * 0.5, H * 0.66
    c.ellipse(bx, by + H * 0.035, W * 0.22, H * 0.04, (0.03, 0.025, 0.02), 0.0, 0.8, 4)
    c.rect(bx - W * 0.025, by - H * 0.02, bx + W * 0.025, by + H * 0.04, (0.2, 0.15, 0.1), 0.04)
    top = by - H * 0.40
    prof = []
    for t in np.linspace(0, 1, 40):
        halfw = W * (0.05 + 0.20 * (t ** 1.7) + 0.05 * (max(0, t - 0.82) / 0.18) ** 2)
        prof.append((halfw, top + (by - top) * t))
    shape = [(bx - w, y) for w, y in prof] + [(bx + w, y) for w, y in prof[::-1]]
    c.poly(shape, (0.66, 0.52, 0.30), 0.06)
    mask = c.mask_poly(shape)
    c.multiply(c.mask_poly([(bx + w * 0.2, y) for w, y in prof] + [(bx + w, y) for w, y in prof[::-1]]), (0.55, 0.48, 0.4), 0.7)    # shaded right side
    c.rim(mask, (1.0, 0.92, 0.7), 5, (-1, -1), 1.0)
    c.ellipse(bx, by, W * 0.25, H * 0.035, (0.14, 0.1, 0.07), 0.04)                                          # the dark mouth of the bell
    c.ellipse(bx, by - H * 0.002, W * 0.25, H * 0.035, (0.78, 0.62, 0.36), 0.0, 0.5)
    c.ellipse(bx, top - H * 0.015, W * 0.03, H * 0.022, (0.7, 0.55, 0.32), 0.04)                              # the knob
    c.ellipse(bx - W * 0.1, top + (by - top) * 0.45, W * 0.012, (by - top) * 0.28, (1, 0.95, 0.8), 0.0, 0.5, 6)   # a long highlight
    c.line([(bx - W * 0.30, by - H * 0.30), (bx - W * 0.19, by - H * 0.18)], (0.1, 0.08, 0.07), 12, 1.0)       # the hammer arm
    c.ellipse(bx - W * 0.31, by - H * 0.315, 22 * k, 22 * k, (0.08, 0.06, 0.05), 0.0)
    for i, r in enumerate((0.5, 0.67, 0.84)):                                                                   # the ring of sound
        pts = [(bx + math.cos(a) * W * r * 1.1, by - H * 0.22 + math.sin(a) * H * r * 0.9) for a in np.linspace(math.pi * 1.05, math.pi * 1.95, 40)]
        c.line(pts, (1, 0.9, 0.65), 5 - i, 0.7 - 0.12 * i)
    c.glow(bx, by - H * 0.25, 300 * k, (1, 0.85, 0.55), 0.7)
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


def _grapple(c: Canvas, ctx, tpel, bpel, h, tpose: dict, bpose: dict, light=(0.1, -0.8, 0.5), res=0.55, extra=None, yaws=(0.2, -0.2), hands=((0.7,) * 5, (0.7,) * 5)):
    st = Stage(c.W, c.H, c.a, ctx.seed, res=res)
    tom = make("tommy", h)
    pose(tom, tpel, **tpose)
    st.figure(tom, yaw=yaws[0], hand_fn=hand_builder(h, tom.spec.skin, hands[0]))
    bro = make("brody", h * 0.97)
    pose(bro, bpel, **bpose)
    st.figure(bro, yaw=yaws[1], hand_fn=hand_builder(h * 0.97, bro.spec.skin, hands[1]))
    return st


@panel(25)
def p25(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    hall_bg(c)
    light_bars(c, H * 0.02, (W * 0.3, W * 0.7), 120, 1)
    c.haze((0.6, 0.45, 0.3), 0.15, 0.2, 0.9)
    for y in (0.44, 0.58, 0.72):                                                                                   # blurred ring ropes
        c.line([(0, H * y), (W, H * (y - 0.02))], (0.5, 0.4, 0.28), 6, 0.35)
    h = 78 * k
    st = _grapple(c, ctx, (W * 0.35, H * 0.62), (W * 0.66, H * 0.62), h,
                  dict(spine=14, twist=-20, arms=((20, 30), (100, 80)), legs=((14, -6), (6, 2)), arm_z=((0.3, 0.5), (0.6, 0.9)), head_off=(0.1, 0.02), z=0),
                  dict(spine=-12, twist=20, arms=((95, 75), (18, 25)), legs=((-4, 2), (-14, 6)), arm_z=((0.6, 0.9), (0.3, 0.5)), head_off=(-0.1, 0.0), z=-5))
    rgb = st.render(light=(-0.4, -0.7, 0.3), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    speed_lines(c, W * 0.5, H * 0.45, 18, 0.5, 1.0, 0.18)
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(26)
def p26(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.05, 0.04, 0.03), (0.13, 0.095, 0.07), 0, H)
    third = W / 3
    for x in (third, 2 * third):                                                                                   # the gutters between three beats
        c.rect(x - 3 * k, 0, x + 3 * k, H, (0.95, 0.9, 0.75), 0.0)
    h = 36 * k
    st = Stage(W, H, c.a, ctx.seed, res=0.8)
    tom = make("tommy", h)
    pose(tom, (third * 0.30, H * 0.78), spine=16, arms=((40, 60), (30, 40)), legs=((14, -8), (-10, 8)), z=0)
    st.figure(tom, yaw=0.3, hand_fn=hand_builder(h, tom.spec.skin, (0.7,) * 5))
    bro = make("brody", h * 0.97)
    pose(bro, (third * 0.62, H * 0.28), spine=130, arms=((110, 40), (140, 30)), legs=((160, -20), (150, 30)), z=0)          # Brody going over, feet high
    st.figure(bro, yaw=0.2, hand_fn=hand_builder(h * 0.97, bro.spec.skin, (0.6,) * 5))
    tom2 = make("tommy", h)
    pose(tom2, (third * 2.5, H * 0.92), spine=0, arms=((92, 10), (92, 10)), legs=((12, 0), (-12, 0)), crouch=1.1)             # kneeling, arms wide
    st.figure(tom2, yaw=0.0, hand_fn=hand_builder(h, tom2.spec.skin, (0.1,) * 5))
    rgb = st.render(light=(0.0, -0.8, 0.5), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    # centre beat: Brody's boots coming straight at us
    for sx in (-1, 1):
        cx = third * 1.5 + sx * 34 * k
        c.poly([(cx - 22 * k, H * 0.30), (cx + 22 * k, H * 0.30), (cx + 36 * k, H * 0.76), (cx - 36 * k, H * 0.76)], (0.45, 0.43, 0.4), 0.04)
        c.ellipse(cx, H * 0.78, 38 * k, 18 * k, (0.5, 0.48, 0.44), 0.04)
        c.rim(c.mask_ellipse(cx, H * 0.78, 38 * k, 18 * k), (1, 0.9, 0.7), 3, (-1, -1), 0.8)
    c.rect(third * 1.5 - 70 * k, H * 0.04, third * 1.5 + 70 * k, H * 0.20, (0.45, 0.4, 0.3), 0.04)
    c.rect(third * 1.5 - 70 * k, H * 0.04, third * 1.5 + 70 * k, H * 0.07, (0.9, 0.88, 0.78), 0.04)
    speed_lines(c, third * 0.5, H * 0.35, 14, 0.2, 0.7, 0.3)
    c.vignette(0.45)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(27)
def p27(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.14, 0.1, 0.07), (0.05, 0.04, 0.03), 0, H)
    c.glow(W * 0.5, H * 0.2, 340 * k, (0.9, 0.75, 0.5), 0.5)
    st = Stage(W, H, c.a, ctx.seed, res=0.8)
    h = 0.235 * H
    tom = make("tommy", h)
    tom.spec.outfit = "none"
    pose(tom, (W * 0.5, H * 0.38 + 3.45 * h), spine=0, twist=-10, head_off=(0.0, 0.02), arms=((14, 6), (75, 140)), legs=((5, 0), (5, 0)))
    st.figure(tom, yaw=-0.15, hand_fn=hand_builder(h, tom.spec.skin, (0.05, 0.9, 0.9, 0.9, 0.9)))
    rgb = st.render(light=(-0.5, -0.5, 0.45), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(28)
def p28(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.04, 0.03, 0.025), (0.1, 0.075, 0.055), 0, H)
    c.glow(W * 0.25, H * 0.3, 420 * k, (0.9, 0.7, 0.45), 0.45)
    c.rect(W * 0.78, 0, W * 0.9, H, (0.09, 0.075, 0.065), 0.04)                                                       # corner post
    c.rect(W * 0.76, H * 0.16, W * 0.92, H * 0.28, (0.55, 0.16, 0.11), 0.05)                                           # turnbuckle pad
    c.rect(W * 0.76, H * 0.12, W * 0.92, H * 0.16, (0.12, 0.1, 0.09), 0.03)
    c.poly([(W * 0.0, H * 0.18), (W * 0.77, H * 0.52), (W * 0.77, H * 0.56), (W * 0.0, H * 0.22)], (0.9, 0.82, 0.63), 0.04)       # ropes, three diagonals
    c.poly([(W * 0.0, H * 0.40), (W * 0.77, H * 0.72), (W * 0.77, H * 0.76), (W * 0.0, H * 0.44)], (0.9, 0.82, 0.63), 0.04)
    st = Stage(W, H, c.a, ctx.seed, res=0.55)
    h = 72 * k
    tom = make("tommy", h)
    pose(tom, (W * 0.52, H * 0.66), spine=-8, twist=-25, head_off=(-0.05, 0.05), arms=((75, 40), (40, 50)), legs=((10, -4), (-14, 6)), arm_z=((0.3, 0.6), (-0.4, -0.2)))
    st.figure(tom, yaw=-0.45, hand_fn=hand_builder(h, tom.spec.skin, (0.8,) * 5))
    rgb = st.render(light=(-0.5, -0.6, 0.3), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    c.poly([(W * 0.0, H * 0.30), (W * 0.77, H * 0.64), (W * 0.77, H * 0.68), (W * 0.0, H * 0.34)], (0.9, 0.82, 0.63), 0.04, alpha=0.9)      # a rope across his body
    # a cornerman's silhouette at the lower left, with a white towel
    c.ellipse(W * 0.08, H * 0.90, 90 * k, 110 * k, (0.03, 0.025, 0.025), 0.0)
    c.poly([(W * 0.04, H * 0.84), (W * 0.15, H * 0.84), (W * 0.095, H * 0.74)], (0.92, 0.88, 0.76), 0.03)
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(29)
def p29(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.025, 0.02, 0.018), (0.1, 0.075, 0.055), 0, H, power=0.8)
    for r, y in enumerate((0.015, 0.075, 0.15, 0.25)):
        light_bars(c, H * y, (W * (0.2 + 0.02 * r), W * (0.8 - 0.02 * r)), 150 - 12 * r, 1, 0, 0.7)
    c.glow(W * 0.5, H * 0.35, 640 * k, (0.9, 0.75, 0.5), 0.5)
    c.haze((0.6, 0.45, 0.3), 0.2, 0.2, 0.9)
    st = Stage(W, H, c.a, ctx.seed, res=0.45)
    h = 66 * k
    bro = make("brody", h)
    pose(bro, (W * 0.36, H * 0.42), spine=75, twist=0, arms=((140, 20), (-30, 60)), legs=((90, 10), (80, 30)), arm_z=((0.2, 0.4), (0.3, 0.5)), leg_z=((0.3, 0.2), (0.4, 0.2)), head_off=(0.2, 0.0))
    st.figure(bro, yaw=0.6, hand_fn=hand_builder(h, bro.spec.skin, (0.2,) * 5))
    tom = make("tommy", h * 1.12)
    pose(tom, (W * 0.5, H * 0.86), spine=0, arms=((150, 20), (150, 20)), legs=((10, 0), (10, 0)), head_off=(0.0, -0.1))
    st.figure(tom, yaw=0.0, pitch=-0.25, hand_fn=hand_builder(h * 1.12, tom.spec.skin, (0.1,) * 5))
    rgb = st.render(light=(0.0, -0.9, 0.2), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    speed_lines(c, W * 0.5, H * 0.55, 36, 0.3, 1.0, 0.3)
    c.dust(160, (1, 0.9, 0.65), 0.5)
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(30)
def p30(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.1, 0.075, 0.055), (0.06, 0.045, 0.035), 0, H)
    c.planks(c.mask_rect(0, 0, W, H * 0.55), (0.17, 0.11, 0.07), True, 56)
    c.glow(W * 0.5, H * 0.1, 500 * k, (0.9, 0.7, 0.45), 0.5)
    c.crowd(H * 0.40, H * 0.9, 6, 34, (0.2, 0.14, 0.1), ctx.seed, (1.0, 0.75, 0.45), 0.45, 0.05, 1.0)
    # a kid on someone's shoulders, arms in a V
    kx, ky = W * 0.62, H * 0.43
    c.ellipse(kx, ky, 20 * k, 24 * k, (0.2, 0.14, 0.1), 0.0)
    c.line([(kx - 8 * k, ky + 20 * k), (kx - 40 * k, ky - 36 * k)], (0.2, 0.14, 0.1), 9, 1.0)
    c.line([(kx + 8 * k, ky + 20 * k), (kx + 42 * k, ky - 38 * k)], (0.2, 0.14, 0.1), 9, 1.0)
    c.rim(c.mask_ellipse(kx, ky, 20 * k, 24 * k), (1, 0.8, 0.5), 3, (-1, -1), 0.9)
    c.haze((0.6, 0.45, 0.3), 0.15, 0.2, 0.9)
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


def _face_panel(ctx, who="tommy", yaw=0.0, pitch=0.0, roll=0.0, hfrac=0.62, cx=0.5, cy=0.42, light=(-0.55, -0.5, 0.55), spec_edit=None, bg=None, hair_style=None, bokeh=False,
                cloth=(0.24, 0.19, 0.15)):
    """A close-up of one head with its neck and the tops of the shoulders in proportion. `hfrac` = head height as a fraction of the panel height."""
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.11, 0.08, 0.06), (0.05, 0.04, 0.03), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H) * 0.3, (0.2, 0.15, 0.1))
    c.glow(W * (0.3 if light[0] < 0 else 0.7), H * 0.2, 450 * k, (1.0, 0.8, 0.5), 0.6)
    if bokeh:
        rng = np.random.default_rng(ctx.seed)
        for _ in range(9):
            c.ellipse(rng.uniform(0, W), rng.uniform(0, H * 0.9), rng.uniform(30, 60) * k, rng.uniform(30, 60) * k, (1, 0.85, 0.55), 0.0, 0.22, 10)
    if bg:
        bg(c)
    st = Stage(W, H, c.a, ctx.seed, res=0.65)
    h = hfrac * H
    f = make(who, h)
    hd = f.head
    if hair_style:
        hd.s.hair_style = hair_style
    if spec_edit:
        spec_edit(hd.s)
    hx, hy = W * cx, H * cy
    st.head(hd.s, (hx, hy, 0), h, yaw=yaw, pitch=pitch, roll=roll, neck_to=(hx, hy + 0.98 * h, -0.1 * h))

    def sh(sd):                                                              # shoulders: a torso mass with sloping trapezius into the neck
        sd.ellipsoid((hx, hy + 1.42 * h, -0.2 * h), (1.15 * h, 0.55 * h, 0.5 * h), (0, 0, 0), 0.3 * h, False, cloth, "cloth", 0.0, 6.0, 1, 1)
        for sg in (-1, 1):
            sd.cone((hx + sg * 0.16 * h, hy + 0.78 * h, -0.12 * h), (hx + sg * 0.85 * h, hy + 1.10 * h, -0.12 * h), 0.2 * h, 0.34 * h, 0.2 * h, False, cloth, "cloth", 0.0, 6.0, 1, 1)
    st.sdf(sh, (0, H * 0.4, W, H * 1.5), (-1.2 * h, 1.2 * h))
    rgb = st.render(light=light, ambient=0.12, key_color=(1.0, 0.88, 0.65), rim=0.55, contrast_steps=(0.0, 0.2, 0.68, 1.0), shadow_on_bg=0.3)
    c.a = rgb
    c.vignette(0.5)
    return c, finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(31)
def p31(ctx):
    def edit(s):
        s.eye, s.lid, s.mouth_open, s.brow_angle = "wide", 0.0, 0.9, -0.7
    return _face_panel(ctx, "brody", -0.1, 0.0, 0.05, 0.46, 0.5, 0.40, spec_edit=edit)[1]


@panel(32)
def p32(ctx):
    def edit(s):
        s.smile, s.lid = 0.7, 0.45
    return _face_panel(ctx, "tommy", 0.12, 0.0, -0.03, 0.46, 0.5, 0.40, spec_edit=edit)[1]


@panel(33)
def p33(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.03, 0.025, 0.02), (0.09, 0.07, 0.05), 0, H)
    c.crowd(H * 0.18, H * 0.5, 5, 26, (0.17, 0.12, 0.09), ctx.seed, (1, 0.75, 0.45), 0.3, 0.1, 1.0)
    c.haze((0.6, 0.45, 0.3), 0.15, 0.0, 0.8)
    for y in (0.34, 0.52, 0.70):
        ring_rope(c, (0, H * y), (W, H * (y + 0.01)), 7)
    st = Stage(W, H, c.a, ctx.seed, res=0.55)
    h = 64 * k
    tom = make("tommy", h)
    pose(tom, (W * 0.5, H * 0.66), spine=3, twist=-8, arms=((14, 10), (60, 60)), legs=((6, -2), (4, 2)), arm_z=((0.3, 0.4), (0.2, 0.3)))
    st.figure(tom, yaw=0.15, hand_fn=hand_builder(h, tom.spec.skin, (0.6,) * 5))
    rgb = st.render(light=(-0.4, -0.6, 0.3), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    for y in (0.34, 0.52):
        ring_rope(c, (0, H * y + 12 * k), (W, H * (y + 0.01) + 12 * k), 6)
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


def ecg(c: Canvas, y: float, beats, color=(1.0, 0.25, 0.2), width: float = 5, x0: float = 0.04, x1: float = 0.96, flat_after: Optional[float] = None) -> None:
    k = c.k
    pts = []
    xs = np.linspace(c.W * x0, c.W * x1, 600)
    for x in xs:
        v = 0.0
        for bx in beats:
            d = (x - c.W * bx) / (c.W * 0.03)
            v += math.exp(-d * d * 6) * -1.0 + 0.5 * math.exp(-((d + 1.3) ** 2) * 3) * -0.4 + 0.35 * math.exp(-((d - 2.2) ** 2) * 2) * -0.4
            v += 0.4 * math.exp(-((d - 0.55) ** 2) * 14)
        if flat_after is not None and x > c.W * flat_after:
            v = 0.0
        pts.append((x, y + v * c.H * 0.34))
    c.line(pts, color, width * 2.2, 0.25)
    c.line(pts, color, width, 1.0)
    c.line(pts, (1.0, 0.85, 0.75), width * 0.35, 0.9)


from typing import Optional  # noqa: E402


@panel(34)
def p34(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.22, 0.17, 0.12), (0.12, 0.09, 0.065), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H) * 0.3, (0.3, 0.22, 0.15))
    for i in range(1, 10):
        c.line([(W * i / 10, 0), (W * i / 10, H)], (0.4, 0.3, 0.22), 1, 0.25)
    for j in range(1, 6):
        c.line([(0, H * j / 6), (W, H * j / 6)], (0.4, 0.3, 0.22), 1, 0.25)
    ecg(c, H * 0.62, (0.2, 0.5, 0.8))
    c.ellipse(W * 0.9, H * 0.9, 50 * k, 90 * k, (0.5, 0.38, 0.28), 0.05, 0.7, 14)                                       # a blurred hand in the corner
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.5)


@panel(35)
def p35(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.08, 0.06, 0.045), (0.12, 0.09, 0.065), 0, H)
    c.glow(W * 0.5, H * 0.5, 600 * k, (0.9, 0.7, 0.45), 0.5)
    st = Stage(W, H, c.a, ctx.seed, res=0.6)
    h = 38 * k * 1.5
    tom = make("tommy", h)
    pose(tom, (W * 0.5, H * 0.52), spine=-6, arms=((16, 8), (22, 10)), legs=((5, 0), (5, 0)))
    st.figure(tom, yaw=0.0, hand_fn=hand_builder(h, tom.spec.skin, (0.6,) * 5), res=0.7)
    # middle strip: the clothesline
    t2 = make("tommy", h * 0.8)
    pose(t2, (W * 0.34, H * 0.665), spine=4, arms=((90, 4), (30, 20)), legs=((10, -4), (-12, 6)), arm_z=((0.6, 0.6), (0, 0)))
    st.figure(t2, yaw=0.2, hand_fn=hand_builder(h * 0.8, t2.spec.skin, (0.9,) * 5), res=0.8)
    b2 = make("brody", h * 0.8)
    pose(b2, (W * 0.66, H * 0.665), spine=-28, arms=((50, 20), (60, 30)), legs=((-26, 12), (14, -4)))
    st.figure(b2, yaw=-0.3, hand_fn=hand_builder(h * 0.8, b2.spec.skin, (0.6,) * 5), res=0.8)
    # bottom: Tommy lifts Brody
    t3 = make("tommy", h * 0.8)
    pose(t3, (W * 0.5, H * 0.94), arms=((150, 10), (150, 10)), legs=((8, 0), (8, 0)))
    st.figure(t3, yaw=0.0, hand_fn=hand_builder(h * 0.8, t3.spec.skin, (0.3,) * 5), res=0.8)
    b3 = make("brody", h * 0.7)
    pose(b3, (W * 0.52, H * 0.80), spine=92, arms=((120, 10), (-30, 10)), legs=((88, 5), (92, 8)))
    st.figure(b3, yaw=0.3, hand_fn=hand_builder(h * 0.7, b3.spec.skin, (0.4,) * 5), res=0.8)
    rgb = st.render(light=(-0.2, -0.7, 0.4), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    # the two diagonal rope cuts that divide the three beats
    for y0, y1 in ((0.355, 0.30), (0.78, 0.74)):
        c.poly([(0, H * y0), (W, H * y1), (W, H * y1 + 10 * k), (0, H * y0 + 10 * k)], (0.95, 0.9, 0.75), 0.0)
    for i in range(7):
        c.line([(W * 0.6 + i * 12 * k, H * 0.13 - i * 5 * k), (W * 0.68 + i * 14 * k, H * 0.12 - i * 4 * k)], (1, 0.92, 0.75), 2, 0.7)
    c.vignette(0.45)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(36)
def p36(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.45, 0.34, 0.22), (0.2, 0.14, 0.09), 0, H * 0.7)
    c.planks(c.mask_rect(0, 0, W, H * 0.7) * 0.3, (0.4, 0.3, 0.2), True, 60)
    c.rect(0, H * 0.78, W, H, (0.3, 0.22, 0.15), 0.06)
    c.crowd(H * 0.62, H * 0.82, 3, 32, (0.1, 0.07, 0.055), ctx.seed, (1, 0.85, 0.6), 0.5, 0.0, 1.0, back_light=0.9)
    rng = np.random.default_rng(ctx.seed)
    for _ in range(24):                                                                                                  # hands, mid-clap
        x, y = rng.uniform(W * 0.05, W * 0.95), rng.uniform(H * 0.5, H * 0.66)
        for sg in (-1, 1):
            c.ellipse(x + sg * 11 * k, y, 8 * k, 14 * k, (0.08, 0.06, 0.05), 0.0)
        c.line([(x - 26 * k, y - 18 * k), (x - 20 * k, y - 8 * k)], (1, 0.85, 0.55), 2, 0.7)
        c.line([(x + 26 * k, y - 18 * k), (x + 20 * k, y - 8 * k)], (1, 0.85, 0.55), 2, 0.7)
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(37)
def p37(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.02, 0.016, 0.015), (0.09, 0.07, 0.05), 0, H, power=0.9)
    for r, y in enumerate((0.03, 0.09, 0.16, 0.24)):
        light_bars(c, H * y, (W * (0.22 + 0.02 * r), W * (0.78 - 0.02 * r)), 190 - 18 * r, 1, 0, 0.8)
    c.cone_light((W * 0.5, H * 0.25), 90, 18, H * 0.9, (1.0, 0.88, 0.62), 0.35)
    c.dust(260, (1, 0.9, 0.65), 0.55, area=(W * 0.25, H * 0.2, W * 0.75, H * 0.8))
    # the ring floor in strong perspective, ropes fanning out to the posts
    ring_perspective(c, H * 0.72, H * 0.98, W * 0.5, W * 1.0, W * 0.5, (0.5, 0.38, 0.25))
    c.glow(W * 0.5, H * 0.82, 480 * k, (0.9, 0.7, 0.4), 0.5)
    for j in range(3):
        yo = j * 22 * k
        ring_rope(c, (W * 0.25, H * 0.60 + yo * 0.5), (W * -0.02, H * 0.84 + yo), 5)
        ring_rope(c, (W * 0.75, H * 0.60 + yo * 0.5), (W * 1.02, H * 0.84 + yo), 5)
        ring_rope(c, (W * 0.25, H * 0.60 + yo * 0.5), (W * 0.75, H * 0.60 + yo * 0.5), 4, (0.8, 0.72, 0.56))
    for x in (0.25, 0.75):
        c.rect(W * x - 8 * k, H * 0.545, W * x + 8 * k, H * 0.66, (0.08, 0.065, 0.06), 0.03)
    st = Stage(W, H, c.a, ctx.seed, res=0.45)
    h = 70 * k
    tom = make("tommy", h)
    pose(tom, (W * 0.5, H * 0.80), spine=0, twist=-6, head_off=(0.0, -0.18), arms=((12, 4), (176, 0)), legs=((5, 0), (5, 0)), arm_z=((0.2, 0.3), (0.2, 0.3)))
    st.figure(tom, yaw=0.0, pitch=-0.35, hand_fn=hand_builder(h, tom.spec.skin, (0.9, 0.1, 0.9, 0.9, 0.9)))
    rgb = st.render(light=(0.0, -0.9, 0.3), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    c.haze((0.6, 0.45, 0.3), 0.15, 0.3, 0.9)
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)
