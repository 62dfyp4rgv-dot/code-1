"""Panel registry + render driver."""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from typing import Callable

import numpy as np
from PIL import Image

PANELS: dict[int, Callable] = {}


@dataclass
class Ctx:
    n: int
    W: int          # render width in px
    H: int
    S: float        # render scale relative to the logical panel size
    seed: int
    lw: int         # logical width
    lh: int


def panel(n: int):
    def deco(fn):
        PANELS[n] = fn
        return fn
    return deco


def render_panel(n: int, lw: int, lh: int, S: float = 1.0, out_dir: str = "/tmp/sf/out") -> str:
    from . import scenes_a  # noqa: F401  (registers panels)
    try:
        from . import scenes_b  # noqa: F401
    except ImportError:
        pass
    try:
        from . import scenes_c  # noqa: F401
    except ImportError:
        pass
    try:
        from . import scenes_d  # noqa: F401
    except ImportError:
        pass
    ctx = Ctx(n, int(round(lw * S)), int(round(lh * S)), S, 1000 + n, lw, lh)
    t = time.time()
    img = PANELS[n](ctx)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"p{n:02d}.jpg")
    Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(path, quality=90)
    return f"p{n:02d} {time.time() - t:.1f}s"
