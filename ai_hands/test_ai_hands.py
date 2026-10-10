"""Tests for the invariants that make the drawing agents trustworthy (run: pytest -q)."""
import json
import math
import os
import subprocess
import sys
from types import SimpleNamespace

import numpy as np
import pytest

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
sys.path.insert(0, os.path.dirname(__file__))
import ai_hands as ah  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))


# ------------------------------------------------------------------ Bezier maths
def test_bezier_endpoints_derivative_and_de_casteljau_agree():
    c = np.array([[0, 0], [30, 80], [90, -40], [120, 10]], float)
    t = np.linspace(0, 1, 11)
    P = ah.bez_pt(c, t)
    assert np.allclose(P[0], c[0]) and np.allclose(P[-1], c[3])
    h = 1e-5
    num = (ah.bez_pt(c, t + h) - ah.bez_pt(c, t - h)) / (2 * h)
    assert np.allclose(ah.bez_d1(c, t), num, atol=1e-3)
    num2 = (ah.bez_d1(c, t + h) - ah.bez_d1(c, t - h)) / (2 * h)
    assert np.allclose(ah.bez_d2(c, t), num2, atol=1e-2)
    a, b = ah.de_casteljau_split(c, 0.37)
    assert np.allclose(a[3], b[0]) and np.allclose(a[3], ah.bez_pt(c, np.array([0.37]))[0])
    assert np.allclose(ah.bez_pt(a, np.array([0.5]))[0], ah.bez_pt(c, np.array([0.185]))[0])      # split preserves the curve


def test_curvature_of_a_circle_is_one_over_radius():
    k = 0.5523 * 100
    seg = [[100, 0], [100, k], [k, 100], [0, 100]]            # quarter circle, r = 100
    fl = ah.flatten([seg], 1.0)
    assert abs(np.median(np.abs(fl["kappa"])) - 0.01) < 5e-4
    assert abs(fl["s"][-1] - math.pi * 50) < 0.5


def test_schneider_fit_stays_within_tolerance_and_is_compact():
    th = np.linspace(0, 1.8 * math.pi, 220)
    pts = np.stack([200 + 90 * np.cos(th), 200 + 60 * np.sin(th)], 1)
    segs = ah.fit_curve(pts, 1.5)
    assert 2 <= len(segs) <= 8
    dense = np.vstack([ah.bez_pt(c, np.linspace(0, 1, 200)) for c in segs])
    d = np.min(np.hypot(pts[:, None, 0] - dense[None, :, 0], pts[:, None, 1] - dense[None, :, 1]), axis=1)
    assert d.max() < 1.6
    assert np.allclose(segs[0][0], pts[0]) and np.allclose(segs[-1][3], pts[-1])
    for a, b in zip(segs[:-1], segs[1:]):
        assert np.allclose(a[3], b[0], atol=1e-6)                                  # contiguous


def test_rdp_collapses_a_straight_line_and_keeps_corners():
    line = np.stack([np.linspace(0, 100, 50), np.linspace(0, 40, 50)], 1)
    assert ah.rdp_indices(line, 0.5) == [0, 49]
    corner = np.vstack([np.stack([np.linspace(0, 50, 30), np.zeros(30)], 1), np.stack([np.full(30, 50.0), np.linspace(0, 50, 30)], 1)])
    assert len(ah.rdp_indices(corner, 0.5)) == 3


def test_chain_to_beziers_cuts_at_a_sharp_corner():
    corner = np.vstack([np.stack([np.linspace(0, 40, 40), np.zeros(40)], 1), np.stack([np.full(40, 40.0), np.linspace(0, 40, 40)], 1)[1:]])
    segs = ah.chain_to_beziers(corner, 1.0)
    assert len(segs) >= 2


# ------------------------------------------------------------------ image analysis
def test_canny_finds_the_outline_of_a_disc():
    yy, xx = np.mgrid[0:120, 0:120]
    img = (np.hypot(xx - 60, yy - 60) < 35).astype(float)
    edges, _ = ah.canny(1 - img, 1.0, 40, 80)
    ys, xs = np.nonzero(edges)
    r = np.hypot(xs - 60, ys - 60)
    assert abs(len(xs) - 2 * math.pi * 35) < 0.35 * 2 * math.pi * 35
    assert abs(np.median(r) - 35) < 2
    chains = ah.trace_chains(edges, 8)
    assert max(len(c) for c in chains) > 100


def test_gaussian_blur_preserves_mass():
    a = np.zeros((64, 64))
    a[32, 32] = 1.0
    b = ah.gaussian_blur(a, 3.0)
    assert abs(b.sum() - 1.0) < 1e-6 and b.max() < 0.1


# ------------------------------------------------------------------ the Kinematics agent
@pytest.fixture()
def kin():
    studio = SimpleNamespace(bus=ah.MessageBus(), palette="graphite", log=lambda *a: None)
    return ah.KinematicsAgent(studio, 3)


def path(kind, segs):
    return dict(id=1, layer="contours", kind=kind, segments=segs)


STRAIGHT = [[[50, 400], [150, 400], [250, 400], [350, 400]]]
HAIRPIN = [[[50, 100], [400, 100], [400, 160], [50, 160]]]


def test_stroke_starts_and_ends_at_rest_and_never_exceeds_vmax(kin):
    tr = kin.shape(path("contour", STRAIGHT))
    vmax = ah.KIN["contour"]["vmax"]
    assert tr.speed[0] < 0.25 * vmax and tr.speed[-1] < 0.25 * vmax       # ease-in / ease-out
    assert tr.speed.max() <= vmax * 1.1
    assert tr.speed[len(tr.speed) // 2] > 0.4 * tr.speed.max()            # and it cruises in the middle


def test_stroke_acceleration_is_physically_bounded(kin):
    tr = kin.shape(path("contour", HAIRPIN))
    acc = np.abs(np.gradient(tr.speed) * ah.FS)
    assert np.percentile(acc, 99) < 2.5 * ah.KIN["contour"]["amax"]


def test_tight_curves_are_drawn_slower_than_straights(kin):
    """Two-thirds power law: straight -> tight hairpin -> straight. The pen must slow hard in the hairpin."""
    segs = [[[50, 400], [150, 400], [250, 400], [350, 400]],
            [[350, 400], [400, 400], [400, 430], [350, 430]],            # radius ~15 px
            [[350, 430], [250, 430], [150, 430], [50, 430]]]
    tr = kin.shape(path("contour", segs))
    in_turn = tr.xy[:, 0] > 372
    assert in_turn.any()
    assert tr.speed[in_turn].min() < 0.5 * tr.speed.max()                 # the apex is taken slowly
    assert np.median(tr.speed[in_turn]) < 0.7 * tr.speed.max()            # and so is most of the turn
    # control: the same length drawn straight is faster than the one with the hairpin
    straight = kin.shape(path("contour", [[[50, 400], [150, 400], [250, 400], [350, 400]], [[350, 400], [450, 400], [550, 400], [650, 400]]]))
    assert straight.speed.max() > 1.2 * np.median(tr.speed[in_turn])


def test_pen_lands_where_aimed_and_is_not_perfectly_rigid(kin):
    tr = kin.shape(path("contour", STRAIGHT))
    assert np.hypot(*(tr.xy[0] - [50, 400])) < 3 and np.hypot(*(tr.xy[-1] - [350, 400])) < 3
    dev = tr.xy[:, 1] - 400                                               # tremor + drift: the line is alive, not a ruler
    assert 0.1 < dev.std() < 3.0


def test_pressure_and_width_are_dynamic_and_in_range(kin):
    tr = kin.shape(path("contour", STRAIGHT))
    k = ah.KIN["contour"]
    assert tr.pressure.min() >= 0 and tr.pressure.max() <= 1.0
    assert tr.pressure[0] < tr.pressure[len(tr.pressure) // 2]            # presses in
    assert tr.pressure[-1] < tr.pressure[len(tr.pressure) // 2]           # and lifts off
    assert tr.width.min() >= k["wmin"] - 1e-9 and tr.width.max() <= k["wmax"] + 1e-9


def test_longer_strokes_take_longer_and_two_strokes_never_look_identical(kin):
    short = kin.shape(path("hatch", [[[10, 10], [30, 10], [50, 10], [70, 10]]]))
    long_ = kin.shape(path("hatch", [[[10, 10], [200, 10], [400, 10], [600, 10]]]))
    assert long_.duration > short.duration
    a, b = kin.shape(path("contour", STRAIGHT)), kin.shape(path("contour", STRAIGHT))
    assert abs(a.duration - b.duration) > 1e-6 or not np.allclose(a.xy[:50], b.xy[:50])


def test_kinematics_flow_control_and_layer_markers():
    studio = SimpleNamespace(bus=ah.MessageBus(), palette="graphite", log=lambda *a: None)
    k = ah.KinematicsAgent(studio, 1)
    hand_box = studio.bus.register("Hand")
    paths = [dict(id=i, layer="contours", kind="contour", segments=STRAIGHT) for i in range(25)]
    studio.bus.send("Planner", "Kinematics", "path_batch", dict(layer="contours", paths=paths))
    k.step(5.0)
    assert sum(m.topic == "trajectory" for m in hand_box) == 10           # never floods the Hand
    for _ in range(40):
        studio.bus.send("Hand", "Kinematics", "consumed", 1)
        k.step(5.0)
    msgs = list(hand_box)
    assert [m.topic for m in msgs].count("layer_end") == 1 and msgs[-1].topic == "layer_end"      # marker stays in order


# ------------------------------------------------------------------ the Planner
def test_planner_layers_are_hierarchical_and_json_serialisable():
    studio = SimpleNamespace(bus=ah.MessageBus(), palette="graphite", log=lambda *a: None)
    for box in ("Kinematics", "Critic"):
        studio.bus.register(box)
    pl = ah.PlannerAgent(studio, "still_life", None, 1)
    while not pl.done:
        pl.step(1.0)
    layers = [p["layer"] for p in pl.paths]
    first = {l: layers.index(l) for l in ah.LAYER_ORDER}
    assert first["skeleton"] < first["contours"] < first["shading"] < first["details"]
    json.dumps(pl.paths)
    assert all(len(seg) == 4 and all(len(pt) == 2 for pt in seg) for p in pl.paths for seg in p["segments"])
    assert all(0 <= x <= ah.CANVAS + 40 and -40 <= y <= ah.CANVAS + 40 for p in pl.paths for seg in p["segments"] for x, y in seg)
    announced = [m.payload for m in studio.bus.boxes["Critic"] if m.topic == "layer_announce"]
    assert announced == ah.LAYER_ORDER


def test_planner_answers_an_edge_refinement_request():
    studio = SimpleNamespace(bus=ah.MessageBus(), palette="graphite", log=lambda *a: None)
    for box in ("Kinematics", "Critic"):
        studio.bus.register(box)
    pl = ah.PlannerAgent(studio, "mandala", None, 1)
    while not pl.done:
        pl.step(1.0)
    mask = np.zeros((ah.RES, ah.RES), bool)
    mask[100, 50:140] = True
    n0 = len(pl.paths)
    studio.bus.send("Critic", "Planner", "refine", dict(kind="edges", mask=mask, **{"pass": 1}))
    pl.step(1.0)
    new = pl.paths[n0:]
    assert new and all(p["layer"] == "refine-edges-1" and p["kind"] == "contour" for p in new)


# ------------------------------------------------------------------ the whole autonomous system
def run_cli(*args, timeout=600):
    out = subprocess.run([sys.executable, os.path.join(HERE, "ai_hands.py"), "--headless", *args], capture_output=True, text=True,
                         timeout=timeout, env={**os.environ, "SDL_VIDEODRIVER": "dummy", "SDL_AUDIODRIVER": "dummy"})
    return out


def test_end_to_end_autonomous_run_completes_and_writes_everything(tmp_path):
    out = run_cli("--concept", "mandala", "--speed", "300", "--quality", "0.5", "--out", str(tmp_path))
    assert out.returncode == 0, out.stderr[-800:]
    png = tmp_path / "drawing_mandala.png"
    assert png.exists() and png.stat().st_size > 20_000
    plan = json.loads((tmp_path / "plan_mandala.json").read_text())
    log = json.loads((tmp_path / "run_log_mandala.json").read_text())
    assert plan["canvas"] == [ah.CANVAS, ah.CANVAS] and len(plan["paths"]) > 100
    agents = {e["agent"] for e in log["log"]}
    assert {"Planner", "Critic"} <= agents                                   # the agents really talked
    assert any("Job complete" in e["msg"] for e in log["log"])
    assert log["score"] >= 0.5                                               # stopped because the target was met...
    assert sum(log["passes"].values()) <= 4                                  # ...not because the budget ran out
    import pygame
    img = pygame.image.load(str(png))
    arr = pygame.surfarray.array3d(img).astype(float).mean(axis=2)
    assert (arr < 150).mean() > 0.005                                        # ink was actually laid on the paper


def test_drawing_is_deterministic_for_a_seed_and_differs_between_seeds(tmp_path):
    a, b, c = tmp_path / "a", tmp_path / "b", tmp_path / "c"
    for d, seed in ((a, 3), (b, 3), (c, 4)):
        assert run_cli("--concept", "landscape", "--speed", "400", "--quality", "0.4", "--seed", str(seed), "--out", str(d)).returncode == 0
    pa, pb = (json.loads((d / "plan_landscape.json").read_text())["paths"] for d in (a, b))
    pc = json.loads((c / "plan_landscape.json").read_text())["paths"]
    assert pa == pb
    assert pa != pc


def test_seed_image_mode_traces_a_user_image(tmp_path):
    import pygame
    pygame.init()
    s = pygame.Surface((300, 300))
    s.fill((240, 240, 240))
    pygame.draw.circle(s, (40, 40, 40), (150, 150), 90)
    pygame.draw.circle(s, (200, 200, 200), (120, 120), 30)
    pygame.image.save(s, str(tmp_path / "seed.png"))
    out = run_cli("--image", str(tmp_path / "seed.png"), "--speed", "400", "--quality", "0.5", "--out", str(tmp_path / "o"))
    assert out.returncode == 0, out.stderr[-800:]
    assert (tmp_path / "o" / "drawing_seed.png").exists()


# ------------------------------------------------------------------ v2 additions: SVG, nib wear, progress, time-sliced corrections
def test_svg_export_is_a_valid_layered_vector_copy_of_the_plan(tmp_path):
    import xml.etree.ElementTree as ET
    assert run_cli("--concept", "mandala", "--speed", "400", "--quality", "0.4", "--out", str(tmp_path)).returncode == 0
    root = ET.parse(tmp_path / "drawing_mandala.svg").getroot()
    ns = "{http://www.w3.org/2000/svg}"
    plan = json.loads((tmp_path / "plan_mandala.json").read_text())["paths"]
    groups = [g.get("id") for g in root.iter(f"{ns}g") if g.get("id")]
    assert groups[:4] == ah.LAYER_ORDER                                      # skeleton -> contours -> shading -> details
    paths = list(root.iter(f"{ns}path"))
    assert len(paths) == len(plan)
    assert all(p.get("d").startswith("M") and "C" in p.get("d") for p in paths)
    assert all(0.0 < float(p.get("stroke-opacity")) <= 1.0 and float(p.get("stroke-width")) > 0 for p in paths)


def _hand_rig():
    import pygame
    pygame.display.init()
    studio = SimpleNamespace(bus=ah.MessageBus(), palette="graphite", log=lambda *a: None)
    studio.bus.register("Kinematics")
    studio.bus.register("Critic")
    hand = ah.HandAgent(studio, pygame.Surface((ah.CANVAS, ah.CANVAS)))
    hand.canvas.fill((255, 255, 255))
    return studio, hand


def _ink(hand):
    import pygame
    return float((255 - pygame.surfarray.array3d(hand.canvas).astype(float).mean(axis=2)).sum())


def _draw_one(hand, kin, wear):
    hand.wear = wear
    hand.pen = np.array([50.0, 400.0])
    tr = kin.shape(path("contour", STRAIGHT))
    hand.queue.append(("traj", tr))
    hand.stroke_total += 1
    for _ in range(400):
        hand.step(0.02)
        if hand.cur is None and not hand.queue and hand.travel is None:
            break


def test_a_worn_nib_lays_a_fatter_line_and_then_the_hand_sharpens_the_pencil():
    studio, fresh = _hand_rig()
    kin = ah.KinematicsAgent(studio, 3)
    _draw_one(fresh, kin, 0.0)
    studio2, worn = _hand_rig()
    kin2 = ah.KinematicsAgent(studio2, 3)
    _draw_one(worn, kin2, ah.WEAR_LEN * 0.99)
    assert _ink(worn) > 1.1 * _ink(fresh)                                    # blunt nib = wider mark
    assert worn.sharpenings == 1 and worn.wear < ah.WEAR_LEN * 0.5           # it noticed, paused and reset the wear
    assert fresh.sharpenings == 0


def test_the_hand_lifts_the_pencil_off_the_paper_while_sharpening():
    studio, hand = _hand_rig()
    hand._pause(1.0, "sharpening pencil (#1) - nib was blunt", 26.0)
    zs, statuses = [], set()
    for _ in range(60):                                                      # 1.2 s of simulated time > the 1.0 s pause
        hand.step(0.02)
        zs.append(hand.z)
        statuses.add(hand.status)
    assert min(zs[:40]) > 20                                                 # pencil held well above the paper throughout
    assert any("sharpening" in st for st in statuses)
    assert hand.pause_t == 0.0                                               # and the pause really ends


def test_progress_never_goes_backwards_when_a_new_correction_pass_is_planned(tmp_path, monkeypatch):
    monkeypatch.setattr(sys, "argv", ["ai_hands.py", "--headless", "--out", str(tmp_path)])
    st = ah.Studio(ah.parse_args())
    mk = lambda layer, n: [dict(layer=layer, kind="hatch", segments=[], tone=0.5) for _ in range(n)]  # noqa: E731
    st.planner.paths = mk("skeleton", 4) + mk("contours", 4) + mk("shading", 4) + mk("details", 4) + mk("refine-hatch-1", 10)
    st.hand.layer_done = dict(skeleton=4, contours=4, shading=4, details=4, **{"refine-hatch-1": 9})
    p1 = st.progress()
    assert 0.9 < p1 < 1.0                                                    # almost done but the Critic has not signed off
    st.planner.paths += mk("refine-hatch-2", 40)                             # the Critic asks for another pass
    assert st.progress() >= p1
    st.job_complete = True
    assert st.progress() == 1.0
    import pygame
    pygame.quit()


def test_corrections_are_time_sliced_instead_of_blocking_a_frame():
    studio = SimpleNamespace(bus=ah.MessageBus(), palette="graphite", log=lambda *a: None)
    for box in ("Kinematics", "Critic"):
        studio.bus.register(box)
    pl = ah.PlannerAgent(studio, "mandala", None, 1)
    while not pl.done:
        pl.step(1.0)
    mask = np.zeros((ah.RES, ah.RES), bool)
    mask[60:260, 60:260] = True
    studio.bus.send("Critic", "Planner", "refine", dict(kind="hatch", mask=mask, **{"pass": 1}))
    steps = 0
    while steps < 5000:
        pl.step(1e-4)                                                        # a tiny slice per call
        steps += 1
        if pl.refine_gen is None and not pl.refine_jobs and not pl.inbox:
            break
    assert pl.refine_gen is None and steps > 1                               # it needed several slices...
    assert any(p["layer"] == "refine-hatch-1" for p in pl.paths)             # ...and still delivered the whole pass


def test_critic_budget_is_adaptive_and_stops_when_hatching_stops_paying_off(tmp_path):
    out = run_cli("--concept", "mandala", "--speed", "400", "--quality", "0.99", "--out", str(tmp_path))
    assert out.returncode == 0, out.stderr[-800:]
    log = json.loads((tmp_path / "run_log_mandala.json").read_text())
    assert 1 <= log["passes"]["hatch"] <= 8
    assert any("diminishing returns" in e["msg"] for e in log["log"]) or log["passes"]["hatch"] == 8
