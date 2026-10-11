# secondfall - a procedural redraw of "Second Fall", Episode 1

Renders the 53 illustrated panels of the Episode 1 webtoon strip (the 64-panel page keeps its original lettering and layout)
in a Korean-webtoon look (pastel flesh, thin warm-brown line art, two-tone cel shading with rosy shadows, big detailed eyes, fine
hair strands, high-key colour), built entirely in code (numpy + Pillow, no image model). The earlier noir/sepia look is still
available: `SF_STYLE=noir python run.py ...` (default is `webtoon`; see `style.py`).

    python -m pip install numpy pillow
    SF_OUT=out python run.py 1.5 5 6 7        # S = scale vs the 800 px layout; then the panel numbers

## Styles
`SF_STYLE=<name>` picks the look (default `webtoon`): `webtoon`, `noir`, `inkwash`, `comic`, `watercolor`, `riso`, `dream`, `pixel`, `neon`.
Everything except `noir` shares the webtoon base (pastel flesh, big eyes, strand hair, thin lines); `style.py` holds per-style shading
constants and `looks.py` the whole-panel post look. `python -m secondfall.showcase out.jpg` renders the long-haired heroine portrait in
the active style (hair style `long` is available on any `HeadSpec`).

## How it is built
- `r3d.py`, `sdf.py` - a small renderer: signed-distance volumes with smooth blends (so shoulders melt into arms), ray-marched into a
  z-buffer with normals, then lit with a painterly ramp, ambient occlusion, screen-space cast shadows and rim light.
- `head.py` - a parametric head (sculpted face planes, carved eye sockets, age) with drawn features (eyes, brows, mouth, lines, hair)
  projected through the head's rotation. `body.py`, `poses.py` - joint-driven bodies, hands with fingers, wrestling gear.
- `world.py` - 2-D painting toolkit for backgrounds (brick, planks, curtains, crowds, light cones, rain, dust).
- `scenes_a..d.py` - one scene function per panel. `cast.py` - the cast from the Character Reference Sheets.
- `grade.py` - the webtoon grade (`finish_web`) and the original sepia grade / film finish (used when `SF_STYLE=noir`).
- `style.py` - the global style switch (`webtoon` | `noir`) read by the stage, head painter, cast colours and grade.

## Honest limits
The characters are stylised 3-D sculpts, not hand-drawn manhwa figures: faces are expressive but simple, bodies are mannequin-like
and the backgrounds were authored in a dusky palette that the webtoon grade only partly brightens, and some action holds are approximate. Backgrounds and lighting are
the strongest part. A real image model would do much better on faces and anatomy.
