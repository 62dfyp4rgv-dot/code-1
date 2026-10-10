"""Panels 38-62: the finger, the stream, the slam, the monitor, the white light."""
from __future__ import annotations

import math

import numpy as np

from .body import hand_builder
from .cast import make
from .grade import finish_sepia, finish_white
from .poses import pose
from .r3d import _blur, fnoise
from .registry import panel
from .scenes_c import NOIR, ecg, light_bars, ring_perspective, ring_rope, speed_lines, _face_panel
from .stage import Stage
from .world import Canvas


def _lit_crowd(c: Canvas, y0, y1, rows=5, size=30, phones=0.1, arms=0.2):
    c.crowd(y0, y1, rows, size, (0.2, 0.14, 0.1), c.seed, (1.0, 0.75, 0.45), arms, phones, 1.0)


@panel(38)
def p38(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.12, 0.09, 0.065), (0.04, 0.03, 0.025), 0, H)
    c.glow(W * 0.3, H * 0.1, 520 * k, (1.0, 0.8, 0.5), 0.5)
    _lit_crowd(c, H * 0.55, H * 0.92, 5, 36, 0.05, 0.25)
    c.rect(W * 0.62, H * 0.74, W * 0.66, H * 0.77, (1.0, 0.95, 0.8), 0.0)                                       # a phone flash in the dark
    c.glow(W * 0.64, H * 0.755, 120 * k, (1.0, 0.95, 0.8), 0.9)
    st = Stage(W, H, c.a, ctx.seed, res=0.6)
    hs = hand_builder(130 * k, (0.52, 0.41, 0.34), (0.9, 0.05, 0.95, 0.95, 0.95))

    def build(sd):
        sk = (0.52, 0.41, 0.34)
        sd.cone((W * 0.22, H * 1.05, 0), (W * 0.22, H * 0.28, 20), 74 * k, 46 * k, 30 * k, False, sk, "skin", 0.0, 6.0, 1, 0)
        sd.cone((W * 0.22, H * 0.72, 10), (W * 0.22, H * 0.52, 14), 60 * k, 52 * k, 8 * k, False, (0.9, 0.88, 0.8), "tape", 0.0, 3.0, 1, 3)
        hs(sd, "r", np.array([W * 0.22, H * 0.28, 24], np.float32), np.array([W * 0.22, H * 0.5, 20], np.float32))
    st.sdf(build, (0, 0, W, H), (-200, 250))
    rgb = st.render(light=(0.5, -0.4, 0.4), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


def _eli_scene(ctx, filming: bool):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.1, 0.075, 0.055), (0.05, 0.04, 0.03), 0, H)
    c.planks(c.mask_rect(0, 0, W, H * 0.5) * 0.5, (0.2, 0.13, 0.09), True, 56)
    c.glow(W * 0.3, H * 0.15, 480 * k, (1.0, 0.8, 0.5), 0.5)
    _lit_crowd(c, H * 0.10, H * 0.55, 4, 30, 0.1, 0.1)
    st = Stage(W, H, c.a, ctx.seed, res=0.6)
    h = 300 * k if filming else 330 * k
    eli = make("eli", h)
    hd = eli.head
    hd.s.smile = 0.5 if not filming else 0.2
    hd.s.lid = 0.2
    cx, cy = W * 0.5, H * (0.46 if filming else 0.5)
    st.head(hd.s, (cx, cy, 0), h, yaw=0.08, pitch=0.0, neck_to=(cx, H * 1.05, -30))

    def build(sd):
        sk = hd.s.skin
        shirt = (0.07, 0.07, 0.075)
        sd.ellipsoid((cx, H * 1.0, -30), (h * 1.05, h * 0.62, h * 0.5), (0, 0, 0), h * 0.3, False, shirt, "cloth", 0.0, 6.0, 1, 1)
        if filming:
            for sg in (-1, 1):
                sd.cone((cx + sg * h * 0.9, H * 1.0, -10), (cx + sg * h * 0.78, H * 0.62, 30), h * 0.34, h * 0.26, h * 0.2, False, shirt, "cloth", 0.0, 6.0, 1, 1)
                sd.cone((cx + sg * h * 0.78, H * 0.62, 30), (cx + sg * h * 0.42, H * 0.40, 60), h * 0.24, h * 0.18, h * 0.12, False, sk, "skin", 0.0, 6.0, 1, 0)
        else:
            sd.cone((cx - h * 0.9, H * 1.0, -10), (cx - h * 1.0, H * 0.7, 30), h * 0.34, h * 0.26, h * 0.2, False, shirt, "cloth", 0.0, 6.0, 1, 1)
            sd.cone((cx - h * 1.0, H * 0.7, 30), (cx - h * 1.05, H * 0.12, 40), h * 0.22, h * 0.15, h * 0.12, False, sk, "skin", 0.0, 6.0, 1, 0)
            hand_builder(h * 0.45, sk, (0.9, 0.05, 0.95, 0.95, 0.95))(sd, "l", np.array([cx - h * 1.05, H * 0.12, 44], np.float32), np.array([cx - h * 1.0, H * 0.4, 40], np.float32))
    st.sdf(build, (0, 0, W, H), (-200, 250))
    rgb = st.render(light=(-0.5, -0.5, 0.5), ambient=0.1, key_color=(1.0, 0.88, 0.65), rim=0.5, contrast_steps=(0.0, 0.2, 0.68, 1.0))
    c.a = rgb
    c.text(cx, H * 0.93, "BELL & RYU", 44, (0.82, 0.8, 0.74))
    if filming:
        px, py = cx + h * 0.42, H * 0.36
        c.poly([(px - 40 * k, py - 62 * k), (px + 40 * k, py - 62 * k), (px + 40 * k, py + 62 * k), (px - 40 * k, py + 62 * k)], (0.08, 0.1, 0.16), 0.0)
        c.rect(px - 34 * k, py - 54 * k, px + 34 * k, py + 54 * k, (0.35, 0.5, 0.75), 0.04)
        c.rect(px - 28 * k, py - 46 * k, px + 28 * k, py - 28 * k, (0.8, 0.15, 0.12), 0.0)
        c.glow(px, py, 220 * k, (0.5, 0.65, 0.9), 0.6)
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.35)


@panel(39)
def p39(ctx):
    return _eli_scene(ctx, True)


@panel(40)
def p40(ctx):
    return _eli_scene(ctx, False)


def _phone(ctx, with_dots: bool):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed, base=(0.03, 0.03, 0.035))
    k = c.k
    c.gradient((0.05, 0.05, 0.055), (0.02, 0.02, 0.025), 0, H)
    mx0, mx1, my0, my1 = W * 0.06, W * 0.94, H * 0.04, H * 0.96
    c.poly([(mx0, my0 + 30 * k), (mx0 + 30 * k, my0), (mx1 - 30 * k, my0), (mx1, my0 + 30 * k), (mx1, my1 - 30 * k), (mx1 - 30 * k, my1), (mx0 + 30 * k, my1), (mx0, my1 - 30 * k)], (0.08, 0.075, 0.08), 0.03)
    sx0, sx1, sy0, sy1 = mx0 + 18 * k, mx1 - 18 * k, my0 + 26 * k, my1 - 26 * k
    c.gradient((0.1, 0.16, 0.34), (0.05, 0.08, 0.2), sy0, sy1, mask=c.mask_rect(sx0, sy0, sx1, sy1))
    # the stream: a blue ring, ropes, and a small Tommy with a finger raised
    ring_perspective(c, sy0 + (sy1 - sy0) * 0.55, sy1 - 30 * k, (sx1 - sx0) * 0.72, (sx1 - sx0) * 1.0, (sx0 + sx1) / 2, (0.14, 0.3, 0.62))
    for y in (0.52, 0.6, 0.68):
        c.line([(sx0, sy0 + (sy1 - sy0) * y), (sx1, sy0 + (sy1 - sy0) * y)], (0.8, 0.82, 0.88), 3, 0.8)
    st = Stage(W, H, c.a, ctx.seed, res=0.8)
    h = 38 * k
    tom = make("tommy", h)
    pose(tom, ((sx0 + sx1) / 2, sy0 + (sy1 - sy0) * 0.74), arms=((12, 4), (176, 0)), legs=((5, 0), (5, 0)))
    tom.spec.color = (0.7, 0.1, 0.1)
    st.figure(tom, yaw=0.0, hand_fn=hand_builder(h, tom.spec.skin, (0.9, 0.05, 0.9, 0.9, 0.9)))
    rgb = st.render(light=(0.0, -0.8, 0.5), ambient=0.25, key_color=(0.8, 0.85, 1.0), rim=0.3, shadow_on_bg=0.3)
    c.a = rgb
    c.poly([(sx0 + 14 * k, sy0 + 16 * k), (sx0 + 120 * k, sy0 + 16 * k), (sx0 + 120 * k, sy0 + 52 * k), (sx0 + 14 * k, sy0 + 52 * k)], (0.82, 0.14, 0.14), 0.0)
    c.text(sx0 + 67 * k, sy0 + 34 * k, "LIVE", 20, (1, 1, 1))
    c.poly([(sx1 - 220 * k, sy0 + 16 * k), (sx1 - 14 * k, sy0 + 16 * k), (sx1 - 14 * k, sy0 + 52 * k), (sx1 - 220 * k, sy0 + 52 * k)], (0.03, 0.03, 0.03), 0.0)
    c.text(sx1 - 117 * k, sy0 + 34 * k, "212 WATCHING", 17, (1, 1, 1))
    c.line([(sx0 + 20 * k, sy0 + 70 * k), (sx1 - 20 * k, sy0 + 70 * k)], (0.8, 0.8, 0.85), 1.5, 0.2)
    if with_dots:
        cx, cy = (sx0 + sx1) / 2, sy0 + (sy1 - sy0) * 0.52
        for i in range(11):
            a = i / 11 * 6.283
            c.ellipse(cx + math.cos(a) * 110 * k, cy + math.sin(a) * 140 * k, 9 * k, 9 * k, (1, 1, 1), 0.0)
    c.poly([(sx0, sy0), (sx0 + (sx1 - sx0) * 0.5, sy0), (sx0, sy0 + (sy1 - sy0) * 0.7)], (1, 1, 1), 0.0, 0.05)
    c.vignette(0.3)
    return finish_sepia(c.a, ctx.seed, keep=0.55, exposure=1.1)


@panel(41)
def p41(ctx):
    return _phone(ctx, False)


@panel(55)
def p55(ctx):
    return _phone(ctx, True)


@panel(42)
def p42(ctx):
    def edit(s):
        s.lid, s.smile = 0.5, 0.2
    return _face_panel(ctx, "tommy", 0.0, 0.0, 0.0, 0.47, 0.5, 0.40, light=(-0.7, -0.4, 0.35), spec_edit=edit)[1]


@panel(43)
def p43(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.12, 0.09, 0.065), (0.05, 0.04, 0.03), 0, H)
    c.glow(W * 0.3, H * 0.2, 450 * k, (1.0, 0.8, 0.5), 0.55)
    st = Stage(W, H, c.a, ctx.seed, res=0.65)
    h = H * 0.5
    t = make("tommy", h).head
    t.s.lid, t.s.smile = 0.45, 0.2
    st.head(t.s, (W * 0.6, H * 0.30, 0), h, yaw=-0.12, neck_to=(W * 0.6, H * 1.1, -30))
    b = make("brody", H * 0.4).head
    b.s.eye, b.s.lid = "round", 0.15
    st.head(b.s, (W * 0.30, H * 0.74, 40), H * 0.4, yaw=0.2, roll=-0.08, neck_to=(W * 0.3, H * 1.2, -10))
    rgb = st.render(light=(-0.5, -0.5, 0.5), ambient=0.1, key_color=(1.0, 0.88, 0.65), rim=0.5, contrast_steps=(0.0, 0.2, 0.68, 1.0), res=None) if False else \
        st.render(light=(-0.5, -0.5, 0.5), ambient=0.1, key_color=(1.0, 0.88, 0.65), rim=0.5, contrast_steps=(0.0, 0.2, 0.68, 1.0))
    c.a = rgb
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(44)
def p44(ctx):
    def edit(s):
        s.lid, s.brow_angle = 0.35, 0.9
    return _face_panel(ctx, "tommy", 0.0, 0.0, 0.03, 0.47, 0.5, 0.40, light=(-0.45, -0.55, 0.5), spec_edit=edit, bokeh=True)[1]


@panel(49)
def p49(ctx):
    def edit(s):
        s.lid, s.smile, s.age = 0.7, 0.5, 0.9
    return _face_panel(ctx, "tommy", 0.05, 0.05, -0.04, 0.47, 0.5, 0.40, light=(-0.55, -0.45, 0.45), spec_edit=edit)[1]


@panel(45)
def p45(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.02, 0.016, 0.015), (0.1, 0.075, 0.055), 0, H)
    for r, y in enumerate((0.02, 0.07, 0.13, 0.20)):
        light_bars(c, H * y, (W * (0.25 + 0.02 * r), W * (0.75 - 0.02 * r)), 160 - 14 * r, 1, 0, 0.8)
    c.glow(W * 0.5, H * 0.35, 560 * k, (0.9, 0.75, 0.5), 0.5)
    for i in range(24):                                                                                                  # falling streaks
        x = W * (0.2 + 0.6 * ((i * 37) % 100) / 100)
        c.line([(x, H * 0.25), (x, H * (0.55 + 0.3 * ((i * 53) % 100) / 100))], (0.6, 0.45, 0.3), 1.5, 0.25)
    st = Stage(W, H, c.a, ctx.seed, res=0.45)
    h = 66 * k
    bro = make("brody", h)
    pose(bro, (W * 0.5, H * 0.80), arms=((158, 14), (158, 14)), legs=((9, 0), (9, 0)), head_off=(0, -0.1), arm_z=((0.3, 0.2), (0.3, 0.2)))
    st.figure(bro, yaw=0.0, pitch=-0.3, hand_fn=hand_builder(h, bro.spec.skin, (0.4,) * 5))
    tom = make("tommy", h * 1.05)
    pose(tom, (W * 0.5, H * 0.40), spine=0, flip=True, arms=((25, 10), (25, 10)), legs=((160, 8), (160, 8)), head_off=(0, 0.1))
    st.figure(tom, yaw=0.0, pitch=0.2, roll=3.1, hand_fn=hand_builder(h * 1.05, tom.spec.skin, (0.5,) * 5))
    rgb = st.render(light=(0.0, -0.9, 0.2), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    c.dust(120, (1, 0.9, 0.65), 0.5)
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(46)
def p46(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.5, 0.4, 0.28), (0.3, 0.22, 0.15), 0, H)
    ring_perspective(c, H * 0.45, H * 1.0, W * 0.9, W * 1.4, W * 0.5, (0.5, 0.38, 0.25))
    speed_lines(c, W * 0.5, H * 0.62, 56, 0.1, 1.1, 0.5, (0.6, 0.45, 0.3))
    c.glow(W * 0.5, H * 0.65, 420 * k, (1, 0.9, 0.7), 0.6)
    for i in range(30):                                                                                                  # debris and dust
        c.ellipse(W * (0.3 + 0.4 * ((i * 41) % 100) / 100), H * (0.6 + 0.2 * ((i * 17) % 100) / 100), 4 * k, 4 * k, (0.8, 0.65, 0.45), 0.0)
    st = Stage(W, H, c.a, ctx.seed, res=0.5)
    h = 64 * k
    bro = make("brody", h * 1.1)
    pose(bro, (W * 0.64, H * 0.50), spine=2, arms=((15, 8), (20, 10)), legs=((8, 0), (-6, 0)))
    st.figure(bro, yaw=-0.3, pitch=0.2, hand_fn=hand_builder(h, bro.spec.skin, (0.9,) * 5))
    tom = make("tommy", h * 1.2)
    pose(tom, (W * 0.38, H * 0.84), spine=-88, arms=((60, 20), (-40, 10)), legs=((-88, 4), (86, -3)), leg_z=((0.2, 0.2), (0.2, 0.2)), head_off=(-0.1, -0.1))
    st.figure(tom, yaw=0.5, pitch=0.4, hand_fn=hand_builder(h * 1.2, tom.spec.skin, (0.6,) * 5))
    rgb = st.render(light=(0.1, -0.8, 0.4), **{**NOIR, "ambient": 0.12})
    c.a = rgb
    c.vignette(0.5)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(47)
def p47(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.45, 0.33, 0.2), (0.3, 0.2, 0.13), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H) * 0.3, (0.5, 0.38, 0.25))
    for i in range(3):                                                                                                   # ropes from above: nested squares
        o = (0.03 + 0.03 * i) * W
        c.line([(o, o), (W - o, o), (W - o, H - o), (o, H - o), (o, o)], (0.92, 0.84, 0.66), 6, 0.95)
    for sx, sy in ((0.3, 0.3), (0.7, 0.7), (0.65, 0.25)):
        c.ellipse(W * sx, H * sy, 60 * k, 14 * k, (0.35, 0.24, 0.15), 0.1, 0.5, 6)
    st = Stage(W, H, c.a, ctx.seed, res=0.5)
    h = 66 * k
    tom = make("tommy", h * 1.1)
    pose(tom, (W * 0.5, H * 0.74), spine=0, arms=((30, 20), (30, 20)), legs=((8, 0), (8, 0)), arm_z=((0.6, 0.6), (0.6, 0.6)), twist=-20)
    st.figure(tom, yaw=0.0, hand_fn=hand_builder(h * 1.1, tom.spec.skin, (0.9,) * 5))
    bro = make("brody", h)
    pose(bro, (W * 0.54, H * 0.42), spine=88, arms=((100, 20), (-100, 20)), legs=((84, 4), (96, -4)), z=60, head_off=(0.1, 0.0))
    st.figure(bro, yaw=0.0, hand_fn=hand_builder(h, bro.spec.skin, (0.7,) * 5))
    rgb = st.render(light=(-0.2, -0.7, 0.5), ambient=0.14, key_color=(1.0, 0.88, 0.65), rim=0.7, contrast_steps=(0.0, 0.2, 0.7, 1.0))
    c.a = rgb
    c.vignette(0.45)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(48)
def p48(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.1, 0.07, 0.05), (0.2, 0.14, 0.09), 0, H)
    c.rect(0, H * 0.62, W, H, (0.48, 0.35, 0.22), 0.07)
    c.glow(W * 0.5, H * 0.3, 520 * k, (1.0, 0.8, 0.5), 0.5)
    st = Stage(W, H, c.a, ctx.seed, res=0.5)
    h = 60 * k
    ref = make("ref", h)
    ref.head.s.mouth_open = 0.5
    pose(ref, (W * 0.62, H * 0.80), spine=-86, arms=((80, 20), (-30, 20)), legs=((-86, 6), (-90, -4)), leg_z=((0.3, 0.2), (0.3, 0.2)), head_off=(-0.1, -0.06))
    st.figure(ref, yaw=0.5, pitch=0.3, hand_fn=hand_builder(h, ref.spec.skin, (0.4,) * 5))
    rgb = st.render(light=(0.1, -0.8, 0.4), **{**NOIR, "ambient": 0.12})
    c.a = rgb
    # Tommy's raised arm, a silhouette against the light at the upper left
    c.line([(W * 0.06, H * 0.62), (W * 0.1, H * 0.12)], (0.04, 0.03, 0.03), 34 * k, 1.0)
    c.line([(W * 0.1, H * 0.12), (W * 0.1, H * 0.02)], (0.04, 0.03, 0.03), 12 * k, 1.0)
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


def _ecg_panel(ctx, flat: bool):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.22, 0.17, 0.12), (0.12, 0.09, 0.065), 0, H)
    c.concrete(c.mask_rect(0, 0, W, H) * 0.3, (0.3, 0.22, 0.15))
    for i in range(1, 12):
        c.line([(W * i / 12, 0), (W * i / 12, H)], (0.4, 0.3, 0.22), 1, 0.2)
    ecg(c, H * 0.55, (0.12,) if not flat else (), flat_after=0.2)
    c.poly([(0, H * 0.02), (W, H * 0.14), (W, H * 0.34), (0, H * 0.22)], (0.2, 0.13, 0.08), 0.04)                      # a dark bed rail across the frame
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.5)


@panel(50)
def p50(ctx):
    return _ecg_panel(ctx, False)


@panel(51)
def p51(ctx):
    return _ecg_panel(ctx, True)


@panel(52)
def p52(ctx):
    def edit(s):
        s.lid, s.tear = 0.55, 1.0
    W, H = ctx.W, ctx.H
    c, img = _face_panel(ctx, "tommy", 0.0, 0.0, 0.0, 2.3, 0.5 - 0.17 * 2.3 * H / W * 0.98, 0.5, light=(-0.4, -0.5, 0.5), spec_edit=edit)
    return img


@panel(53)
def p53(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.03, 0.025, 0.02), (0.1, 0.075, 0.055), 0, H)
    for r, y in enumerate((0.03, 0.12, 0.22)):
        light_bars(c, H * y, (W * 0.2, W * 0.8), 160, 1, 0, 0.8)
    c.glow(W * 0.5, H * 0.25, 600 * k, (1, 0.9, 0.65), 0.7)
    st = Stage(W, H, c.a, ctx.seed, res=0.6)
    hs = hand_builder(150 * k, (0.52, 0.41, 0.34), (0.0, 0.05, 0.05, 0.05, 0.05), spread=1.2)

    def build(sd):
        sk = (0.52, 0.41, 0.34)
        sd.cone((W * 0.5, H * 1.08, 0), (W * 0.5, H * 0.52, 20), 78 * k, 56 * k, 30 * k, False, sk, "skin", 0.0, 6.0, 1, 0)
        sd.cone((W * 0.5, H * 0.96, 10), (W * 0.5, H * 0.80, 14), 66 * k, 60 * k, 8 * k, False, (0.9, 0.88, 0.8), "tape", 0.0, 3.0, 1, 3)
        hs(sd, "r", np.array([W * 0.5, H * 0.50, 24], np.float32), np.array([W * 0.5, H * 0.75, 20], np.float32))
    st.sdf(build, (0, 0, W, H), (-200, 250))
    rgb = st.render(light=(0.0, -0.9, 0.3), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    c.dust(100, (1, 0.9, 0.65), 0.5)
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(54)
def p54(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.05, 0.04, 0.03), (0.1, 0.07, 0.05), 0, H)
    c.rect(0, H * 0.9, W, H, (0.35, 0.25, 0.16), 0.06)
    for i in range(14):                                                                                                  # light falling away
        x = W * (0.16 + 0.68 * i / 13)
        c.line([(x, H * 0.04), (x, H * (0.30 + 0.1 * ((i * 7) % 5) / 5))], (1, 0.92, 0.7), 2, 0.55)
    st = Stage(W, H, c.a, ctx.seed, res=0.6)
    hs = hand_builder(150 * k, (0.52, 0.41, 0.34), (0.55, 0.4, 0.4, 0.5, 0.6), spread=0.2)

    def build(sd):
        sk = (0.52, 0.41, 0.34)
        sd.cone((W * 0.56, H * 1.08, 0), (W * 0.52, H * 0.62, 20), 70 * k, 52 * k, 30 * k, False, sk, "skin", 0.0, 6.0, 1, 0)
        hs(sd, "r", np.array([W * 0.50, H * 0.58, 24], np.float32), np.array([W * 0.53, H * 0.78, 20], np.float32))
    st.sdf(build, (0, 0, W, H), (-200, 250))
    rgb = st.render(light=(0.0, -0.9, 0.3), **{**NOIR, "ambient": 0.1})
    c.a = rgb
    c.rain(260, 120, 90, (1, 0.9, 0.7), 0.35, 1.8)
    c.vignette(0.6)
    return finish_sepia(c.a, ctx.seed, keep=0.2)


@panel(56)
def p56(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.05, 0.04, 0.03), (0.09, 0.065, 0.05), 0, H)
    tx0, tx1, ty0, ty1 = W * 0.08, W * 0.92, H * 0.08, H * 0.70
    c.rect(tx0 - 14 * k, ty0 - 12 * k, tx1 + 14 * k, ty1 + 14 * k, (0.03, 0.028, 0.03), 0.02)
    c.gradient((0.55, 0.52, 0.46), (0.3, 0.28, 0.26), ty0, ty1, mask=c.mask_rect(tx0, ty0, tx1, ty1))
    ax, ay = W * 0.5, ty0 + (ty1 - ty0) * 0.38
    c.ellipse(ax, ay - 8 * k, 44 * k, 56 * k, (0.78, 0.66, 0.5), 0.0, 1.0, 10)
    c.ellipse(ax, ay - 44 * k, 48 * k, 30 * k, (0.78, 0.62, 0.3), 0.0, 1.0, 10)
    c.poly([(ax - 100 * k, ty1 - 80 * k), (ax - 76 * k, ay + 50 * k), (ax + 76 * k, ay + 50 * k), (ax + 100 * k, ty1 - 80 * k)], (0.14, 0.17, 0.30), 0.0, blur=8)
    c.rect(tx0, ty1 - 84 * k, tx1, ty1, (0.08, 0.1, 0.18), 0.0)
    c.rect(tx0, ty1 - 84 * k, tx0 + 90 * k, ty1, (0.65, 0.12, 0.1), 0.0)
    c.text(tx0 + 45 * k, ty1 - 42 * k, "LIVE", 20, (0.95, 0.9, 0.85))
    c.rect(tx0 + 90 * k, ty1 - 84 * k, tx1, ty1, (0.9, 0.84, 0.7), 0.0)
    c.text((tx0 + 90 * k + tx1) / 2, ty1 - 58 * k, "LEGEND ADRIAN COLE", 19, (0.08, 0.06, 0.05))
    c.text((tx0 + 90 * k + tx1) / 2, ty1 - 24 * k, "HOSPITALIZED IN TAMPA", 16, (0.08, 0.06, 0.05), bold=False)
    for i in range(0, int(ty1 - ty0), 4):
        c.rect(tx0, ty0 + i, tx1, ty0 + i + 1, (0.0, 0.0, 0.0), 0.0, 0.10)
    c.glow(W * 0.5, H * 0.4, 380 * k, (0.5, 0.55, 0.65), 0.55)
    c.ellipse(W * 0.72, H * 1.0, W * 0.18, H * 0.30, (0.03, 0.025, 0.025), 0.0, 1.0, 1.0)                              # a head at the bottom of the frame
    c.vignette(0.55)
    return finish_sepia(c.a, ctx.seed, keep=0.3)


@panel(62)
def p62(ctx):
    W, H = ctx.W, ctx.H
    c = Canvas(W, H, ctx.seed)
    k = c.k
    c.gradient((0.96, 0.9, 0.78), (0.88, 0.78, 0.6), 0, H)
    c.glow(W * 0.5, H * 0.52, 420 * k, (1.0, 1.0, 0.98), 0.9)
    c.rect(0, H * 0.88, W, H, (0.86, 0.74, 0.54), 0.05)
    c.poly([(0, 0), (W * 0.34, 0), (W * 0.30, H * 0.2), (0, H * 0.25)], (0.46, 0.58, 0.80), 0.05)                       # a blue curtain edge
    c.ellipse(W * 0.5, H * 0.52, 190 * k, 130 * k, (0.8, 0.77, 0.7), 0.0, 0.45, 30)
    c.a = _blur(c.a, 26 * k)                                                                                           # everything out of focus: a newborn's first sight
    return finish_white(c.a, ctx.seed)
