# AI Hands

Autonomous multi-agent simulation of an AI drawing vector art stroke by stroke (Pygame + numpy).

    pip install pygame numpy
    python ai_hands.py                          # still life, 4x speed, live window
    python ai_hands.py --concept landscape      # still_life | landscape | mandala | fruit_bowl
    python ai_hands.py --image photo.jpg        # trace and draw your own image
    python ai_hands.py --concept fruit_bowl --detail 1 --color   # the fully detailed fruit bowl, in colour pencil
    python ai_hands.py --image painting.jpg --paint --color --res 448 --detail 0.8   # copy a painting: brush block-in, then line work
    python ai_hands.py --color                  # colour pencils: hatch with the reference's colours
    python ai_hands.py --sketchiness 0.9 --skill 0.2   # loose overshooting outlines; skill 0 = shaky novice, 1 = master
    python ai_hands.py --timelapse lapse.gif    # also record an animated GIF of the whole process (needs Pillow)
    python ai_hands.py --headless --speed 100   # no window; writes PNG + SVG + plan.json + run_log.json
    pytest -q test_ai_hands.py                  # 55 tests

Keys: `+`/`-` speed, `space` pause, `h` HUD, `esc` quit (saves what is drawn so far).
Mouse: drag the **pace slider** (log scale 0.25x-200x) or use the wheel; click the paper to pause.

Agents (all in `ai_hands.py`, talking only through a message bus, driven by one `while not job_complete:` loop):
Planner (Eye) -> Kinematics (Muscle) -> Hand -> Critic (Mind) -> refine requests back to the Planner.

## What the hand does like a person
- Slows into tight curves (two-thirds power law), eases in/out, trembles (8-12 Hz) and drifts; presses harder on darker areas.
- The pencil **wears**: lines get fatter and softer until the hand pauses to **sharpen** it (HUD: nib wear gauge).
- It re-strokes the main outlines lighter, slightly off the first line, running **past the ends** (`--sketchiness`).
- With `--color` the hatching is done in **colour pencil**, sampled from the reference and layered a little darker/more saturated.
- After finishing a layer it **waits for the Critic's verdict** before drawing on, then **steps back** to look after each finished layer.
- At the end it **erases the construction lines**: the skeleton lives on a separate guide layer, the Critic asks the Hand to
  rub it out (`erase_guides`), the Hand replies `guides_erased`, and only then is the job signed off.

## Outputs
`drawing_<name>.png` (what the pencil drew), `drawing_<name>.svg` (the plan as layered cubic-Bezier vector art, one `<g>` per layer),
`lapse.gif` (with `--timelapse`), `plan_<name>.json` (the Planner's path queue), `run_log_<name>.json` (agent messages and the Critic's score history).

## Honest limits
- The Critic's score is a tone-correlation + edge-recall heuristic, not an aesthetic judgement. On the mandala (smooth gradients drawn
  with 1 px graphite) it lands at about 0.75-0.8 (target 0.80) because extra hatching passes eventually stop paying off, and it reports that as best effort.
- A form-following (flow-field streamline) hatching engine was tried and scored lower and looked messier than the scan-line
  hatching, so it was not kept.
- The plan is independent of playback speed (the Hand holds still while the Critic measures a finished layer, and every
  segment is stamped exactly once), so a drawing at 400x is the same plan as one at 1x.
- Colour mode uses the built-in palette for the three procedural concepts (they are monochrome references); the sky of the
  landscape stays paper-white because it is too light to be hatched.

## Fruit bowl (`--concept fruit_bowl`, best with `--detail 1 --color`)
A small ray-traced reference scene: a striped bowl with a red apple, an orange, a green apple and a leaf, a pear, a lemon, a banana
and a bunch of grapes on a wooden table, lit by one lamp (cast shadows, glossy highlights). Examples in `examples/`.
- **The Eye is given an object map** for this scene (which object each pixel belongs to), so silhouettes are exact and every object
  gets its own hatching direction (neighbours never share one). This is a property of the procedural reference, not something
  the program works out from a photo; `--image` traces still use plain edge detection and one hatch direction.
- Peel dimples and lenticels are added as small light marks; highlights are left as bare paper.
- `--detail 0..1` sets how much of what the Eye sees is drawn in the first pass (0 = economical, 1 = fully detailed).

## Copying a painting (`--paint`, `--res`)
`--paint` adds a **masses** layer between the skeleton and the contours: the picture is quantised into 12 colour masses (k-means,
clustered mostly on lightness so JPEG hue noise cannot split a mass), and a broad soft brush blocks them in lightest first, darks
last on top, with several translucent coats on the darkest masses (hair). Paper-white background is left bare. The usual contour
and detail line work then goes over the paint. Add `--color` for the picture's own colours, or leave it off for a grey ink wash.
`--res 448` analyses at a finer grid so thin strands and facial features survive. `examples/portrait_*` show a stylised portrait
copied this way next to the original (`portrait_comparison.png`).
Honest limits: the result is a posterised, outlined interpretation. It keeps the composition, the solid black hair mass, the
muted skin tones and the main features, but not the soft blending, the fine scratch/scar marks, the earring or the wispy
individual strands of the original, and the figure is fitted inside a square canvas (so it is smaller than in the source).
