# secondfall - a procedural redraw of "Second Fall", Episode 1

Renders the 53 illustrated panels of the Episode 1 webtoon strip (the 64-panel page keeps its original lettering and layout)
in a noir, sepia, ink-lined style, built entirely in code (numpy + Pillow, no image model).

    python -m pip install numpy pillow
    SF_OUT=out python run.py 1.5 5 6 7        # S = scale vs the 800 px layout; then the panel numbers

## How it is built
- `r3d.py`, `sdf.py` - a small renderer: signed-distance volumes with smooth blends (so shoulders melt into arms), ray-marched into a
  z-buffer with normals, then lit with a painterly ramp, ambient occlusion, screen-space cast shadows and rim light.
- `head.py` - a parametric head (sculpted face planes, carved eye sockets, age) with drawn features (eyes, brows, mouth, lines, hair)
  projected through the head's rotation. `body.py`, `poses.py` - joint-driven bodies, hands with fingers, wrestling gear.
- `world.py` - 2-D painting toolkit for backgrounds (brick, planks, curtains, crowds, light cones, rain, dust).
- `scenes_a..d.py` - one scene function per panel. `cast.py` - the cast from the Character Reference Sheets.
- `grade.py` - the first-life sepia grade and film finish.

## Honest limits
The characters are stylised 3-D sculpts, not hand-drawn manhwa figures: faces are expressive but simple, bodies are mannequin-like
in flat light (the scenes therefore use backlit noir lighting), and some action holds are approximate. Backgrounds and lighting are
the strongest part. A real image model would do much better on faces and anatomy.
