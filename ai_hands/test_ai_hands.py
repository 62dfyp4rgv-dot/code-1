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


# ------------------------------------------------------------------ v3 additions: eraser, guide layer, time-lapse
def _alpha_sum(surf):
    import pygame
    return int(pygame.surfarray.pixels_alpha(surf).astype(int).sum())


def test_construction_lines_go_on_their_own_layer_and_the_eraser_removes_them():
    studio, hand = _hand_rig()
    kin = ah.KinematicsAgent(studio, 3)
    tr = kin.shape(path("skeleton", STRAIGHT))
    hand.pen = np.array([50.0, 400.0])
    hand.queue.append(("traj", tr))
    hand.guide_trajs.append(tr.xy)
    for _ in range(100):
        hand.step(0.02)
    assert _alpha_sum(hand.guide) > 0                                        # the guide stroke is on the guide layer...
    assert _ink(hand) == 0                                                   # ...and none of it is on the drawing itself
    studio.bus.send("Critic", "Hand", "erase_guides", None)
    seen_erasing = False
    for _ in range(400):
        hand.step(0.02)
        seen_erasing |= hand.erasing
        if hand.guides_erased:
            break
    assert seen_erasing and hand.guides_erased and not hand.erasing
    assert _alpha_sum(hand.guide) == 0                                       # rubbed out completely
    assert any(m.topic == "guides_erased" for m in studio.bus.boxes["Critic"])   # and the Critic was told


def test_graphite_strokes_are_never_touched_by_the_eraser():
    studio, hand = _hand_rig()
    kin = ah.KinematicsAgent(studio, 3)
    hand.pen = np.array([50.0, 400.0])
    for kind, y in (("skeleton", 400), ("contour", 400)):
        seg = [[[50, y], [150, y], [250, y], [350, y]]]
        hand.queue.append(("traj", kin.shape(path(kind, seg))))
        if kind == "skeleton":
            hand.guide_trajs.append(hand.queue[-1][1].xy)
    for _ in range(200):
        hand.step(0.02)
    before = _ink(hand)
    assert before > 0
    studio.bus.send("Critic", "Hand", "erase_guides", None)
    for _ in range(400):
        hand.step(0.02)
        if hand.guides_erased:
            break
    assert _ink(hand) == before                                              # real pencil lines stay


def test_the_job_is_only_signed_off_after_the_construction_lines_are_erased(tmp_path):
    out = run_cli("--concept", "landscape", "--speed", "400", "--quality", "0.4", "--out", str(tmp_path))
    assert out.returncode == 0, out.stderr[-800:]
    msgs = [e["msg"] for e in json.loads((tmp_path / "run_log_landscape.json").read_text())["log"]]
    i_ask = next(i for i, m in enumerate(msgs) if "rub out the construction lines" in m)
    i_rub = next(i for i, m in enumerate(msgs) if m.startswith("rubbing out"))
    i_gone = next(i for i, m in enumerate(msgs) if "construction lines are gone" in m)
    assert i_ask < i_rub < i_gone                                            # ask -> rub out -> only then signed off
    import pygame
    a = pygame.surfarray.array3d(pygame.image.load(str(tmp_path / "drawing_landscape.png"))).astype(int)
    assert ((a[..., 2] - a[..., 0]) > 12).sum() == 0                         # no blue guide ink left in the saved drawing


def test_timelapse_gif_is_written_and_thins_itself_to_the_frame_budget(tmp_path):
    from PIL import Image
    gif = tmp_path / "lapse.gif"
    out = run_cli("--concept", "landscape", "--speed", "400", "--quality", "0.4", "--timelapse", str(gif), "--tl-frames", "12", "--out", str(tmp_path))
    assert out.returncode == 0, out.stderr[-800:]
    im = Image.open(gif)
    assert 3 <= im.n_frames <= 30                                            # honoured the budget (+ the lingering last frames merge)
    assert im.size == ((ah.CANVAS + 40 + ah.HUD_W) // 2, (ah.CANVAS + 40) // 2)
    assert gif.stat().st_size < 4_000_000


# ------------------------------------------------------------------ v4 additions: colour pencils, sketchiness, skill, mouse pace, review handshake
def _fake_studio(**kw):
    return SimpleNamespace(bus=ah.MessageBus(), palette="graphite", log=lambda *a: None, **kw)


def _plan_all(concept="landscape", **kw):
    studio = _fake_studio()
    for box in ("Kinematics", "Critic"):
        studio.bus.register(box)
    pl = ah.PlannerAgent(studio, concept, None, 1, **kw)
    while not pl.done:
        pl.step(1.0)
    return pl


def test_colour_mode_tints_hatches_only_and_graphite_mode_stays_colourless():
    col, mono = _plan_all(color=True), _plan_all(color=False)
    hatches = [p for p in col.paths if p["kind"] == "hatch"]
    assert hatches and all(len(p["color"]) == 3 and all(0 <= v <= 255 for v in p["color"]) for p in hatches)
    assert len({tuple(p["color"]) for p in hatches}) > 20                    # a real range of colours, not one tint
    assert all("color" not in p for p in col.paths if p["kind"] != "hatch")  # outlines stay graphite
    assert all("color" not in p for p in mono.paths)


def test_colour_is_darkened_and_saturated_like_layered_pencil():
    pl = _plan_all(color=True)
    pl.rgb = np.full((ah.RES, ah.RES, 3), (0.8, 0.5, 0.5))                   # a flat salmon reference
    c = np.array(pl._tint([[[100, 100], [100, 100], [100, 100], [100, 100]]]))
    assert c[0] / 255 < 0.8 and c[0] > c[1]                                  # darker than the target, hue kept
    assert (c.max() - c.min()) / 255 > 0.8 - 0.5                             # more saturated than the target


def test_kinematics_quantises_pencil_colours_so_sprites_can_be_cached(kin):
    p = dict(path("hatch", STRAIGHT), color=[203, 61, 119], tone=0.5)
    tr = kin.shape(p)
    assert all(v % 12 == 0 for v in tr.color) and max(abs(a - b) for a, b in zip(tr.color, (203, 61, 119))) <= 6


def test_colour_run_end_to_end_writes_coloured_svg_and_still_finishes(tmp_path):
    out = run_cli("--concept", "mandala", "--color", "--speed", "400", "--quality", "0.5", "--out", str(tmp_path))
    assert out.returncode == 0, out.stderr[-800:]
    svg = (tmp_path / "drawing_mandala.svg").read_text()
    import re
    cols = set(re.findall(r'stroke="#([0-9a-f]{6})"', svg))
    assert len(cols) > 20
    assert any(abs(int(c[0:2], 16) - int(c[4:6], 16)) > 40 for c in cols)    # genuinely coloured, not grey


def test_sketchiness_controls_the_lighter_restroke_pass():
    none, lots = _plan_all(sketchiness=0.0), _plan_all(sketchiness=0.9)
    assert not any(p["kind"] == "sketch" for p in none.paths)
    sk = [p for p in lots.paths if p["kind"] == "sketch"]
    assert len(sk) > 5 and all(p["layer"] == "details" for p in sk)


def test_restroke_overshoots_both_ends_and_wobbles_off_the_original_line():
    pl = _plan_all(sketchiness=0.8)
    chain = np.stack([np.linspace(40, 140, 60), np.full(60, 100.0)], 1)      # a straight 100 px chain
    segs = pl._restroke(chain)
    pts = np.array([pt for seg in segs for pt in seg]) / ah.SCALE
    assert pts[:, 0].min() < 40 - 0.5 and pts[:, 0].max() > 140 + 0.5        # ran past both ends
    assert np.abs(pts[:, 1] - 100).max() > 0.1                               # and is not an exact retrace


def test_skill_dial_makes_the_hand_steadier(kin):
    def wobble(skill):
        k = ah.KinematicsAgent(SimpleNamespace(bus=ah.MessageBus(), palette="graphite", log=lambda *a: None, args=SimpleNamespace(skill=skill)), 9)
        devs = []
        for _ in range(12):
            tr = k.shape(path("contour", STRAIGHT))
            devs.append(np.abs(tr.xy[:, 1] - 400).mean())
        return float(np.mean(devs))
    assert wobble(0.0) > 1.4 * wobble(1.0)


def test_pace_slider_wheel_and_click_to_pause(tmp_path, monkeypatch):
    import pygame
    monkeypatch.setattr(sys, "argv", ["ai_hands.py", "--headless", "--out", str(tmp_path)])
    st = ah.Studio(ah.parse_args())
    r = st.slider_rect()
    ev = lambda t, **kw: pygame.event.Event(t, **kw)  # noqa: E731
    st.handle_event(ev(pygame.MOUSEBUTTONDOWN, pos=(r.x, r.centery), button=1))
    assert st.dragging and st.speed == pytest.approx(ah.SPEED_MIN, rel=1e-6)
    st.handle_event(ev(pygame.MOUSEMOTION, pos=(r.x + r.w // 2, r.centery), rel=(0, 0), buttons=(1, 0, 0)))
    assert st.speed == pytest.approx(math.sqrt(ah.SPEED_MIN * ah.SPEED_MAX), rel=0.02)     # log scale: the middle is the geometric mean
    st.handle_event(ev(pygame.MOUSEMOTION, pos=(r.right + 400, r.centery), rel=(0, 0), buttons=(1, 0, 0)))
    assert st.speed == pytest.approx(ah.SPEED_MAX)                                          # clamped at the end of the track
    st.handle_event(ev(pygame.MOUSEBUTTONUP, pos=(r.right, r.centery), button=1))
    assert not st.dragging
    st.handle_event(ev(pygame.MOUSEMOTION, pos=(r.x, r.centery), rel=(0, 0), buttons=(0, 0, 0)))
    assert st.speed == pytest.approx(ah.SPEED_MAX)                                          # no longer dragging: moves are ignored
    st.speed = 10.0
    st.handle_event(ev(pygame.MOUSEWHEEL, x=0, y=2, flipped=False))
    assert st.speed == pytest.approx(10 * 1.25 ** 2)
    assert not st.paused
    st.handle_event(ev(pygame.MOUSEBUTTONDOWN, pos=(300, 300), button=1))                   # click the paper
    assert st.paused
    st.handle_event(ev(pygame.MOUSEBUTTONDOWN, pos=(r.centerx, r.centery), button=1))       # clicking the slider must not toggle pause
    assert st.paused
    pygame.quit()


def test_hand_waits_for_the_critics_verdict_before_the_next_layer():
    studio, hand = _hand_rig()
    kin = ah.KinematicsAgent(studio, 3)
    seg = lambda y: [[[50, y], [150, y], [250, y], [350, y]]]  # noqa: E731
    hand.pen = np.array([50.0, 300.0])
    hand.queue.append(("traj", kin.shape(path("contour", seg(300)))))
    hand.queue.append(("end", "contours"))
    hand.queue.append(("traj", kin.shape(path("contour", seg(500)))))
    for _ in range(200):
        hand.step(0.05)
    assert hand.strokes_done == 1 and hand.review_wait                       # drew layer 1, then stopped dead
    assert any(m.topic == "layer_done" for m in studio.bus.boxes["Critic"])
    ink = _ink(hand)
    hand.step(0.5)
    assert _ink(hand) == ink                                                 # still holding the pencil
    studio.bus.send("Critic", "Hand", "review_done", "contours")
    for _ in range(200):
        hand.step(0.05)
    assert hand.strokes_done == 2 and not hand.review_wait


def test_each_segment_is_stamped_once_so_ink_does_not_depend_on_playback_speed():
    studio, a = _hand_rig()
    _, b = _hand_rig()
    kin = ah.KinematicsAgent(studio, 3)
    tr = kin.shape(path("contour", STRAIGHT))
    for hand, dt in ((a, 0.0031), (b, 1.0)):
        hand.pen = np.array([50.0, 400.0])
        hand.queue.append(("traj", tr))
        for _ in range(4000):
            hand.step(dt)
            if hand.strokes_done:
                break
    import pygame
    assert np.array_equal(pygame.surfarray.array3d(a.canvas), pygame.surfarray.array3d(b.canvas))


def test_the_plan_does_not_depend_on_playback_speed(tmp_path):
    plans = []
    for sp, d in (("40", tmp_path / "a"), ("400", tmp_path / "b")):
        assert run_cli("--concept", "landscape", "--speed", sp, "--quality", "0.9", "--out", str(d)).returncode == 0
        plans.append(json.loads((d / "plan_landscape.json").read_text())["paths"])
    assert plans[0] == plans[1]


def test_planner_keeps_its_hud_colour_in_every_mode():
    assert _plan_all(color=True).color == ah.PlannerAgent.color == (120, 190, 255)   # regression: a bool once overwrote it
