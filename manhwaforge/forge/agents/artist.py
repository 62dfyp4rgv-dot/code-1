"""Agent 2: the Style & Asset Engine ("the Artist").

Responsibilities
* analyse reference files and map them to a manhwa art style (styles.choose_style)
* keep a persistent character bank: one CharacterSheet + reference-sheet image per character,
  reused by every panel of the chapter (and every later chapter of the same series)
* generate each panel through a pluggable ImageProvider, send it to the Critic, and re-prompt /
  refine until it clears the Amazement threshold
"""
from __future__ import annotations

import json
import re
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional, Protocol

from PIL import Image, ImageDraw

from .. import config
from ..models import CharacterSheet, CharacterSpec, Critique, PanelSpec, StyleProfile
from ..render.figures import EXPRESSIONS, FigureResult, draw_figure
from ..render.panel import RenderParams, RenderResult, panel_size, render_panel
from ..render.util import get_font
from ..styles import design_character, stable_seed
from .critic import Critic


def slug(text: str, default: str = "x") -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
    return s[:48] or default


# --------------------------------------------------------------------------- providers
class ImageProvider(Protocol):
    """Anything that can turn a structured panel spec (+ prompt + character references) into an image.

    `ProceduralProvider` ships in the box so the whole pipeline runs offline. To use a hosted
    image model, implement `generate` (send `result_prompt` and the sheets' reference images to the
    model, return a RenderResult whose `figures` metadata describes where faces are, so the
    Typesetter and Critic still work) and register it in PROVIDERS.
    """
    name: str

    def generate(self, spec: PanelSpec, style: StyleProfile, sheets: dict[str, CharacterSheet],
                 params: RenderParams, size: tuple[int, int], seed: int) -> RenderResult: ...


class ProceduralProvider:
    name = "procedural"

    def generate(self, spec, style, sheets, params, size, seed) -> RenderResult:
        return render_panel(spec, style, sheets, params, size, seed)


PROVIDERS: dict[str, Callable[[], ImageProvider]] = {"procedural": ProceduralProvider}


def get_provider(name: Optional[str] = None) -> ImageProvider:
    import os
    key = name or os.environ.get("MANHWAFORGE_IMAGE_PROVIDER", "procedural")
    if key not in PROVIDERS:
        raise ValueError(f"unknown image provider '{key}' (registered: {', '.join(PROVIDERS)})")
    return PROVIDERS[key]()


# --------------------------------------------------------------------------- character bank
class CharacterBank:
    """Persistent character reference store: data/series/<series>/characters/<name>.{json,png}.

    This is the consistency mechanism. Every panel renders from the stored sheet, so a character's
    hair, eyes, skin, outfit and proportions are fixed once and reused across panels and chapters.
    (With a diffusion backend the same record would hold the LoRA / embedding / reference image.)
    """

    def __init__(self, series_key: str, root: Optional[Path] = None):
        self.series_key = series_key
        self.dir = (root or config.DATA_DIR) / "series" / slug(series_key, "series") / "characters"
        self._lock = threading.Lock()

    def path(self, name: str) -> Path:
        return self.dir / f"{slug(name)}.json"

    def ensure(self, specs: list[CharacterSpec], style: StyleProfile,
               log: Callable[[str], None] = lambda m: None) -> dict[str, CharacterSheet]:
        sheets: dict[str, CharacterSheet] = {}
        with self._lock:
            self.dir.mkdir(parents=True, exist_ok=True)
            for spec in specs:
                p = self.path(spec.name)
                sheet: Optional[CharacterSheet] = None
                if p.exists():
                    try:
                        sheet = CharacterSheet.model_validate_json(p.read_text())
                    except Exception:   # corrupt record: rebuild it
                        sheet = None
                    if sheet and spec.description.strip() and sheet.description.strip() != spec.description.strip():
                        log(f"{spec.name}: description changed, redesigning sheet")
                        sheet = None
                    elif sheet:
                        log(f"{spec.name}: reusing stored character sheet")
                if sheet is None:
                    sheet = design_character(spec.name, spec.description, self.series_key, style)
                    p.write_text(sheet.model_dump_json(indent=2))
                    self.render_reference(sheet, style).save(self.dir / f"{slug(spec.name)}.png")
                    log(f"{spec.name}: new sheet ({', '.join(sheet.traits[:4])})")
                elif not (self.dir / f"{slug(spec.name)}.png").exists():
                    self.render_reference(sheet, style).save(self.dir / f"{slug(spec.name)}.png")
                sheets[spec.name] = sheet
        return sheets

    @staticmethod
    def render_reference(sheet: CharacterSheet, style: StyleProfile) -> Image.Image:
        """Turn-around style reference sheet: full body + four expression busts."""
        W, H = 1100, 640
        img = Image.new("RGBA", (W, H), (244, 241, 236, 255))
        layer = Image.new("RGBA", (W * 2, H * 2), (0, 0, 0, 0))
        mask = Image.new("L", layer.size, 0)
        lw = max(2, round(style.line_weight * 2))
        h = 78 * 2
        draw_figure(layer, mask, sheet, "neutral", "standing", 170 * 2, (60 + 39) * 2, h, 1, style, lw, -1)
        for i, ex in enumerate(("neutral", "smile", "angry", "sad")):
            cx = (470 + (i % 2) * 300) * 2
            cy = (170 + (i // 2) * 270) * 2
            draw_figure(layer, mask, sheet, ex, "standing", cx, cy, 150 * 2, 1, style, lw, -1)
        layer = layer.resize((W, H), Image.LANCZOS)
        img.alpha_composite(layer)
        d = ImageDraw.Draw(img)
        d.rectangle([0, 0, W, 40], fill=(30, 28, 40, 255))
        d.text((14, 8), f"{sheet.name}  ·  {', '.join(sheet.traits[:5])}", font=get_font("bold", 20), fill=(240, 240, 240, 255))
        for i, (label, col) in enumerate((("skin", sheet.skin), ("hair", sheet.hair), ("eyes", sheet.eye), ("outfit", sheet.outfit), ("accent", sheet.accent))):
            x = 860 + i * 48 - 120
            d.rectangle([x, H - 60, x + 40, H - 20], fill=col + (255,), outline=(20, 20, 30, 255))
            d.text((x + 2, H - 18), label, font=get_font("regular", 11), fill=(40, 40, 50, 255))
        return img.convert("RGB")


# --------------------------------------------------------------------------- painting loop
@dataclass
class PanelArt:
    index: int
    result: RenderResult
    critique: Critique
    attempts: int
    below_threshold: bool
    history: list[float] = field(default_factory=list)
    prompts: list[str] = field(default_factory=list)


class Artist:
    name = "Artist"

    def __init__(self, provider: ImageProvider, critic: Critic, max_attempts: int = config.MAX_REFINE_ATTEMPTS):
        self.provider = provider
        self.critic = critic
        self.max_attempts = max_attempts

    def paint_panel(self, spec: PanelSpec, style: StyleProfile, sheets: dict[str, CharacterSheet], fmt: str, job_seed: int,
                    on_attempt: Callable[[int, int, Critique, RenderResult], None] = lambda *a: None,
                    checkpoint: Callable[[], None] = lambda: None) -> PanelArt:
        """Generate → critique → refine until the panel clears the Amazement threshold."""
        size = panel_size(spec, fmt)
        seed = stable_seed("panel", job_seed, spec.index)
        params = RenderParams()
        best: Optional[tuple[RenderResult, Critique, RenderParams]] = None
        history: list[float] = []
        prompts: list[str] = []
        attempts = 0
        for attempt in range(self.max_attempts):
            checkpoint()
            result = self.provider.generate(spec, style, sheets, params, size, seed)
            critique = self.critic.score(result, spec, sheets)
            attempts = attempt + 1
            history.append(critique.amazement)
            prompts.append(result.prompt)
            if best is None or critique.amazement > best[1].amazement:
                best = (result, critique, params)
            on_attempt(spec.index, attempts, critique, result)
            if critique.passed:
                break
            # hill-climb: always refine from the best attempt so far, so a refinement that backfires
            # is simply discarded; the escalation factor guarantees each round differs from the last
            params = best[2].refined(best[1], attempt)
        assert best is not None
        return PanelArt(spec.index, best[0], best[1], attempts, not best[1].passed, history, prompts)
