"""Agent 4: the Critic. Scores every rendered panel on a 0-10 "Amazement Score".

The score is computed from the panel's actual pixels plus the staging metadata, using three
measurable components:

* anatomy / identity consistency - are the characters all present, fully framed, un-occluded,
  and do hair/skin/outfit colours still match the character sheet after lighting?
* lighting drama - tonal range, key/fill separation, directional light structure, and how well
  the subject separates from the background.
* line quality - ink contour crispness, closed outlines around figures, and freedom from noise.

These are image-statistics heuristics, not a learned aesthetic model. They are deterministic,
fast, and good at catching washed-out lighting, mushy linework and character-colour drift;
they cannot judge taste. A vision-model critic can be slotted in behind the same `Critic.score`
signature.
"""
from __future__ import annotations

import colorsys
import math
from typing import Optional

import numpy as np
from PIL import Image

from .. import config
from ..models import CharacterSheet, Critique, PanelSpec
from ..render.panel import RenderResult

W_ANATOMY, W_LIGHT, W_LINES = 0.34, 0.36, 0.30

# how much tonal range each mood needs to read as "dramatic enough"
_MOOD_RANGE = {"calm": 0.62, "joyful": 0.62, "romantic": 0.6, "sad": 0.62, "tense": 0.78, "dread": 0.8,
               "action": 0.82, "mystery": 0.74}


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _ramp(x: float, lo: float, hi: float) -> float:
    """0 at lo, 1 at hi, linear between."""
    return _clamp01((x - lo) / (hi - lo)) if hi != lo else float(x >= hi)


class Critic:
    name = "Critic"

    def __init__(self, threshold: float = config.AMAZEMENT_THRESHOLD):
        self.threshold = threshold

    # ------------------------------------------------------------------ public
    def score(self, result: RenderResult, spec: PanelSpec, sheets: dict[str, CharacterSheet]) -> Critique:
        arr = np.asarray(result.image.convert("RGB"), dtype=np.float32) / 255.0
        lum = arr @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
        H, W = lum.shape
        notes: list[str] = []
        details: dict[str, float] = {}

        anatomy = self._anatomy(arr, result, spec, sheets, notes, details)
        lighting = self._lighting(lum, result, spec, notes, details)
        lines = self._lines(lum, result, notes, details)

        parts = [(lighting, W_LIGHT), (lines, W_LINES)]
        if anatomy is not None:
            parts.append((anatomy, W_ANATOMY))
        total_w = sum(w for _, w in parts)
        amazement = sum(s * w for s, w in parts) / total_w
        amazement = round(amazement, 2)
        return Critique(anatomy=None if anatomy is None else round(anatomy, 2), lighting=round(lighting, 2),
                        lines=round(lines, 2), amazement=amazement, passed=amazement >= self.threshold,
                        notes=notes, details={k: round(v, 3) for k, v in details.items()})

    # ------------------------------------------------------------------ anatomy / identity
    def _anatomy(self, arr: np.ndarray, res: RenderResult, spec: PanelSpec, sheets: dict[str, CharacterSheet],
                 notes: list[str], details: dict[str, float]) -> Optional[float]:
        expected = [c.name for c in spec.characters if c.name in sheets]
        if not expected:
            return None
        H, W = arr.shape[:2]
        by_name = {f.name: f for f in res.figures}
        scores: list[float] = []
        for name in expected:
            f = by_name.get(name)
            if f is None:
                scores.append(0.0)
                notes.append(f"anatomy: {name} missing from render")
                continue
            # 1. framing: the face must be inside the frame (close-ups may crop hair, never the face)
            fb = f.face_box
            vis_w = max(0.0, min(fb[2], W) - max(fb[0], 0.0))
            vis_h = max(0.0, min(fb[3], H) - max(fb[1], 0.0))
            visible = (vis_w * vis_h) / max(1e-6, (fb[2] - fb[0]) * (fb[3] - fb[1]))
            framing = _ramp(visible, 0.55, 0.95)
            # 2. palette fidelity: hue/saturation of sampled regions vs the sheet
            sample_scores = []
            sheet = sheets[name]
            truth = {"skin": sheet.skin, "hair": sheet.hair, "outfit": sheet.outfit}
            for key, (x, y, _renderer_colour) in f.samples.items():
                # judged against the character bank's sheet, never against what the renderer says it used
                expect = truth.get(key)
                if expect is None:
                    continue
                px, py = int(round(x)), int(round(y))
                if not (3 <= px < W - 3 and 3 <= py < H - 3):
                    continue
                patch = arr[py - 3:py + 4, px - 3:px + 4].reshape(-1, 3).mean(axis=0)
                sample_scores.append(self._colour_fidelity(patch, expect))
            palette = float(np.mean(sample_scores)) if sample_scores else (1.0 if not f.samples else 0.6)
            details[f"palette_{name}"] = palette
            # 3. occlusion: faces overlapping each other means a broken staging
            occl = 1.0
            for other in res.figures:
                if other is f or not other.samples:
                    continue
                ob = other.face_box
                ix = max(0.0, min(fb[2], ob[2]) - max(fb[0], ob[0]))
                iy = max(0.0, min(fb[3], ob[3]) - max(fb[1], ob[1]))
                frac = (ix * iy) / max(1e-6, (fb[2] - fb[0]) * (fb[3] - fb[1]))
                occl = min(occl, 1.0 - _ramp(frac, 0.1, 0.5))
            s = 10.0 * (0.30 * framing + 0.50 * palette + 0.20 * occl)
            # identity can't be better than its weakest link by much
            s = min(s, 10.0 * min(framing, palette, occl) + 4.0)
            scores.append(s)
            if palette < 0.6:
                notes.append(f"anatomy: {name}'s colours drifted from the character sheet under this lighting")
            if framing < 0.7:
                notes.append(f"anatomy: {name}'s face is cropped by the frame")
            if occl < 0.7:
                notes.append("anatomy: faces overlap")
        return float(np.mean(scores))

    @staticmethod
    def _colour_fidelity(rgb01: np.ndarray, expect: tuple[int, int, int]) -> float:
        eh, es, ev = colorsys.rgb_to_hsv(*[c / 255.0 for c in expect])
        ah, as_, av = colorsys.rgb_to_hsv(*[float(c) for c in rgb01])
        # "crushed": rendered far darker than the sheet colour, so identity is unreadable
        # (a sheet colour that is itself dark is not penalised for being dark)
        crushed = _ramp(av / max(ev, 0.05), 0.40, 0.75)
        # near-black / grey / white sheet colours carry no reliable hue: compare value instead
        if es < 0.15 or ev < 0.22:
            return _clamp01(1.0 - abs(av - ev) * (1.8 if ev < 0.22 else 1.4)) * (0.6 + 0.4 * crushed)
        dh = min(abs(ah - eh), 1 - abs(ah - eh)) * 360.0
        hue = 1.0 - _ramp(dh, 8.0, 38.0)
        sat = 1.0 - _ramp(abs(as_ - es), 0.15, 0.55)
        val = 1.0 - _ramp(abs(av - ev), 0.18, 0.55)       # fair skin must not turn brown just because it is night
        return _clamp01((0.4 * hue + 0.2 * sat + 0.4 * val) * (0.5 + 0.5 * crushed))

    # ------------------------------------------------------------------ lighting
    def _lighting(self, lum: np.ndarray, res: RenderResult, spec: PanelSpec, notes: list[str],
                  details: dict[str, float]) -> float:
        H, W = lum.shape
        p2, p10, p50, p90, p98 = np.percentile(lum, [2, 10, 50, 90, 98])
        need = _MOOD_RANGE.get(spec.mood, 0.7)
        rng_score = _ramp(float(p98 - p2), 0.25, need)
        # directional structure: large-scale luminance variation (light has a direction / falloff)
        small = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).resize((24, 16), Image.BILINEAR), dtype=np.float32) / 255.0
        grad = float(small.std())
        dir_score = _ramp(grad, 0.05, 0.17)
        # key vs fill: bright highlights should clearly exceed the mid-tones
        keyfill = _ramp(float(p98 - p50), 0.18, 0.42)
        # subject separation (rim light / contrast against backdrop)
        sep = 0.7
        if res.figure_mask is not None and res.figure_mask.max() > 0:
            m = res.figure_mask > 0.5
            if m.sum() > 200 and (~m).sum() > 200:
                fig_l = float(lum[m].mean())
                bg_l = float(lum[~m].mean())
                # ring just outside the figure
                from PIL import ImageFilter
                mi = Image.fromarray((m * 255).astype(np.uint8))
                ring = np.asarray(mi.filter(ImageFilter.MaxFilter(15)), dtype=bool) & ~m
                edge_contrast = abs(float(lum[ring].mean()) - fig_l) if ring.any() else abs(fig_l - bg_l)
                sep = _ramp(max(abs(fig_l - bg_l), edge_contrast), 0.06, 0.26)
        crushed = float((lum < 0.04).mean())
        blown = float((lum > 0.97).mean())
        details.update(range=float(p98 - p2), need_range=need, light_grad=grad, keyfill=float(p98 - p50), separation=sep,
                       crushed=crushed, blown=blown)
        clip_pen = _ramp(max(crushed - 0.35, 0.0) + max(blown - 0.30, 0.0), 0.0, 0.35)
        s = 10.0 * (0.32 * rng_score + 0.24 * dir_score + 0.22 * keyfill + 0.22 * sep)
        s = s * (1.0 - 0.45 * clip_pen) + 0.0
        # reward floor for well-structured light so a perfect-range panel can reach the top
        s = min(10.0, s + 0.6 * _ramp(rng_score + dir_score + keyfill + sep, 3.0, 4.0))
        if rng_score < 0.7:
            notes.append("lighting: tonal range too flat")
        if dir_score < 0.55:
            notes.append("lighting: no clear light direction")
        if sep < 0.5:
            notes.append("lighting: subject doesn't separate from the background")
        return s

    # ------------------------------------------------------------------ lines
    def _lines(self, lum: np.ndarray, res: RenderResult, notes: list[str], details: dict[str, float]) -> float:
        H, W = lum.shape
        gy, gx = np.gradient(lum)
        g = np.hypot(gx, gy)
        strong = g > 0.10
        density = float(strong.mean())
        # crispness: share of strong-edge pixels that are local maxima along the gradient (thin, sharp lines)
        gmax = np.maximum.reduce([np.roll(g, s, a) for a in (0, 1) for s in (-1, 1)])
        crisp = float(((g >= 0.9 * gmax) & strong).sum() / max(1, strong.sum()))
        # ink contrast: how hard the strongest edges are
        peak = float(np.percentile(g, 99))
        # noise: fine high-frequency energy in areas with no edges
        lap = np.abs(4 * lum - np.roll(lum, 1, 0) - np.roll(lum, -1, 0) - np.roll(lum, 1, 1) - np.roll(lum, -1, 1))
        flat = ~(np.maximum.reduce([np.roll(strong, s, a) for a in (0, 1) for s in (-2, 2)]) | strong)
        noise = float(lap[flat].mean()) if flat.any() else 0.0
        # contour closure around figures: outline should exist along the silhouette boundary
        closure = 0.75
        if res.figure_mask is not None and res.figure_mask.max() > 0:
            m = res.figure_mask > 0.5
            from PIL import ImageFilter
            mi = Image.fromarray((m * 255).astype(np.uint8))
            boundary = np.asarray(mi.filter(ImageFilter.MaxFilter(5)), dtype=bool) & ~np.asarray(mi.filter(ImageFilter.MinFilter(5)), dtype=bool)
            inner = boundary.copy()
            inner[:4], inner[-4:], inner[:, :4], inner[:, -4:] = False, False, False, False   # frame crop is not a missing line
            if inner.sum() > 100:
                near_edge = np.maximum.reduce([np.roll(strong, (dy, dx), (0, 1)) for dy in (-2, 0, 2) for dx in (-2, 0, 2)])
                closure = float((near_edge & inner).sum() / inner.sum())
        density_s = _ramp(density, 0.006, 0.03) * (1.0 - _ramp(density, 0.20, 0.38))
        crisp_s = _ramp(crisp, 0.28, 0.5)
        peak_s = _ramp(peak, 0.12, 0.30)
        noise_s = 1.0 - _ramp(noise, 0.012, 0.05)
        closure_s = _ramp(closure, 0.35, 0.8)
        details.update(edge_density=density, crispness=crisp, peak=peak, noise=noise, closure=closure)
        s = 10.0 * (0.22 * density_s + 0.22 * crisp_s + 0.18 * peak_s + 0.18 * noise_s + 0.20 * closure_s)
        if closure_s < 0.55:
            notes.append("lines: weak or broken ink contour around figures")
        if crisp_s < 0.5:
            notes.append("lines: edges are soft")
        if noise_s < 0.6:
            notes.append("lines: noisy texture")
        return s
