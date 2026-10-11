"""The cast of Episode 1, built from the Character Reference Sheets (face, build, hair, outfit by era)."""
from __future__ import annotations

from .body import BodySpec, Figure
from .head import HeadSpec
from .style import WEB

# skin: muted, warm - matches the reference painting's grey-brown flesh tones; the sepia grade does the rest
TOMMY_SKIN = (0.52, 0.41, 0.34)
if WEB:                                               # pastel flesh: pale pink-peach for the light skins, warm caramel for Eli
    TOMMY_SKIN = (0.93, 0.76, 0.68)


def tommy43() -> tuple[HeadSpec, BodySpec]:
    """FIRST LIFE (42): thinning unkempt hair, grey at the temples, heavy soft middle, rounded shoulders, faded red gi-style tights."""
    h = HeadSpec(name="tommy", skin=TOMMY_SKIN, hair_style="thin", age=0.85, eye="monolid", lid=0.42, nose_bump=0.6, brow=1.15, jaw=1.05, gray=0.8,
                 brow_angle=0.3, head_w=0.98, neck=1.15, seed=11)
    b = BodySpec(skin=TOMMY_SKIN, sw=0.96, muscle=0.35, belly=0.55, outfit="tights", color=(0.55, 0.13, 0.11), stripe=None, pads=True,
                 boots=(0.07, 0.06, 0.06), belt=(0.06, 0.05, 0.05), arm=0.95, leg=0.95)
    return h, b


def brody() -> tuple[HeadSpec, BodySpec]:
    """Brody Vance, 22: bleached blond, spray-tanned, eager; neon trunks, white pads."""
    h = HeadSpec(name="brody", skin=(0.60, 0.43, 0.31), hair=(0.80, 0.72, 0.48), brow_color=(0.5, 0.42, 0.3), hair_style="mop", age=0.05, eye="round", lid=0.1,
                 brow=0.8, jaw=0.95, gray=0.0, brow_angle=-0.1, head_w=0.95, neck=1.0, seed=21, iris=(0.2, 0.3, 0.4))
    b = BodySpec(skin=(0.60, 0.43, 0.31), sw=1.05, muscle=0.6, belly=0.05, outfit="trunks", color=(0.45, 0.78, 0.25), pads=True,
                 boots=(0.5, 0.5, 0.48), arm=1.0, leg=1.0, tape=False)
    return h, b


def eli() -> tuple[HeadSpec, BodySpec]:
    """Eli Bell, 17: broad, softer version of his father's face, short twists; black BELL & RYU shirt."""
    h = HeadSpec(name="eli", skin=(0.30, 0.19, 0.14), hair=(0.05, 0.045, 0.045), hair_style="curly", age=0.05, eye="round", lid=0.2, brow=1.0, jaw=1.05,
                 head_w=1.05, neck=1.15, seed=31, iris=(0.15, 0.09, 0.06), brow_angle=-0.05)
    b = BodySpec(skin=(0.30, 0.19, 0.14), sw=1.15, muscle=0.5, belly=0.2, outfit="shirt", color=(0.06, 0.06, 0.065), pads=False, tape=False)
    return h, b


def referee() -> tuple[HeadSpec, BodySpec]:
    h = HeadSpec(name="ref", skin=(0.55, 0.43, 0.35), hair_style="bald", age=0.7, eye="almond", lid=0.35, brow=1.0, jaw=1.1, head_w=1.05, neck=1.2, seed=41)
    b = BodySpec(skin=(0.55, 0.43, 0.35), sw=1.0, muscle=0.3, belly=0.6, outfit="ref", color=(0.9, 0.88, 0.82), pads=False, tape=False, boots=(0.06, 0.05, 0.05))
    return h, b


def promoter() -> tuple[HeadSpec, BodySpec]:
    h = HeadSpec(name="promoter", skin=(0.56, 0.44, 0.36), hair_style="short", age=0.7, eye="almond", lid=0.4, jaw=1.1, head_w=1.1, neck=1.2, seed=51,
                 hair=(0.28, 0.26, 0.24), gray=0.6)
    b = BodySpec(skin=(0.56, 0.44, 0.36), sw=1.1, muscle=0.2, belly=0.7, outfit="none", color=(0.2, 0.25, 0.4), pads=False, tape=False)
    return h, b


_WEB_SKIN = {"tommy": (0.93, 0.76, 0.68), "brody": (0.96, 0.78, 0.64), "eli": (0.66, 0.46, 0.36), "ref": (0.92, 0.76, 0.68), "promoter": (0.92, 0.75, 0.66)}
_WEB_HAIR = {"tommy": (0.20, 0.19, 0.21), "eli": (0.07, 0.065, 0.075), "promoter": (0.42, 0.40, 0.42)}


def make(which: str, h: float) -> Figure:
    spec = {"tommy": tommy43, "brody": brody, "eli": eli, "ref": referee, "promoter": promoter}[which]()
    if WEB:
        sk = _WEB_SKIN[which]
        spec[0].skin = sk
        spec[1].skin = sk
        if which in _WEB_HAIR:
            spec[0].hair = _WEB_HAIR[which]
        spec[0].iris = (0.30, 0.55, 0.40) if which == "tommy" else spec[0].iris
    return Figure(h, spec[1], spec[0])
