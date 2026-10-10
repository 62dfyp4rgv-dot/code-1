# AI Hands

Autonomous multi-agent simulation of an AI drawing vector art stroke by stroke (Pygame + numpy).

    pip install pygame numpy
    python ai_hands.py                          # still life, 4x speed, live window
    python ai_hands.py --concept landscape      # still_life | landscape | mandala
    python ai_hands.py --image photo.jpg        # trace and draw your own image
    python ai_hands.py --headless --speed 100   # no window; writes PNG + plan.json + run_log.json
    pytest -q test_ai_hands.py                  # 19 tests

Keys: `+`/`-` speed, `space` pause, `h` HUD, `esc` quit (saves what is drawn so far).

Agents (all in `ai_hands.py`, talking only through a message bus, driven by one `while not job_complete:` loop):
Planner (Eye) -> Kinematics (Muscle) -> Hand -> Critic (Mind) -> refine requests back to the Planner.
