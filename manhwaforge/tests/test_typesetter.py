from PIL import Image

from forge.agents.typesetter import Typesetter, sfx_kind
from forge.models import Dialogue, PanelCharacter, PanelSpec
from forge.render.panel import RenderParams, panel_size, render_panel
from forge.styles import PRESETS, design_character

STYLE = PRESETS["cel_shaded"]
SHEETS = {"Jin": design_character("Jin", "black hair, black coat", "t", STYLE), "Mira": design_character("Mira", "silver hair", "t", STYLE)}


def box_overlap(a, b):
    return max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[1], b[1]))


def make(dialogue, sfx=(), shot="wide"):
    spec = PanelSpec(index=1, shot=shot, location="street", time_of_day="night", pacing="impact" if sfx else "normal",
                     characters=[PanelCharacter(name="Mira", position="left"), PanelCharacter(name="Jin", position="right")],
                     dialogue=dialogue, sfx=list(sfx))
    r = render_panel(spec, STYLE, SHEETS, RenderParams(), panel_size(spec, "webtoon"), 1)
    return spec, r


def test_bubbles_avoid_faces_and_each_other():
    spec, r = make([Dialogue(speaker="Mira", text="Jin, wait! You can't go out there alone!"),
                    Dialogue(speaker="Jin", text="I have to. Nobody else can stop it."),
                    Dialogue(speaker=None, text="Rain hammered the street.", kind="caption")], sfx=["CRASH!"])
    t = Typesetter().typeset(r, spec)
    kinds = [p.kind for p in t.placed]
    assert kinds.count("speech") == 2 and "caption" in kinds and "sfx" in kinds          # nothing silently dropped
    heads = [f.head_box for f in r.figures]
    for p in t.placed:
        if p.kind in ("speech", "caption"):
            assert all(box_overlap(p.box, h) < 0.2 * (h[2] - h[0]) * (h[3] - h[1]) for h in heads), p
    boxes = [p.box for p in t.placed]
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            assert box_overlap(boxes[i], boxes[j]) == 0
    for p in t.placed:
        assert p.box[0] >= -1 and p.box[2] <= 801                                     # stays inside the panel


def test_all_bubble_types_render_and_change_pixels():
    base = Image.new("RGB", (800, 600), (40, 40, 60))
    for kind in ("speech", "thought", "shout", "whisper", "caption"):
        spec = PanelSpec(index=0, dialogue=[Dialogue(speaker=None, text="Hello there, world", kind=kind)])
        t = Typesetter().typeset(base, spec)
        assert [p.kind for p in t.placed] == [kind]
        assert t.image.tobytes() != base.tobytes()


def test_crowded_panel_extends_instead_of_covering_the_art():
    long = "This is a long line of dialogue that needs a lot of room to be read comfortably."
    spec = PanelSpec(index=0, dialogue=[Dialogue(text=long)] * 3)
    base = Image.new("RGB", (800, 220), (20, 20, 30))
    t = Typesetter().typeset(base, spec)
    assert t.extended_by > 0 and t.image.height == 220 + t.extended_by
    assert len(t.placed) == 3


def test_sfx_classification():
    assert sfx_kind("BOOM!") == "hit" and sfx_kind("SHING!") == "slash" and sfx_kind("tap tap") == "soft"
