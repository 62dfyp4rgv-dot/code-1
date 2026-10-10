# AI Hands

Autonomous multi-agent simulation of an AI drawing vector art stroke by stroke (Pygame + numpy).

    pip install pygame numpy
    python ai_hands.py                          # still life, 4x speed, live window
    python ai_hands.py --concept landscape      # still_life | landscape | mandala
    python ai_hands.py --image photo.jpg        # trace and draw your own image
    python ai_hands.py --color                  # colour pencils: hatch with the reference's colours
    python ai_hands.py --sketchiness 0.9 --skill 0.2   # loose overshooting outlines; skill 0 = shaky novice, 1 = master
    python ai_hands.py --timelapse lapse.gif    # also record an animated GIF of the whole process (needs Pillow)
    python ai_hands.py --headless --speed 100   # no window; writes PNG + SVG + plan.json + run_log.json
    pytest -q test_ai_hands.py                  # 41 tests

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
