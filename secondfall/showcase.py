"""Style showcase: one portrait of a long-haired heroine in whatever SF_STYLE is active.
    SF_STYLE=inkwash python -m secondfall.showcase out.jpg"""
from __future__ import annotations

import sys

import numpy as np
from PIL import Image

from .grade import finish_web
from .head import HeadSpec
from .stage import Stage
from .style import WEB


def bust(st: Stage, spec: HeadSpec, cx: float, cy: float, h: float, yaw=0.0, pitch=0.0, roll=0.0, cloth=(0.17, 0.22, 0.40)) -> None:
    """A head with a human-length neck and sloping shoulders (trapezius into the neck), sized by head height `h`."""
    st.head(spec, (cx, cy, 0), h, yaw, pitch, roll, neck_to=(cx, cy + 0.98 * h, -0.1 * h))

    def sh(sd):
        sd.ellipsoid((cx, cy + 1.42 * h, -0.2 * h), (1.15 * h, 0.55 * h, 0.5 * h), (0, 0, 0), 0.3 * h, False, cloth, "cloth", 0.0, 6.0, 1, 1)
        for sg in (-1, 1):
            sd.cone((cx + sg * 0.16 * h, cy + 0.78 * h, -0.12 * h), (cx + sg * 0.85 * h, cy + 1.10 * h, -0.12 * h), 0.2 * h, 0.34 * h, 0.2 * h, False, cloth, "cloth", 0.0, 6.0, 1, 1)
    st.sdf(sh, (0, cy + 0.3 * h, st.W, st.H * 1.5), (-1.2 * h, 1.2 * h))


def heroine() -> HeadSpec:
    return HeadSpec(name="heroine", skin=(0.95, 0.80, 0.74), hair=(0.09, 0.085, 0.10), hair_style="long", age=0.05, eye="almond", lid=0.1,
                    brow=0.7, jaw=0.92, head_w=1.0, neck=0.9, iris=(0.25, 0.62, 0.42), seed=5)


def portrait(W: int = 800, H: int = 1000, seed: int = 3, yaw: float = 0.2) -> np.ndarray:
    st = Stage(W, H, bg=np.ones((H, W, 3), np.float32) * np.array([0.97, 0.96, 0.98], np.float32), seed=seed, res=0.7)
    bust(st, heroine(), W / 2, H * 0.40, H * 0.46, yaw, 0.03)
    rgb = st.render(light=(-0.5, -0.6, 0.6), ambient=0.2, shadow_on_bg=0.0)
    return finish_web(rgb, seed) if WEB else rgb


if __name__ == "__main__":
    img = portrait()
    Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(sys.argv[1] if len(sys.argv) > 1 else "showcase.jpg", quality=92)
