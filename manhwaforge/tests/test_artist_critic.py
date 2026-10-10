import numpy as np
from PIL import Image, ImageFilter

from forge import config
from forge.agents.artist import Artist, CharacterBank, ProceduralProvider
from forge.agents.critic import Critic
from forge.models import Critique, PanelCharacter, PanelSpec
from forge.render.panel import RenderParams, RenderResult, panel_size, render_panel
from forge.styles import PRESETS, design_character

STYLE = PRESETS["webtoon_digital"]
JIN = design_character("Jin", "tall slim man with messy black hair, crimson eyes, long black coat", "t", STYLE)
MIRA = design_character("Mira", "girl with long silver hair, blue eyes, white school uniform", "t", STYLE)
SHEETS = {"Jin": JIN, "Mira": MIRA}


def spec(**kw):
    base = dict(index=0, shot="medium", location="interior", time_of_day="day",
                characters=[PanelCharacter(name="Mira", expression="smile", position="center")])
    base.update(kw)
    return PanelSpec(**base)


# ------------------------------------------------------------------ critic
def test_critic_scores_bad_images_low_and_a_good_render_high():
    c = Critic()
    flat = c.score(RenderResult(image=Image.new("RGB", (800, 600), (128, 128, 128))), PanelSpec(index=0), {})
    noise = c.score(RenderResult(image=Image.fromarray(np.random.default_rng(1).integers(0, 255, (600, 800, 3), dtype=np.uint8))), PanelSpec(index=0), {})
    s = spec()
    good = render_panel(s, STYLE, SHEETS, RenderParams(), panel_size(s, "webtoon"), 3)
    blurred = RenderResult(image=good.image.filter(ImageFilter.GaussianBlur(5)), figures=good.figures, figure_mask=good.figure_mask)
    sg, sb = c.score(good, s, SHEETS), c.score(blurred, s, SHEETS)
    assert flat.amazement < 4 and not flat.passed
    assert noise.amazement < config.AMAZEMENT_THRESHOLD
    assert sg.amazement >= config.AMAZEMENT_THRESHOLD and sg.passed
    assert sb.lines < sg.lines - 2                      # soft edges are caught by the line-quality component
    assert sb.amazement < sg.amazement


def test_critic_detects_character_colour_drift():
    s = spec()
    r = render_panel(s, STYLE, SHEETS, RenderParams(), panel_size(s, "webtoon"), 3)
    ok = Critic().score(r, s, SHEETS)
    wrong = dict(SHEETS)
    wrong["Mira"] = MIRA.model_copy(update={"hair": (230, 20, 20), "skin": (30, 90, 40), "outfit": (200, 200, 20)})
    bad = Critic().score(r, s, wrong)                   # same pixels judged against a different character sheet
    assert bad.anatomy < ok.anatomy - 2


def test_critic_flags_missing_character_and_has_no_anatomy_score_without_characters():
    s = spec(characters=[PanelCharacter(name="Mira"), PanelCharacter(name="Jin", position="right")])
    r = render_panel(spec(), STYLE, SHEETS, RenderParams(), panel_size(s, "webtoon"), 3)   # Jin not drawn
    assert Critic().score(r, s, SHEETS).anatomy < 6
    s0 = spec(characters=[], shot="wide", location="mountain")
    r0 = render_panel(s0, STYLE, SHEETS, RenderParams(), panel_size(s0, "webtoon"), 3)
    assert Critic().score(r0, s0, SHEETS).anatomy is None


def test_refinement_converges_on_a_hard_dark_scene():
    """The scene that used to stall: black-haired character against a night sky."""
    s = spec(shot="close", location="city", time_of_day="night", lighting="moonlit",
             characters=[PanelCharacter(name="Jin", expression="angry")])
    critic = Critic()
    art = Artist(ProceduralProvider(), critic).paint_panel(s, STYLE, SHEETS, "webtoon", 7)
    assert art.history[0] < art.history[-1]
    assert art.critique.passed and not art.below_threshold


# ------------------------------------------------------------------ artist loop (stubbed, so it is fast and exact)
class StubProvider:
    name = "stub"

    def __init__(self):
        self.calls = []

    def generate(self, spec, style, sheets, params, size, seed):
        self.calls.append(params.round)
        return RenderResult(image=Image.new("RGB", (32, 32)), prompt=f"round {params.round}", params=params)


class ScriptedCritic:
    def __init__(self, scores):
        self.scores, self.i = scores, 0

    def score(self, result, spec, sheets):
        a = self.scores[min(self.i, len(self.scores) - 1)]
        self.i += 1
        return Critique(lighting=a, lines=a, amazement=a, passed=a >= 7.5, notes=["lighting: flat"], details={"range": 0.1, "need_range": 0.7})


def test_artist_reprompts_until_the_gate_is_cleared():
    prov = StubProvider()
    art = Artist(prov, ScriptedCritic([5.0, 6.4, 7.6, 9.0])).paint_panel(spec(), STYLE, SHEETS, "webtoon", 1)
    assert art.attempts == 3 and art.history == [5.0, 6.4, 7.6]
    assert art.critique.amazement == 7.6 and not art.below_threshold
    assert prov.calls == [0, 1, 2]                      # each retry carried a refinement round
    assert art.prompts[2] != art.prompts[0]


def test_artist_caps_retries_and_flags_the_best_attempt_it_found():
    prov = StubProvider()
    art = Artist(prov, ScriptedCritic([5.0, 6.9, 6.0, 5.5]), max_attempts=4).paint_panel(spec(), STYLE, SHEETS, "webtoon", 1)
    assert art.attempts == 4 and art.below_threshold
    assert art.critique.amazement == 6.9                # best, not last


def test_artist_checkpoint_can_abort_the_loop():
    class Stop(Exception):
        pass

    def cp():
        raise Stop()
    try:
        Artist(StubProvider(), ScriptedCritic([5.0])).paint_panel(spec(), STYLE, SHEETS, "webtoon", 1, checkpoint=cp)
    except Stop:
        return
    raise AssertionError("checkpoint was ignored")


# ------------------------------------------------------------------ character bank
def test_character_bank_persists_and_reuses_sheets(tmp_path):
    from forge.models import CharacterSpec
    logs = []
    specs = [CharacterSpec(name="Jin", description="tall man, red hair, blue eyes"), CharacterSpec(name="Mira", description="")]
    b1 = CharacterBank("series-x", tmp_path).ensure(specs, STYLE, logs.append)
    assert (tmp_path / "series" / "series-x" / "characters" / "jin.png").exists()
    b2 = CharacterBank("series-x", tmp_path).ensure(specs, STYLE, logs.append)     # a later chapter of the same series
    assert b1["Jin"] == b2["Jin"] and b1["Mira"] == b2["Mira"]
    assert any("reusing" in m for m in logs)
    other = CharacterBank("series-y", tmp_path).ensure(specs, STYLE)
    assert other["Mira"].seed != b1["Mira"].seed        # different series, different invented look
    redesigned = CharacterBank("series-x", tmp_path).ensure([CharacterSpec(name="Jin", description="short woman, green hair")], STYLE)
    assert redesigned["Jin"].hair != b1["Jin"].hair     # an explicitly changed description wins


def test_same_sheet_renders_same_character_across_panels():
    """Hair/skin/outfit colours stay locked to the sheet in different shots and lighting (the gate itself is on the
    overall score; this asserts the identity sub-score stays solid, judged against the bank's sheet)."""
    c = Critic()
    for shot, tod in (("medium", "day"), ("close", "sunset"), ("wide", "night")):
        s = spec(shot=shot, time_of_day=tod, location="street")
        art = Artist(ProceduralProvider(), c).paint_panel(s, STYLE, SHEETS, "webtoon", 5)
        assert (art.critique.anatomy or 0) >= 6.5 and art.critique.passed
