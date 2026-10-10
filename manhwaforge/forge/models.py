"""Shared data models passed between the agents."""
from __future__ import annotations

import time
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator

RGB = tuple[int, int, int]

SHOTS = ("establishing", "wide", "medium", "close", "extreme_close",
         "over_shoulder", "low_angle", "high_angle", "insert")
PACINGS = ("normal", "slow", "impact", "beat")
BUBBLE_KINDS = ("speech", "thought", "shout", "whisper", "caption")
POSITIONS = ("left", "center", "right")


def _pick(value: Any, allowed: tuple[str, ...], default: str) -> str:
    v = str(value or "").strip().lower().replace(" ", "_").replace("-", "_")
    return v if v in allowed else default


# --------------------------------------------------------------------------- script
class CharacterSpec(BaseModel):
    """A character as the Director understood them from the input."""
    name: str
    description: str = ""
    role: str = ""


class PanelCharacter(BaseModel):
    name: str
    expression: str = "neutral"
    pose: str = "standing"
    position: str = "center"
    facing: str = "auto"

    @field_validator("position")
    @classmethod
    def _pos(cls, v: str) -> str:
        return _pick(v, POSITIONS, "center")

    @field_validator("facing")
    @classmethod
    def _facing(cls, v: str) -> str:
        return _pick(v, ("left", "right", "auto"), "auto")


class Dialogue(BaseModel):
    speaker: Optional[str] = None
    text: str
    kind: str = "speech"

    @field_validator("kind")
    @classmethod
    def _kind(cls, v: str) -> str:
        return _pick(v, BUBBLE_KINDS, "speech")

    @field_validator("text")
    @classmethod
    def _text(cls, v: str) -> str:
        return " ".join(str(v).split())


class PanelSpec(BaseModel):
    index: int = 0
    summary: str = ""
    shot: str = "medium"
    angle: str = "eye"                 # eye | low | high | dutch
    location: str = "abstract"         # key into the background library
    location_desc: str = ""
    time_of_day: str = "day"           # dawn | day | sunset | night | indoor
    weather: str = "clear"             # clear | rain | fog | snow
    lighting: str = "neutral"          # neutral | backlit | moonlit | neon | candle | spotlight | sunset | dramatic
    mood: str = "calm"
    characters: list[PanelCharacter] = Field(default_factory=list)
    dialogue: list[Dialogue] = Field(default_factory=list)
    sfx: list[str] = Field(default_factory=list)
    effects: list[str] = Field(default_factory=list)   # speed_lines | sparkles | embers | rain ...
    pacing: str = "normal"
    sketch_ref: Optional[int] = None
    focus_x: Optional[float] = None    # 0..1 composition hint taken from a user sketch

    @field_validator("shot")
    @classmethod
    def _shot(cls, v: str) -> str:
        return _pick(v, SHOTS, "medium")

    @field_validator("angle")
    @classmethod
    def _angle(cls, v: str) -> str:
        return _pick(v, ("eye", "low", "high", "dutch"), "eye")

    @field_validator("pacing")
    @classmethod
    def _pacing(cls, v: str) -> str:
        return _pick(v, PACINGS, "normal")


class Script(BaseModel):
    title: str = "Untitled Chapter"
    logline: str = ""
    characters: list[CharacterSpec] = Field(default_factory=list)
    panels: list[PanelSpec] = Field(default_factory=list)
    source: str = "heuristic"          # heuristic | llm


# --------------------------------------------------------------------------- style
class StyleProfile(BaseModel):
    key: str
    name: str
    description: str
    line_weight: float            # ink outline width, px at 800 wide
    shading: str                  # flat | soft | cel | depth
    contrast: float               # base contrast multiplier
    saturation: float
    halftone: float               # 0..1 screentone amount in shadows
    glow: float                   # 0..1 bloom / particles
    rim_light: float              # 0..1 default rim light strength
    bg_depth: float               # 0..1 depth haze / perspective emphasis
    palette_bias: Optional[RGB] = None
    reasons: list[str] = Field(default_factory=list)


class CharacterSheet(BaseModel):
    """The persistent 'embedding' for a character: every panel renders from this."""
    name: str
    description: str = ""
    seed: int
    skin: RGB
    hair: RGB
    hair_shade: RGB
    eye: RGB
    outfit: RGB
    outfit_shade: RGB
    accent: RGB
    hair_style: str               # short | long | spiky | ponytail | bob | bun
    outfit_style: str             # casual | uniform | coat | armor | robe
    head_units: float             # figure height measured in heads
    build: str                    # slim | average | broad
    eye_shape: str               # round | sharp | soft
    traits: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- critic
class Critique(BaseModel):
    anatomy: Optional[float] = None    # None when the panel contains no characters
    lighting: float
    lines: float
    amazement: float
    passed: bool
    notes: list[str] = Field(default_factory=list)
    details: dict[str, float] = Field(default_factory=dict)


# --------------------------------------------------------------------------- job state
class PanelStatus(BaseModel):
    index: int
    state: str = "pending"      # pending | rendering | typesetting | done
    attempts: int = 0
    score: Optional[float] = None
    anatomy: Optional[float] = None
    lighting: Optional[float] = None
    lines: Optional[float] = None
    below_threshold: bool = False
    history: list[float] = Field(default_factory=list)
    shot: str = ""
    summary: str = ""


class Event(BaseModel):
    n: int
    t: float
    agent: str
    level: str
    msg: str


class JobState(BaseModel):
    id: str
    title: str = "Untitled Chapter"
    status: str = "queued"      # queued | running | halted | completed | failed | cancelled | interrupted
    stage: str = "queued"
    format: str = "webtoon"     # webtoon | slides
    style_request: str = "auto"
    series: str = ""
    target_panels: int = 12
    progress: float = 0.0
    confidence: float = 0.0
    stage_progress: dict[str, float] = Field(default_factory=dict)
    mean_amazement: Optional[float] = None
    panels: list[PanelStatus] = Field(default_factory=list)
    created: float = Field(default_factory=time.time)
    updated: float = Field(default_factory=time.time)
    halt_reason: str = ""
    error: str = ""
    style: Optional[StyleProfile] = None
    characters: list[str] = Field(default_factory=list)
    inputs: list[dict[str, Any]] = Field(default_factory=list)
    outputs: dict[str, Any] = Field(default_factory=dict)
    director_source: str = ""
    resume_note: str = ""
