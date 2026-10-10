# AI Hands

Autonomous multi-agent simulation of an AI drawing vector art stroke by stroke (Pygame + numpy).

    pip install pygame numpy
    python ai_hands.py                          # still life, 4x speed, live window
    python ai_hands.py --concept landscape      # still_life | landscape | mandala
    python ai_hands.py --image photo.jpg        # trace and draw your own image
    python ai_hands.py --headless --speed 100   # no window; writes PNG + SVG + plan.json + run_log.json
    pytest -q test_ai_hands.py                  # 25 tests

Keys: `+`/`-` speed, `space` pause, `h` HUD, `esc` quit (saves what is drawn so far).

Agents (all in `ai_hands.py`, talking only through a message bus, driven by one `while not job_complete:` loop):
Planner (Eye) -> Kinematics (Muscle) -> Hand -> Critic (Mind) -> refine requests back to the Planner.

## What the hand does like a person
- Slows into tight curves (two-thirds power law), eases in/out, trembles (8-12 Hz) and drifts; presses harder on darker areas.
- The pencil **wears**: lines get fatter and softer until the hand pauses to **sharpen** it (HUD: nib wear gauge).
- It **steps back** to look after each finished layer.

## Outputs
`drawing_<name>.png` (what the pencil drew), `drawing_<name>.svg` (the plan as layered cubic-Bezier vector art, one `<g>` per layer),
`plan_<name>.json` (the Planner's path queue), `run_log_<name>.json` (agent messages and the Critic's score history).

## Honest limits
- The Critic's score is a tone-correlation + edge-recall heuristic, not an aesthetic judgement. On the mandala (smooth gradients drawn
  with 1 px graphite) it lands at about 0.75-0.8 (target 0.80) because extra hatching passes eventually stop paying off, and it reports that as best effort.
- A form-following (flow-field streamline) hatching engine was tried and scored lower and looked messier than the scan-line
  hatching, so it was not kept.
