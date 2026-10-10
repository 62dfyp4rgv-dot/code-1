import json

import pytest

from forge.agents.director import Director, HeuristicDirector, LLMDirector
from forge.ingest import InputPackage
from forge.models import Script
from forge.styles import ReferenceInfo


def plan(text, n=12, **kw):
    return HeuristicDirector().plan(InputPackage(text=text, **kw), n)


def test_characters_and_descriptions(story):
    s = plan(story)
    names = {c.name: c.description for c in s.characters}
    assert set(names) == {"Jin", "Mira"}
    assert "crimson" in names["Jin"] and "silver" in names["Mira"]
    assert s.title == "The Last Hunter of Seoul"


def test_dialogue_attribution_survives_quote_splitting(story):
    s = plan(story)
    lines = [(d.speaker, d.text, d.kind) for p in s.panels for d in p.dialogue if d.kind != "caption"]
    assert ("Mira", "You can't go out there alone!", "shout") in lines
    assert any(sp == "Jin" and t.startswith("I have to. Nobody else can stop it") for sp, t, _ in lines)
    assert ("Mira", "Jin, please!", "whisper") in lines
    assert any(sp == "Mira" and t == "You did it." for sp, t, _ in lines)


def test_panel_budget_is_respected_and_script_is_cinematic(story):
    for n in (6, 12, 20):
        s = plan(story, n)
        assert abs(len(s.panels) - n) <= 3, (n, len(s.panels))
    s = plan(story, 12)
    assert s.panels[0].shot == "establishing"
    assert len({p.shot for p in s.panels}) >= 5
    assert [p.index for p in s.panels] == list(range(len(s.panels)))


def test_setting_weather_sfx_from_prose(story):
    s = plan(story)
    assert s.panels[0].weather == "rain" and s.panels[0].time_of_day == "night"
    assert any("SHING" in x for p in s.panels for x in p.sfx)
    assert any(p.mood == "action" for p in s.panels)


def test_no_false_positive_keywords():
    # 'staring' must not read as 'stars' (sparkles) and 'brand' must not read as 'ran' (running / speed lines)
    s = plan("Tom was staring out of the window at the brand new road. Tom smiled.", 4)
    assert all("sparkles" not in p.effects and "speed_lines" not in p.effects for p in s.panels)
    assert all(c.pose != "running" for p in s.panels for c in p.characters)


def test_limits_three_bubbles_and_length():
    long = " ".join(["This is a very long speech that goes on and on, with many clauses."] * 8)
    s = plan(f'Ken stood up. "{long}" Ken said.\n\nKen sat down.')
    for p in s.panels:
        assert len(p.dialogue) <= 3
        assert all(len(d.text) <= 160 for d in p.dialogue)


def test_pronoun_only_story_still_gets_a_protagonist():
    s = plan("A tired knight walked into the burning castle. He drew his sword. Fire roared around him.")
    assert s.characters and s.panels
    assert any(p.characters for p in s.panels)


def test_sketches_steer_composition():
    refs = [ReferenceInfo("a.png", [(0, 0, 0)], 0.1, 0.5, 0.1, 0.8, 0.5, 100, 100)]
    s = HeuristicDirector().plan(InputPackage(text="Jin walked. \"Hi,\" Jin said. Jin ran home.", sketches=refs), 4)
    assert any(p.focus_x == 0.8 and p.sketch_ref == 0 for p in s.panels)


def test_empty_input_is_rejected():
    with pytest.raises(ValueError):
        Director().plan(InputPackage(text="   "), 8)


# ------------------------------------------------------------------ LLM path (mocked transport; no network)
GOOD = {"title": "T", "logline": "L", "characters": [{"name": "Ana", "description": "red hair"}],
        "panels": [{"summary": "s", "shot": "close up!!", "location": "city", "characters": [{"name": "Ana", "expression": "smile"}, {"name": "Ghost"}],
                    "dialogue": [{"speaker": "Ana", "text": "hi", "kind": "speech"}] * 5}]}


def fake(payload_out):
    return lambda payload: {"content": [{"type": "text", "text": payload_out if isinstance(payload_out, str) else "Here you go:\n" + json.dumps(payload_out)}]}


def test_llm_director_validates_and_sanitises():
    d = LLMDirector(api_key="x", transport=fake(GOOD))
    s = d.plan(InputPackage(text="story"), 8)
    assert s.source == "llm"
    assert s.panels[0].shot == "medium"                  # invalid shot normalised
    assert [c.name for c in s.panels[0].characters] == ["Ana"]   # hallucinated character dropped
    assert len(s.panels[0].dialogue) == 3                # bubble cap enforced


def test_llm_failure_falls_back_to_heuristic(story):
    logs = []
    for bad in ("not json at all", json.dumps({"title": "x", "panels": []})):
        d = Director(llm=LLMDirector(api_key="x", transport=fake(bad)))
        s = d.plan(InputPackage(text=story), 8, logs.append)
        assert s.source == "heuristic" and s.panels
    assert any("falling back" in m for m in logs)

    def boom(_):
        raise OSError("network down")
    s = Director(llm=LLMDirector(api_key="x", transport=boom)).plan(InputPackage(text=story), 8, logs.append)
    assert s.source == "heuristic"
