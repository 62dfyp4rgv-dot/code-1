"""Stage: composite painted backgrounds, 3-D figures / heads, shadows, ink and the painterly finish into one panel."""
from __future__ import annotations

import math
from typing import Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .body import BodySpec, Figure, hand_builder
from .head import Head, HeadSpec
from .paintfx import Ink, ink_lines, paint_finish, shade_buf, to_img
from .r3d import Buf, _blur, fnoise
from .sdf import SDF

INK_RGB = np.array([0.055, 0.045, 0.05], np.float32)


class Stage:
    def __init__(self, W: int, H: int, bg: Optional[np.ndarray] = None, seed: int = 0, res: float = 0.55):
        self.W, self.H = int(W), int(H)
        self.bg = bg if bg is not None else np.zeros((H, W, 3), np.float32)
        self.buf = Buf(self.W, self.H)
        self.heads: list[Head] = []
        self.seed = seed
        self.res = res
        self.layers: list[tuple[np.ndarray, np.ndarray]] = []       # (rgb, alpha) painted over the figures (props in front)
        self.behind: list[tuple[np.ndarray, np.ndarray]] = []

    # ---- content -------------------------------------------------------------------------------------
    def figure(self, fig: Figure, yaw=0.0, pitch=0.0, roll=0.0, hand_fn=None, res: Optional[float] = None, head_h: Optional[float] = None) -> Figure:
        fig.render_into(self.buf, yaw, pitch, roll, res or self.res, hand_fn, head_h)
        self.heads.append(fig.head)
        return fig

    def head(self, spec: HeadSpec, c, h, yaw=0.0, pitch=0.0, roll=0.0, neck_to=None, res: Optional[float] = None) -> Head:
        hd = Head(spec)
        hd.build(self.buf, c, h, yaw, pitch, roll, neck_to=neck_to, res=res or self.res)
        self.heads.append(hd)
        return hd

    def sdf(self, fn, bbox, z_range, res: Optional[float] = None) -> None:
        """Run `fn(sdf)` to add primitives, then march them into the buffer (props, bodies in odd poses...)."""
        sd = SDF()
        fn(sd)
        sd.march(self.buf, bbox, z_range, part=self.buf.new_part(), res=res or self.res)

    # ---- rendering -------------------------------------------------------------------------------------
    def render(self, light=(-0.55, -0.6, 0.6), ambient: float = 0.14, key_color=(1.0, 0.92, 0.80), shadow_tint=(0.42, 0.34, 0.36),
               rim: float = 0.0, rim_color=(1.0, 0.8, 0.55), contrast_steps=(0.0, 0.30, 0.70, 1.0), shadow_on_bg: float = 0.55,
               ink_strength: float = 0.9, ink_scale: float = 1.0, scratch: float = 0.55, reach: float = 70.0, ao: float = 0.8,
               features: bool = True, brush: float = 1.0, grain: float = 0.5, fg_alpha_blur: float = 0.0, overlay=None) -> np.ndarray:
        b = self.buf
        a = b.alpha
        rgb_bg = self.bg
        if a.max() <= 0:
            out = rgb_bg
            return paint_finish(out, self.seed, brush * 0.6, grain)
        fg = shade_buf(b, light=light, ambient=ambient, key_color=key_color, shadow_tint=shadow_tint, rim=rim, rim_color=rim_color,
                       steps=contrast_steps, soft=0.09, ao_radius=14.0 * max(1.0, self.W / 800), ao_strength=ao, reach=reach * self.W / 800, seed=self.seed)
        # cast shadow of the figures onto the background, thrown away from the light
        L = np.asarray(light, np.float32)
        if shadow_on_bg > 0:
            dx, dy = int(-L[0] * 0.10 * self.H), int(-L[1] * 0.03 * self.H)
            sh = np.roll(np.roll(_blur(a, 10 * self.W / 800), dy, 0), dx, 1)
            rgb_bg = rgb_bg * (1 - shadow_on_bg * sh[..., None] * (1 - a[..., None]) * np.array([0.55, 0.62, 0.62], np.float32))
        al = _blur(a, fg_alpha_blur) if fg_alpha_blur > 0 else a
        rgb = rgb_bg * (1 - al[..., None]) + fg * al[..., None]
        ink = Ink(self.W, self.H, seed=self.seed + 7)
        if features:
            for hd in self.heads:
                rgb = hd.features(rgb, b, ink, scale=max(1.0, self.W / 800))
        ln = ink_lines(b, scale=self.W / 800, seed=self.seed, scratch=scratch)
        rgb = rgb * (1 - ln[..., None] * ink_strength) + INK_RGB * ln[..., None] * ink_strength
        rgb = ink.composite_onto(rgb)
        return paint_finish(rgb, self.seed, brush, grain)
