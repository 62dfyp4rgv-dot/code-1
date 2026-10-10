import numpy as np
import pytest
from PIL import Image, ImageDraw

from forge.models import PanelCharacter, PanelSpec
from forge.render.figures import EXPRESSIONS
from forge.render.panel import RenderParams, panel_size, render_panel
from forge.styles import PRESETS, analyze_image, choose_style, design_character

K = PRESETS["korean_manhwa"]


def test_every_preset_uses_the_semi_realistic_figure_except_the_explicit_legacy_one():
    assert {k for k, s in PRESETS.items() if s.figure == "stylized"} == {"flat_vector"}


def test_clean_lineart_references_map_to_korean_manhwa_and_flat_vector_is_never_auto(tmp_path):
    # soft-shaded light portrait on paper (like the supplied references)
    im = Image.new("RGB", (400, 600), (252, 247, 245))
    d = ImageDraw.Draw(im)
    d.ellipse([120, 120, 280, 320], fill=(246, 222, 214), outline=(60, 50, 55), width=2)
    d.arc([100, 80, 300, 400], 200, 340, fill=(40, 40, 46), width=3)
    p = tmp_path / "ref.png"
    im.save(p)
    ref = analyze_image(p)
    assert choose_style("auto", "two coworkers at the office", [ref]).key == "korean_manhwa"
    assert choose_style("auto", "a story", []).key != "flat_vector"
    assert choose_style("flat_vector", "a story", []).key == "flat_vector"      # only when asked for
    assert choose_style("auto", "the knight drew his sword as the dragon roared in a battle of magic", []).key == "fantasy_action"


def test_reference_palette_ignores_paper_white_and_greys(tmp_path):
    im = Image.new("RGB", (100, 100), (254, 254, 254))
    p = tmp_path / "white.png"
    im.save(p)
    s = choose_style("korean_manhwa", "x", [analyze_image(p)])
    assert s.palette_bias is None


def test_gender_and_glasses_come_from_the_description_only():
    f = design_character("Seo", "a woman with long straight dark grey hair and green eyes", "s", K)
    m = design_character("Han", "a man with short black hair and glasses, white shirt", "s", K)
    n = design_character("Alex", "tall, silver hair", "s", K)
    assert (f.gender, m.gender, n.gender) == ("female", "male", "neutral")
    assert m.accessory == "glasses" and f.accessory == ""


@pytest.mark.parametrize("name,desc", [("Seo", "a woman with long grey hair, green eyes"), ("Han", "a man with short black hair and glasses")])
def test_every_expression_and_view_renders_in_the_semi_figure(name, desc):
    sheet = design_character(name, desc, "s", K)
    for expr in EXPRESSIONS:
        for shot in ("close", "medium"):
            spec = PanelSpec(index=0, shot=shot, location="abstract", characters=[PanelCharacter(name=name, expression=expr, position="center")])
            r = render_panel(spec, K, {name: sheet}, RenderParams(), (400, 450), 1)
            arr = np.asarray(r.image)
            assert arr.shape == (450, 400, 3) and arr.std() > 5
            assert r.figures and r.figures[0].face_box[2] > r.figures[0].face_box[0]


def test_semi_figure_differs_from_legacy_and_keeps_sheet_colours():
    sheet = design_character("Seo", "a woman with long grey hair, green eyes", "s", K)
    spec = PanelSpec(index=0, shot="close", location="abstract", characters=[PanelCharacter(name="Seo")])
    a = render_panel(spec, K, {"Seo": sheet}, RenderParams(), (400, 450), 1).image
    b = render_panel(spec, PRESETS["flat_vector"], {"Seo": sheet}, RenderParams(), (400, 450), 1).image
    assert np.abs(np.asarray(a, dtype=int) - np.asarray(b, dtype=int)).mean() > 4
