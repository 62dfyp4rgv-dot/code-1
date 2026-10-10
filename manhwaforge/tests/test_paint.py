import math

import numpy as np
from PIL import Image, ImageDraw

from forge.models import Critique
from forge.render.paint import Paint
from forge.render.panel import RenderParams
from forge.styles import PRESETS, analyze_image, choose_style


def make(size=(400, 400), light_side=1, looseness=0.3, hh=120, seed=1):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    mask = Image.new("L", size, 0)
    return layer, mask, Paint(layer, mask, (0, 0, size[0], size[1]), 3, hh, light_side, seed, (20, 16, 20), looseness)


def disc(cx=200, cy=200, r=110):
    return [(cx + math.cos(a) * r, cy + math.sin(a) * r) for a in [i * math.pi / 30 for i in range(60)]]


def lum(img, x, y):
    r, g, b, _ = img.getpixel((x, y))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def test_volume_shading_turns_a_flat_disc_into_a_round_form_lit_from_the_light_side():
    for side in (1, -1):
        layer, _, P = make(light_side=side, looseness=0.0)
        P.fill(disc(r=48), (230, 190, 170), "skin")               # about the size of a face at this head height
        P.finish(grain=0)
        toward, away = lum(layer, 200 + side * 30, 200), lum(layer, 200 - side * 30, 200)
        assert toward > away + 5, (side, toward, away)          # the side facing the light is brighter
        assert lum(layer, 200, 200) > 0                           # and the fill is intact inside


def test_shadow_is_warm_not_grey():
    layer, _, P = make(light_side=1, looseness=0.0)
    P.fill(disc(r=48), (230, 190, 170), "skin")
    P.finish(grain=0)
    r, g, b, _ = layer.getpixel((172, 200))                       # shadow side
    assert r > b and (r - g) > (230 - 190) * 0.9 - 5              # red channel survives, green/blue drop: warm shadow


def test_pen_lines_have_varying_width_not_a_uniform_outline():
    layer, _, P = make(looseness=0.0)
    P.hand_line([(30, 200), (200, 190), (370, 205)], 8)
    P.finish(shade=False, grain=0)
    widths = [sum(1 for y in range(150, 250) if layer.getpixel((x, y))[3] > 128) for x in range(60, 340, 4)]
    assert max(widths) - min(widths) >= 2 and len(set(widths)) > 3


def test_looseness_changes_the_line_and_makes_it_overshoot():
    def stroke(L):
        layer, _, P = make(looseness=L, seed=4)
        P.hand_line([(100, 200), (300, 200)], 6)
        P.finish(shade=False, grain=0)
        alpha = np.asarray(layer.getchannel("A"))
        cols = np.nonzero(alpha.max(axis=0) > 100)[0]
        return alpha, cols.min(), cols.max()
    a0, lo0, hi0 = stroke(0.0)
    a1, lo1, hi1 = stroke(1.0)
    assert not np.array_equal(a0, a1)
    assert lo1 < 100 or hi1 > 300                                  # loose pen runs past its end points


def test_flyaway_hairs_leave_the_hair_shape():
    layer, _, P = make(looseness=0.9)
    hair = [(150, 150), (250, 150), (250, 250), (150, 250)]
    P.fill(hair, (40, 40, 44), "hair")
    P.flyaways(hair, 12, 90, 3, (20, 20, 24), (200, 200))
    P.finish(shade=False, grain=0)
    alpha = np.asarray(layer.getchannel("A"))
    outside = alpha.copy()
    outside[150:251, 150:251] = 0
    assert (outside > 100).sum() > 100


def test_head_rotation_moves_painted_shapes():
    def centroid(angle):
        layer, _, P = make(looseness=0.0)
        P.set_rotation(angle, (200, 300))
        P.fill([(180, 100), (220, 100), (220, 140), (180, 140)], (200, 120, 120), "skin")
        P.clear_rotation()
        P.finish(shade=False, grain=0)
        a = np.asarray(layer.getchannel("A")) > 100
        ys, xs = np.nonzero(a)
        return xs.mean(), ys.mean()
    x0, _ = centroid(0.0)
    x1, _ = centroid(0.3)
    assert abs(x1 - x0) > 20 and 195 < x0 < 205


def test_brush_marks_appear_only_when_loose():
    def texture(L):
        layer, _, P = make(looseness=L, seed=3)
        P.fill(disc(r=60), (230, 190, 170), "skin")
        P.finish(grain=0)
        a = np.asarray(layer.convert("L"), dtype=float)[150:250, 145:200]
        return float(np.abs(np.diff(a, axis=1)).mean())
    assert texture(0.9) > texture(0.3) * 1.15            # brush strokes: loose styles only
    assert abs(texture(0.3) - texture(0.0)) < 0.35      # clean styles stay smooth


def test_exposure_is_a_refinement_lever_for_dim_panels():
    dim = Critique(lighting=3.0, lines=8, amazement=5.5, passed=False,
                   details={"range": 0.38, "need_range": 0.8, "keyfill": 0.13, "light_grad": 0.08, "separation": 0.7, "crushed": 0.05})
    p = RenderParams().refined(dim, 0)
    assert p.exposure > 0 and p.glow_pool > 0
    assert p.refined(dim, 1).exposure > p.exposure                   # and it escalates


def test_stark_muted_ink_references_select_the_sketch_painterly_style(tmp_path):
    im = Image.new("RGB", (400, 600), (247, 246, 246))
    d = ImageDraw.Draw(im)
    d.ellipse([60, 40, 340, 330], fill=(10, 9, 9))                                  # black hair mass
    d.ellipse([130, 180, 270, 360], fill=(142, 125, 120), outline=(20, 18, 18), width=3)   # warm grey face
    for k in range(120):
        d.line([(40 + k * 2.5, 330), (30 + k * 2.7, 450 + (k % 7) * 12)], fill=(20, 18, 18), width=1)
        d.line([(60 + k * 2.2, 60), (40 + k * 2.6, 170)], fill=(235, 235, 235), width=1)
    p = tmp_path / "sketch.png"
    im.save(p)
    ref = analyze_image(p)
    assert ref.contrast > 0.9 and ref.saturation < 0.12
    assert choose_style("auto", "a quiet story", [ref]).key == "sketch_painterly"
    assert PRESETS["sketch_painterly"].looseness > PRESETS["korean_manhwa"].looseness
