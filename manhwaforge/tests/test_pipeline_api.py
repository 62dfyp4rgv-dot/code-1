"""End-to-end tests through the real HTTP API with the real agents (small chapters to stay quick)."""
import io
import threading
import time
import zipfile
from fractions import Fraction

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from forge import config
from forge.app import create_app
from forge.store import JobStore


def sketch_bytes():
    im = Image.new("RGB", (300, 200), "white")
    ImageDraw.Draw(im).ellipse([180, 40, 260, 120], outline="black", width=3)
    b = io.BytesIO()
    im.save(b, "PNG")
    return b.getvalue()


def wait_for(client, jid, states, timeout=240):
    t0 = time.time()
    while time.time() - t0 < timeout:
        s = client.get(f"/api/jobs/{jid}").json()
        if s["status"] in states:
            return s
        time.sleep(0.4)
    raise AssertionError(f"timeout waiting for {states}; last status {s['status']} stage {s['stage']}")


@pytest.fixture(scope="module")
def env(tmp_path_factory):
    data = tmp_path_factory.mktemp("data")
    store = JobStore(data)
    app = create_app(store)
    with TestClient(app) as client:
        yield client, store, data


@pytest.fixture(scope="module")
def story():
    from pathlib import Path
    return (Path(__file__).parent / "story.txt").read_text()


@pytest.fixture(scope="module")
def job_a(env, story):
    """A webtoon job with a sketch, run to the 95% halt."""
    client, _, _ = env
    r = client.post("/api/jobs", data={"story": story, "format": "webtoon", "panels": "6", "series": "s1"},
                    files=[("files", ("sketch.png", sketch_bytes(), "image/png"))])
    assert r.status_code == 200, r.text
    jid = r.json()["id"]
    return jid, wait_for(client, jid, {"halted", "failed", "completed"})


# ------------------------------------------------------------------ the 95% rule, end to end
def test_halts_at_exactly_95_percent_with_hard_save(env, job_a):
    client, _, _ = env
    jid, s = job_a
    assert s["status"] == "halted", s.get("error")
    assert Fraction(s["progress"]).limit_denominator(1000) == Fraction(95, 100)
    assert s["confidence"] <= s["progress"] + 1e-9
    assert s["stage_progress"]["polish"] == 0                   # the last 5% was deliberately NOT run
    assert all(s["stage_progress"][k] == 1 for k in ("director", "style", "art", "typeset", "assembly"))
    assert "95" in s["halt_reason"]
    assert all(p["state"] == "done" for p in s["panels"])
    for p in s["panels"]:                                       # every panel cleared the gate, or was honestly flagged
        assert p["score"] >= config.AMAZEMENT_THRESHOLD or p["below_threshold"]
    assert s["director_source"] == "heuristic" and s["style"]["key"] in ("korean_manhwa", "fantasy_action", "cel_shaded", "cinematic_3d", "webtoon_digital")

    z = client.get(f"/api/jobs/{jid}/download")
    assert z.status_code == 200 and z.headers["content-type"] == "application/zip"
    names = set(zipfile.ZipFile(io.BytesIO(z.content)).namelist())
    for need in ("reader/index.html", "strip.jpg", "script.json", "layout.json", "completion_summary.md", "completion_summary.json",
                 "characters/jin.png", "characters/mira.json"):
        assert need in names, need
    assert sum(n.startswith("panels/") for n in names) == len(s["panels"])
    summary = zipfile.ZipFile(io.BytesIO(z.content)).read("completion_summary.md").decode()
    assert "Halted: awaiting manual instruction" in summary and "95.0" in summary


def test_nothing_executes_after_the_halt(env, job_a):
    client, _, _ = env
    jid, s = job_a
    n0 = client.get(f"/api/jobs/{jid}").json()["event_count"]
    t0 = client.get(f"/api/jobs/{jid}").json()["updated"]
    time.sleep(1.5)
    s2 = client.get(f"/api/jobs/{jid}").json()
    assert s2["event_count"] == n0 and s2["updated"] == t0 and s2["status"] == "halted"
    assert not [t for t in threading.enumerate() if t.name.startswith("forge-panel") and t.is_alive()]


def test_sketch_was_read_and_used(env, job_a):
    client, _, _ = env
    jid, _ = job_a
    ev = client.get(f"/api/jobs/{jid}/events").json()["events"]
    assert any("analysed sketch" in e["msg"] for e in ev)
    assert any(e["agent"] == "Critic" for e in ev) and any(e["agent"] == "Typesetter" for e in ev)


def test_reader_and_files_are_served(env, job_a):
    client, _, _ = env
    jid, _ = job_a
    r = client.get(f"/api/jobs/{jid}/files/output/reader/index.html")
    assert r.status_code == 200 and "<img" in r.text
    assert client.get(f"/api/jobs/{jid}/files/output/reader/img/panel_01.jpg").status_code == 200
    assert client.get(f"/api/jobs/{jid}/files/work/thumbs/panel_01.jpg").status_code == 200


def test_file_serving_is_confined(env, job_a):
    client, _, _ = env
    jid, _ = job_a
    for bad in ("state.json", "events.jsonl", "inputs/00_story.txt", "output/../state.json", "output/../../jobs/x/state.json",
                "..%2f..%2fetc/passwd", "output/%2e%2e/state.json"):
        assert client.get(f"/api/jobs/{jid}/files/{bad}").status_code == 404, bad
    assert client.get("/api/jobs/doesnotexist").status_code == 404
    assert client.get("/api/jobs/doesnotexist/download").status_code == 404


# ------------------------------------------------------------------ manual instruction after the halt
def test_finalize_runs_only_on_instruction_then_completes(env, job_a):
    client, _, _ = env
    jid, _ = job_a
    r = client.post(f"/api/jobs/{jid}/resume", json={"instruction": "ship it", "action": "finalize"})
    assert r.status_code == 200
    s = wait_for(client, jid, {"completed", "failed"})
    assert s["status"] == "completed" and s["progress"] == 1.0 and s["stage_progress"]["polish"] == 1
    z = zipfile.ZipFile(io.BytesIO(client.get(f"/api/jobs/{jid}/download").content))
    assert "README.txt" in z.namelist()
    summ = z.read("completion_summary.md").decode()
    assert "ship it" in summ and "completed" in summ.lower()
    # a finished job refuses further instructions
    assert client.post(f"/api/jobs/{jid}/resume", json={}).status_code == 409


def test_resume_is_refused_unless_halted(env):
    client, _, _ = env
    assert client.post("/api/jobs/nope/resume", json={}).status_code == 404


def test_slides_format_series_reuse_and_cancel(env, job_a, story):
    client, _, _ = env
    r = client.post("/api/jobs", data={"story": story, "format": "slides", "panels": "4", "series": "s1", "style": "cel_shaded"})
    jid = r.json()["id"]
    s = wait_for(client, jid, {"halted", "failed"})
    assert s["status"] == "halted", s.get("error")
    assert s["style"]["key"] == "cel_shaded"
    z = zipfile.ZipFile(io.BytesIO(client.get(f"/api/jobs/{jid}/download").content))
    names = z.namelist()
    assert "slides.pdf" in names and any(n.startswith("slides/slide_") for n in names)
    assert "strip.jpg" not in names
    im = Image.open(io.BytesIO(z.read("slides/slide_01.jpg")))
    assert im.size == config.SLIDE_SIZE
    ev = client.get(f"/api/jobs/{jid}/events").json()["events"]
    assert any("reusing stored character sheet" in e["msg"] for e in ev)       # same series -> same characters as job A
    # cancel instead of finalize: stays halted-package, never runs polish
    assert client.post(f"/api/jobs/{jid}/resume", json={"action": "cancel", "instruction": "enough"}).status_code == 200
    s = client.get(f"/api/jobs/{jid}").json()
    assert s["status"] == "cancelled" and s["stage_progress"]["polish"] == 0
    assert client.get(f"/api/jobs/{jid}/download").status_code == 200          # the 95% package stays available


# ------------------------------------------------------------------ input validation
def test_input_validation(env):
    client, _, _ = env
    post = client.post
    assert post("/api/jobs", data={"story": "   "}).status_code == 400                                  # nothing to work from
    assert post("/api/jobs", data={"story": ""}, files=[("files", ("s.png", sketch_bytes(), "image/png"))]).status_code == 400   # sketch alone
    assert post("/api/jobs", data={"story": "x y z", "format": "pdf"}).status_code == 400
    assert post("/api/jobs", data={"story": "x y z", "style": "nope"}).status_code == 400
    assert post("/api/jobs", data={"story": "hi"}, files=[("files", ("a.pdf", b"%PDF", "application/pdf"))]).status_code == 400
    assert post("/api/jobs", data={"story": "hi"}, files=[("files", ("a.png", b"not an image", "image/png"))]).status_code == 400
    big = b"a" * (config.MAX_FILE_BYTES + 10)
    assert post("/api/jobs", data={"story": "hi"}, files=[("files", ("a.txt", big, "text/plain"))]).status_code == 413
    assert len(client.get("/api/jobs").json()) <= 3                                                     # rejected requests created no jobs


def test_script_file_alone_is_enough(env, story):
    client, _, _ = env
    r = client.post("/api/jobs", data={"panels": "4"}, files=[("files", ("../../evil/story.txt", story.encode(), "text/plain"))])
    assert r.status_code == 200
    jid = r.json()["id"]
    s = wait_for(client, jid, {"halted", "failed"})
    assert s["status"] == "halted" and s["title"] == "The Last Hunter of Seoul"
    assert "story.txt" in str(s["inputs"]) and ".." not in str(s["inputs"])      # filename was sanitised


# ------------------------------------------------------------------ persistence
def test_restart_restores_jobs_and_marks_inflight_as_interrupted(env):
    _, store, data = env
    rec = store.create(title="mid-flight")
    rec.mutate(lambda s: setattr(s, "status", "running"))
    again = JobStore(data)
    assert again.get(rec.state.id).state.status == "interrupted"
    assert len(again.list()) == len(store.list())
    halted = [r for r in again.list() if r.state.status == "halted"]
    assert halted and halted[0].events                                           # events are reloaded too
