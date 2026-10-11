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


def portrait(W: int = 800, H: int = 1000, seed: int = 3) -> np.ndarray:
    st = Stage(W, H, bg=np.ones((H, W, 3), np.float32) * np.array([0.97, 0.96, 0.98], np.float32), seed=seed, res=0.7)
    spec = HeadSpec(name="heroine", skin=(0.95, 0.80, 0.74), hair=(0.17, 0.16, 0.18), hair_style="long", age=0.05, eye="almond", lid=0.1,
                    brow=0.7, jaw=0.75, head_w=0.9, neck=0.9, iris=(0.25, 0.62, 0.42), seed=5)
    st.head(spec, (400, 400, 0), 400, 0.25, 0.03, 0.0, neck_to=(400, 760, -30))
    st.buf.limb((100, 980, -10), (700, 980, -10), 170, 170, (0.17, 0.22, 0.40), "cloth", flat=0.6)
    rgb = st.render(light=(-0.5, -0.6, 0.6), ambient=0.2, shadow_on_bg=0.0)
    return finish_web(rgb, seed) if WEB else rgb


if __name__ == "__main__":
    img = portrait()
    Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(sys.argv[1] if len(sys.argv) > 1 else "showcase.jpg", quality=92)
