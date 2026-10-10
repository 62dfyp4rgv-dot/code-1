"""Panel compositor: camera, staging, lighting, effects. Produces one panel image + metadata."""
from __future__ import annotations

import math
import random
from dataclasses import asdict, dataclass, field, replace
from typing import Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .. import config
from ..models import CharacterSheet, Critique, PanelSpec, StyleProfile
from .background import Backdrop, draw_background
from .figures import FigureResult, canonical_expression, draw_eye_closeup, draw_figure
from .util import RGB, blur_arr, grid, mix, radial_mask, rotate_point, shade, to_arr, to_img


# --------------------------------------------------------------------------- parameters
@dataclass(frozen=True)
class RenderParams:
    """Knobs the Artist turns when the Critic sends a panel back."""
    line_weight: float = 1.0
    contrast: float = 1.0
    light_strength: float = 1.0
    rim_light: float = 0.0
    color_lock: float = 0.25      # how strongly figure colours are pulled back to the character sheet
    tint: float = 1.0             # coloured ambient spill on figures
    vignette: float = 0.30
    sharpen: float = 0.0
    grain: float = 0.05
    halftone: float = 1.0
    shadow_lift: float = 0.0      # opens crushed shadows
    glow_pool: float = 0.0        # pool of key light behind the subject: creates highlights + subject separation
    bg_lines: float = 1.0         # ink strength on background shapes
    spread: float = 0.0           # pushes multiple characters apart to stop faces overlapping
    safe_framing: bool = False
    round: int = 0

    def refined(self, c: Critique, escalate: int) -> "RenderParams":
        """Diagnostic, escalating response to the critique. Each knob is chosen from what the Critic
        measured (crushed shadows vs flat range, soft lines vs noise, colour drift vs bad framing), and
        every round pushes harder, so the loop converges instead of re-rolling dice."""
        k = 1.0 + 0.35 * escalate
        d = c.details
        p = self
        thr = config.AMAZEMENT_THRESHOLD
        if c.lighting < thr:
            flat = d.get("range", 1.0) < d.get("need_range", 0.7)
            no_dir = d.get("light_grad", 1.0) < 0.12
            no_sep = d.get("separation", 1.0) < 0.6
            if d.get("crushed", 0.0) > 0.25:      # shadows are mud: open them up a little
                p = replace(p, shadow_lift=min(0.6, p.shadow_lift + 0.15 * k), vignette=max(0.05, p.vignette - 0.06 * k))
            if flat or no_dir or no_sep:           # no highlights to speak of: put a light in the scene
                p = replace(p, glow_pool=min(1.0, p.glow_pool + 0.28 * k), light_strength=min(1.9, p.light_strength + 0.15 * k))
            if flat:
                p = replace(p, contrast=min(1.7, p.contrast + 0.08 * k))
            if no_sep:
                p = replace(p, rim_light=min(1.0, p.rim_light + 0.22 * k))
            if p is self:                          # nothing specific measured: push the general levers
                p = replace(p, light_strength=min(1.9, p.light_strength + 0.2 * k), rim_light=min(1.0, p.rim_light + 0.15 * k))
        if c.lines < thr:
            if d.get("noise", 0.0) > 0.02:
                p = replace(p, grain=0.0, halftone=max(0.0, p.halftone - 0.35 * k))
            p = replace(p, line_weight=min(2.4, p.line_weight * (1.0 + 0.14 * k)), sharpen=min(1.3, p.sharpen + 0.3 * k),
                        bg_lines=min(1.6, p.bg_lines + 0.3 * k))
        if c.anatomy is not None and c.anatomy < thr:
            p = replace(p, color_lock=min(1.0, p.color_lock + 0.25 * k), tint=max(0.0, p.tint - 0.25 * k), safe_framing=True,
                        spread=min(1.0, p.spread + 0.4 * k))
        return replace(p, round=p.round + 1)


@dataclass
class FigureMeta:
    name: str
    head_box: tuple[float, float, float, float]
    face_box: tuple[float, float, float, float]
    body_box: tuple[float, float, float, float]
    samples: dict[str, tuple[float, float, RGB]]


@dataclass
class RenderResult:
    image: Image.Image
    figures: list[FigureMeta] = field(default_factory=list)
    light_xy: tuple[float, float] = (0.0, 0.0)
    focal: tuple[float, float] = (0.5, 0.5)
    prompt: str = ""
    params: Optional[RenderParams] = None
    figure_mask: Optional[np.ndarray] = None


# --------------------------------------------------------------------------- sizing
_BASE_H = {"establishing": 520, "wide": 560, "medium": 640, "close": 760, "extreme_close": 820,
           "over_shoulder": 680, "low_angle": 760, "high_angle": 640, "insert": 380}
_PACE = {"impact": 1.25, "slow": 1.15, "beat": 0.72, "normal": 1.0}


def panel_size(spec: PanelSpec, fmt: str) -> tuple[int, int]:
    if fmt == "slides":
        return config.SLIDE_SIZE
    return config.STRIP_WIDTH, int(_BASE_H.get(spec.shot, 640) * _PACE.get(spec.pacing, 1.0) // 4 * 4)


def build_prompt(spec: PanelSpec, style: StyleProfile, sheets: dict[str, CharacterSheet], params: RenderParams) -> str:
    """The textual prompt for this panel. The procedural engine reads the structured spec directly;
    external image models receive this string plus the character reference sheets."""
    chars = "; ".join(
        f"{c.name} ({canonical_expression(c.expression)}, {c.pose}, {c.position})"
        + (f" [ref: {', '.join(sheets[c.name].traits[:4])}]" if c.name in sheets and sheets[c.name].traits else "")
        for c in spec.characters) or "no characters"
    refine = ""
    if params.round:
        refine = (f" Refinement round {params.round}: stronger directional lighting (x{params.light_strength:.2f}), "
                  f"cleaner/heavier ink line (x{params.line_weight:.2f}), character colours locked to reference ({params.color_lock:.2f}).")
    return (f"{style.name} manhwa panel, {spec.shot.replace('_', ' ')} shot, {spec.angle} angle. Location: "
            f"{spec.location_desc or spec.location}, {spec.time_of_day}, {spec.weather}. Lighting: {spec.lighting}. "
            f"Mood: {spec.mood}. Characters: {chars}. Action: {spec.summary}.{refine}")


# --------------------------------------------------------------------------- staging
def _shot_geometry(shot: str, n: int, w: int, h: int) -> dict:
    """Return head size / vertical anchor in canvas fractions for a shot with n characters."""
    crowd = {1: 1.0, 2: 0.82, 3: 0.68}.get(min(n, 3), 0.6)
    if shot == "establishing":
        return dict(head_h=0.075 * h * (1.2 if n == 1 else 1.0), head_y=0.72 * h, horizon=0.55, view="full")
    if shot == "wide":
        return dict(head_h=0.108 * h * crowd, head_y=0.30 * h + (1 - crowd) * 0.12 * h, horizon=0.5, view="full")
    if shot == "medium":
        return dict(head_h=0.25 * h * crowd, head_y=0.34 * h, horizon=0.55, view="half")
    if shot == "close":
        return dict(head_h=0.50 * h * (0.62 if n > 1 else 1.0), head_y=0.44 * h, horizon=0.6, view="bust")
    if shot == "extreme_close":
        return dict(head_h=0.92 * h * (0.55 if n > 1 else 1.0), head_y=0.5 * h, horizon=0.6, view="face")
    if shot == "over_shoulder":
        return dict(head_h=0.28 * h, head_y=0.36 * h, horizon=0.55, view="half")
    if shot == "low_angle":
        return dict(head_h=0.17 * h * crowd, head_y=0.25 * h, horizon=0.84, view="half")
    if shot == "high_angle":
        return dict(head_h=0.075 * h * crowd, head_y=0.66 * h, horizon=0.2, view="full")
    return dict(head_h=0.3 * h, head_y=0.4 * h, horizon=0.55, view="half")


_POS_X = {"left": 0.27, "center": 0.5, "right": 0.73}


def _positions(spec: PanelSpec, w: int) -> list[float]:
    chars = spec.characters
    n = len(chars)
    xs: list[float] = []
    if n == 1:
        x = _POS_X.get(chars[0].position, 0.5)
        if spec.focus_x is not None:
            x = min(0.8, max(0.2, spec.focus_x))
        xs = [x]
    elif n == 2:
        a, b = (_POS_X.get(c.position, 0.5) for c in chars)
        if abs(a - b) < 0.2:   # both asked for the same slot: split them
            a, b = 0.3, 0.7
        xs = [a, b]
    else:
        xs = [0.2 + 0.6 * i / (n - 1) for i in range(n)] if n > 1 else [0.5]
        slots = sorted(range(n), key=lambda i: _POS_X.get(chars[i].position, 0.5))
        out = [0.0] * n
        for rank, i in enumerate(slots):
            out[i] = xs[rank]
        xs = out
    return [x * w for x in xs]


# --------------------------------------------------------------------------- main
def render_panel(spec: PanelSpec, style: StyleProfile, sheets: dict[str, CharacterSheet], params: RenderParams,
                 size: tuple[int, int], seed: int) -> RenderResult:
    W, H = size
    S = config.SUPERSAMPLE
    w, h = W * S, H * S
    rng = random.Random(seed)
    n = len(spec.characters)
    present = [c for c in spec.characters if c.name in sheets]
    geo = _shot_geometry(spec.shot, len(present), w, h)

    horizon = geo["horizon"]
    if spec.angle == "low":
        horizon = max(horizon, 0.78)
    elif spec.angle == "high":
        horizon = min(horizon, 0.28)
    bd = draw_background(spec, style, rng, w, h, horizon)

    # depth-of-field for close shots
    if spec.shot in ("close", "extreme_close", "insert", "over_shoulder") or style.shading == "depth":
        r = h * (0.014 if spec.shot in ("close", "extreme_close", "insert") else 0.005) * (1.0 + style.bg_depth)
        bd.image = bd.image.filter(ImageFilter.GaussianBlur(r))

    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mask = Image.new("L", (w, h), 0)
    lw = max(1, round(style.line_weight * params.line_weight * S))
    light_side = 1 if bd.light_xy[0] > w * 0.5 else -1   # light comes from this side, shadow on the other
    figs: list[FigureResult] = []

    xs = _positions(spec, w)
    if params.spread > 0 and len(xs) > 1:
        mid = sum(xs) / len(xs)
        xs = [mid + (x - mid) * (1.0 + 0.6 * params.spread) for x in xs]
        xs = [min(w * 0.88, max(w * 0.12, x)) for x in xs]
    # draw back-to-front: smaller (farther) later entries first isn't needed; use y then x order
    order = sorted(range(len(present)), key=lambda i: xs[i] if len(xs) > i else 0)
    if spec.shot == "insert":
        if present:
            sheet = sheets[present[0].name]
            figs.append(draw_eye_closeup(layer, mask, sheet, present[0].expression, w * 0.5, h * 0.5, w * 0.62, lw))
    elif spec.shot == "over_shoulder" and len(present) >= 2:
        fg, bgc = present[0], present[1]
        fx_side = -1 if _POS_X.get(fg.position, 0.27) < 0.5 else 1
        g = _shot_geometry("over_shoulder", 2, w, h)
        hh = g["head_h"]
        bg_sheet = sheets[bgc.name]
        figs.append(draw_figure(layer, mask, bg_sheet, bgc.expression, bgc.pose, w * (0.5 - fx_side * 0.2), h * 0.38, hh * 0.9,
                                fx_side, style, lw, light_side, ss=S))
        fg_sheet = sheets[fg.name]
        fr = draw_figure(layer, mask, fg_sheet, fg.expression, fg.pose, w * (0.5 + fx_side * 0.36), h * 0.62, hh * 1.7,
                         -fx_side, style, lw, light_side, back_view=True, ss=S)
        fr.samples = {}  # a back view carries no face: nothing to verify against the sheet
        figs.append(fr)
    else:
        for i in order:
            c = present[i]
            sheet = sheets[c.name]
            hh = geo["head_h"]
            hx = xs[i]
            facing = {"left": -1, "right": 1}.get(c.facing, 0)
            if facing == 0:
                others = [xs[j] for j in range(len(present)) if j != i]
                facing = (1 if (sum(others) / len(others) if others else w / 2) > hx else -1) if others or abs(hx - w / 2) > w * 0.04 else 1
            hy = geo["head_y"]
            if spec.shot in ("establishing", "wide", "high_angle"):
                # keep feet on the ground plane, spread characters slightly in depth
                feet_y = h * (0.9 if spec.shot != "high_angle" else 0.86) - (i % 2) * h * 0.03
                hy = feet_y - sheet.head_units * hh + 0.5 * hh
            if params.safe_framing and spec.shot in ("close", "extreme_close"):
                hy = min(hy, 0.46 * h)
                hh = min(hh, 0.8 * h)
            figs.append(draw_figure(layer, mask, sheet, c.expression, c.pose, hx, hy, hh, facing, style, lw, light_side,
                                    look_up=(spec.angle == "high"), ss=S))

    # ---------------- downsample to final resolution
    bg_img = bd.image.resize((W, H), Image.LANCZOS)
    fig_rgba = layer.resize((W, H), Image.LANCZOS)
    fig_mask = np.asarray(mask.resize((W, H), Image.LANCZOS), dtype=np.float32) / 255.0
    scale = 1.0 / S
    metas = [FigureMeta(f.name, *(tuple(v * scale for v in b) for b in (f.head_box, f.face_box, f.body_box)),
                        {k: (x * scale, y * scale, c) for k, (x, y, c) in f.samples.items()}) for f in figs]  # type: ignore[arg-type]

    arr = _light_and_grade(bg_img, fig_rgba, fig_mask, bd, spec, style, params, metas, scale, rng, W, H)
    img = to_img(arr)

    # ---------------- dutch angle
    focal = _focal(metas, W, H)
    if spec.angle == "dutch" and spec.shot != "insert":
        a = 6.0 + rng.random() * 3.0
        a *= rng.choice([-1, 1])
        zoom = 1.0 + 0.021 * abs(a)
        img = img.rotate(a, resample=Image.BICUBIC, fillcolor=tuple(int(v) for v in arr[2, 2]))
        cw, ch = W / zoom, H / zoom
        box = ((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2)
        img = img.resize((W, H), Image.LANCZOS, box=box)
        c0 = (W / 2, H / 2)

        def tf(p):
            q = rotate_point(p, c0, -a)
            return (c0[0] + (q[0] - c0[0]) * zoom, c0[1] + (q[1] - c0[1]) * zoom)

        def tfb(b):
            pts = [tf((b[0], b[1])), tf((b[2], b[1])), tf((b[2], b[3])), tf((b[0], b[3]))]
            return (min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))

        for m in metas:
            m.head_box, m.face_box, m.body_box = tfb(m.head_box), tfb(m.face_box), tfb(m.body_box)
            m.samples = {k: (*tf((x, y)), c) for k, (x, y, c) in m.samples.items()}
        focal = tf(focal)
        fig_mask = None

    if params.sharpen > 0:
        img = img.filter(ImageFilter.UnsharpMask(radius=1.4, percent=int(120 * params.sharpen), threshold=2))

    return RenderResult(image=img, figures=metas, light_xy=(bd.light_xy[0] * scale, bd.light_xy[1] * scale),
                        focal=(focal[0] / W, focal[1] / H), prompt=build_prompt(spec, style, sheets, params),
                        params=params, figure_mask=fig_mask)


def _ink_pass(bg: np.ndarray, style: StyleProfile, p: RenderParams, W: int) -> np.ndarray:
    strength = min(0.9, 0.38 * (style.line_weight / 2.6) * p.bg_lines)
    if strength < 0.02:
        return bg
    lum = bg @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32) / 255.0
    gy, gx = np.gradient(lum)
    g = np.hypot(gx, gy)
    edge = np.clip((g - 0.035) / 0.10, 0, 1)
    if style.line_weight * p.bg_lines > 2.4:
        edge = np.maximum(edge, np.roll(edge, 1, 0) * 0.8)
        edge = np.maximum(edge, np.roll(edge, 1, 1) * 0.8)
    return bg * (1 - (edge * strength)[..., None]) + np.array((14, 12, 24), dtype=np.float32) * (edge * strength)[..., None]


def _focal(metas: list[FigureMeta], W: int, H: int) -> tuple[float, float]:
    if not metas:
        return (W * 0.5, H * 0.5)
    xs = [(m.face_box[0] + m.face_box[2]) / 2 for m in metas]
    ys = [(m.face_box[1] + m.face_box[3]) / 2 for m in metas]
    return (sum(xs) / len(xs), sum(ys) / len(ys))


# --------------------------------------------------------------------------- lighting & grade
_LIGHT_COL = {
    "moonlit": (150, 175, 255), "neon": (255, 70, 200), "candle": (255, 170, 80), "sunset": (255, 150, 90),
    "backlit": (255, 240, 200), "spotlight": (255, 250, 235), "dramatic": (255, 235, 200), "neutral": (255, 245, 225),
}


def _light_and_grade(bg_img: Image.Image, fig_rgba: Image.Image, fig_mask: np.ndarray, bd: Backdrop, spec: PanelSpec,
                     style: StyleProfile, p: RenderParams, metas: list[FigureMeta], scale: float, rng: random.Random,
                     W: int, H: int) -> np.ndarray:
    bg = to_arr(bg_img)
    fig = np.asarray(fig_rgba.convert("RGBA"), dtype=np.float32)
    fig_rgb, fig_a = fig[..., :3], fig[..., 3:4] / 255.0
    lx, ly = bd.light_xy[0] * scale, bd.light_xy[1] * scale
    mode = spec.lighting if spec.lighting in _LIGHT_COL else "neutral"
    lcol = np.array(_LIGHT_COL.get(mode, bd.key_color), dtype=np.float32)
    ambient = np.array(bd.ambient, dtype=np.float32) / 255.0
    ls = p.light_strength
    focal = _focal(metas, W, H)
    fx, fy = focal

    # ---- ink pass on the background shapes (what makes flat shapes read as line-art)
    bg = _ink_pass(bg, style, p, W)

    # ---- background wash and key light
    wash = 1.0 + (ambient - 1.0) * 0.35 * ls
    bg = bg * wash
    if p.glow_pool > 0.01:
        pool = radial_mask(W, H, focal[0], focal[1] - H * 0.04, max(W, H * 1.25) * 0.62, 1.15)[..., None]
        pcol = np.array(_LIGHT_COL.get(mode if mode != "neutral" else "backlit", (255, 240, 200)), dtype=np.float32)
        bg = bg + (255.0 - bg) * pool * 0.62 * p.glow_pool * (0.35 + 0.65 * pcol / 255.0)
    if mode in ("backlit", "spotlight", "dramatic", "sunset", "candle", "neon", "moonlit"):
        glow = radial_mask(W, H, fx, fy - H * 0.06, W * (0.55 if mode != "spotlight" else 0.42), 1.7)[..., None]
        k = {"backlit": 0.75, "spotlight": 0.5, "dramatic": 0.45, "sunset": 0.5, "candle": 0.5, "neon": 0.5, "moonlit": 0.4}[mode] * ls
        bg = bg + (255.0 - bg) * glow * k * (lcol / 255.0)

    # ---- figures: ambient spill, directional shading, colour lock to the sheet
    spill = 1.0 + (ambient - 1.0) * 0.55 * p.tint
    night_dim = 0.72 if bd.dark else 1.0
    shade_map = np.clip(1.08 - 0.30 * ls * np.abs(np.arange(W, dtype=np.float32) - lx) / W, 0.7, 1.15)[None, :, None]
    lit = fig_rgb * spill * (1 - (1 - night_dim) * np.clip(ls, 0.5, 1.5)) * shade_map
    key_tint = 1.0 + ((lcol / 255.0) - 1.0) * (0.35 if mode != "neutral" else 0.1) * p.tint
    lit = lit * key_tint
    lit = lit * (1 - p.color_lock) + fig_rgb * p.color_lock
    out = bg * (1 - fig_a) + lit * fig_a

    # ---- rim light (edge facing the key light)
    rim_strength = min(1.0, style.rim_light + p.rim_light + (0.35 if mode in ("backlit", "moonlit", "neon", "sunset", "dramatic") else 0.0))
    if rim_strength > 0.02 and fig_mask.max() > 0:
        d = max(2, int(W * 0.007))
        sgn = -1 if lx < W / 2 else 1  # shift the mask away from the light
        shifted = np.roll(fig_mask, shift=(int(d * 0.5), sgn * d), axis=(0, 1))
        rim = np.clip(fig_mask - shifted, 0, 1)
        rim = blur_arr(rim, 1.2)[..., None]
        rcol = lcol if mode != "neon" else np.array((60, 230, 255), dtype=np.float32)
        out = out + (rcol * 0.9 - out * 0.0) * rim * rim_strength * 1.1
        if mode in ("backlit", "moonlit", "dramatic"):   # soft halo behind the subject
            halo = blur_arr(fig_mask, W * 0.025)[..., None] * (1 - fig_a)
            out = out + lcol * halo * 0.4 * ls

    # ---- spotlight / candle falloff
    if mode in ("spotlight", "candle", "dramatic"):
        fall = radial_mask(W, H, fx, fy, max(W, H) * 0.95, 0.9)[..., None]
        floor_ = {"spotlight": 0.30, "candle": 0.4, "dramatic": 0.55}[mode]
        out = out * (floor_ + (1 - floor_) * fall)

    # ---- grade: contrast, saturation, tone
    c = max(0.5, style.contrast * p.contrast)
    x = out / 255.0
    x = 0.5 + (x - 0.5) * c
    if mode in ("dramatic", "moonlit", "candle", "spotlight") or spec.mood in ("dread", "horror", "tense", "ominous"):
        x = np.clip(x, 0, 1) ** 1.12
    if p.shadow_lift > 0:
        x = np.clip(x, 0, 1)
        x = x + p.shadow_lift * 0.22 * (1.0 - x) ** 2.5
    lumv = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]
    sat = style.saturation * (0.7 if spec.mood in ("sad", "melancholy", "lonely") else 1.0)
    x = lumv + (x - lumv) * sat
    out = np.clip(x, 0, 1) * 255.0

    # ---- screentone in the shadows (cel / webtoon feel)
    ht = style.halftone * p.halftone
    if ht > 0.02:
        period = max(5, int(W * 0.011))
        xs_, ys = grid(W, H)
        u = (xs_ + ys) / np.sqrt(2.0)
        v = (xs_ - ys) / np.sqrt(2.0)
        dots = (np.cos(2 * np.pi * u / period) * np.cos(2 * np.pi * v / period) + 1) / 2
        lumn = (0.2126 * out[..., 0] + 0.7152 * out[..., 1] + 0.0722 * out[..., 2]) / 255.0
        dark = np.clip((0.38 - lumn) / 0.38, 0, 1)
        tone = (dots > (1 - dark * 0.9)).astype(np.float32) * ht * 0.55
        out = out * (1 - tone[..., None])

    # ---- speed lines / sparkles / embers / burst
    out = _effects(out, spec, style, rng, W, H, focal, p)

    # ---- bloom for glowy styles
    if style.glow > 0.05:
        bright = np.clip((out - 190) / 65.0, 0, 1)
        out = out + blur_arr(bright * 255.0, W * 0.012) * style.glow * 0.5

    # ---- vignette + grain
    vig = p.vignette + (0.18 if spec.mood in ("dread", "horror", "tense", "ominous") else 0.0)
    xx, yy = grid(W, H)
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 1.41
    out = out * (1 - vig * np.clip(d, 0, 1) ** 2.2)[..., None]
    if p.grain > 0:
        out = out + np.random.default_rng(rng.randrange(1 << 30)).normal(0, p.grain * 14, size=(H, W, 1)).astype(np.float32)
    return np.clip(out, 0, 255)


def _effects(out: np.ndarray, spec: PanelSpec, style: StyleProfile, rng: random.Random, W: int, H: int,
             focal: tuple[float, float], p: RenderParams) -> np.ndarray:
    fx = set(spec.effects)
    if spec.mood in ("action", "intense", "battle") or spec.pacing == "impact":
        fx.add("speed_lines")
    if spec.mood in ("joy", "joyful", "happy", "romantic", "love"):
        fx.add("sparkles")
    if style.key == "fantasy_action" and "embers" not in fx and spec.mood not in ("calm", "sad"):
        fx.add("embers")
    if not fx:
        return out
    img = to_img(out).convert("RGBA")
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    cx, cy = focal
    if "speed_lines" in fx or "burst" in fx:
        for _ in range(110):
            a = rng.uniform(0, 2 * math.pi)
            r0 = rng.uniform(0.32, 0.55) * max(W, H)
            r1 = r0 + rng.uniform(0.35, 0.8) * max(W, H)
            wd = rng.uniform(0.6, 2.4)
            pts = [(cx + math.cos(a) * r0, cy + math.sin(a) * r0),
                   (cx + math.cos(a + wd / 400.0) * r1, cy + math.sin(a + wd / 400.0) * r1),
                   (cx + math.cos(a - wd / 400.0) * r1, cy + math.sin(a - wd / 400.0) * r1)]
            d.polygon(pts, fill=(255, 255, 255, rng.randint(60, 150)))
    if "sparkles" in fx:
        for _ in range(26):
            x, y, s = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(5, 16)
            col = (255, 250, 220, rng.randint(150, 240))
            d.polygon([(x, y - s), (x + s * 0.22, y - s * 0.22), (x + s, y), (x + s * 0.22, y + s * 0.22), (x, y + s),
                       (x - s * 0.22, y + s * 0.22), (x - s, y), (x - s * 0.22, y - s * 0.22)], fill=col)
    if "embers" in fx:
        for _ in range(60):
            x, y, s = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(1.2, 3.8)
            d.ellipse([x - s, y - s, x + s, y + s], fill=(255, rng.randint(120, 200), 60, rng.randint(150, 255)))
    if "dust" in fx:
        for _ in range(80):
            x, y, s = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(1, 3)
            d.ellipse([x - s, y - s, x + s, y + s], fill=(235, 225, 210, rng.randint(40, 110)))
    img.alpha_composite(ov)
    return to_arr(img)
