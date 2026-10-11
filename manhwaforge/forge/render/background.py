"""Procedural background library: one drawer per location family."""
from __future__ import annotations

import math
import random
from dataclasses import dataclass

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from ..models import PanelSpec, StyleProfile
from .util import RGB, blur_arr, mix, radial_blend, radial_mask, shade, to_arr, to_img, vgradient

SKY: dict[str, list[tuple[float, RGB]]] = {
    "dawn":   [(0.0, (62, 72, 128)), (0.55, (226, 140, 130)), (1.0, (255, 214, 160))],
    "day":    [(0.0, (74, 140, 226)), (0.6, (150, 205, 248)), (1.0, (214, 238, 252))],
    "sunset": [(0.0, (44, 38, 108)), (0.5, (210, 88, 96)), (1.0, (255, 186, 106))],
    "night":  [(0.0, (6, 8, 26)), (0.6, (20, 30, 74)), (1.0, (58, 70, 120))],
    "indoor": [(0.0, (60, 54, 70)), (1.0, (104, 90, 96))],
}

LOCATION_FAMILIES = {
    "city": ("city", "skyline", "downtown", "metropolis", "tower", "skyscraper"),
    "street": ("street", "alley", "road", "avenue", "market", "subway", "station", "bridge"),
    "rooftop": ("rooftop", "roof", "balcony", "terrace"),
    "forest": ("forest", "woods", "jungle", "grove", "garden", "park", "trees"),
    "interior": ("room", "bedroom", "apartment", "office", "cafe", "café", "classroom", "kitchen", "house",
                 "hall", "library", "hospital", "lab", "shop", "restaurant", "indoors", "interior"),
    "castle": ("castle", "dungeon", "palace", "throne", "temple", "cathedral", "cave", "ruins", "tomb"),
    "battlefield": ("battlefield", "wasteland", "arena", "desert", "war", "crater", "volcano", "ashes"),
    "mountain": ("mountain", "cliff", "hill", "valley", "canyon", "peak"),
    "ocean": ("ocean", "sea", "beach", "shore", "harbor", "harbour", "lake", "river", "ship"),
    "school": ("school", "campus", "courtyard", "academy", "university"),
}


def classify_location(text: str) -> str:
    t = text.lower()
    best, best_i = "abstract", 10**9
    for fam, words in LOCATION_FAMILIES.items():
        for w in words:
            i = t.find(w)
            if i != -1 and i < best_i:
                best, best_i = fam, i
    return best


@dataclass
class Backdrop:
    image: Image.Image
    horizon: int
    light_xy: tuple[float, float]       # light source position in px
    key_color: RGB                       # colour of the key light
    ambient: RGB                         # colour the whole scene is washed with
    dark: bool


def sky_colors(spec: PanelSpec, style: StyleProfile) -> list[tuple[float, RGB]]:
    base = list(SKY.get(spec.time_of_day, SKY["day"]))
    if spec.weather in ("rain", "fog", "snow"):
        grey = (110, 118, 130) if spec.time_of_day != "night" else (30, 36, 52)
        base = [(p, mix(c, grey, 0.55)) for p, c in base]
    if style.palette_bias:
        base = [(p, mix(c, style.palette_bias, 0.14)) for p, c in base]
    mood = spec.mood
    if mood in ("sad", "melancholy", "lonely"):
        base = [(p, mix(c, (90, 110, 150), 0.25)) for p, c in base]
    elif mood in ("dread", "horror", "ominous"):
        base = [(p, mix(c, (70, 20, 30), 0.30)) for p, c in base]
    return base


# ----------------------------------------------------------------- building blocks
def _windows_rect(d: ImageDraw.ImageDraw, x0, y0, x1, y1, rng, night: bool, lit: RGB, dark: RGB, cell: int):
    cols = max(1, int((x1 - x0) // cell))
    rows = max(1, int((y1 - y0) // cell))
    for r in range(rows):
        for c in range(cols):
            if rng.random() < 0.25:
                continue
            wx, wy = x0 + c * cell + cell * 0.25, y0 + r * cell + cell * 0.2
            on = night and rng.random() < 0.38
            d.rectangle([wx, wy, wx + cell * 0.5, wy + cell * 0.6], fill=lit if on else dark)


def _skyline(img: Image.Image, base_y: int, max_h: int, color: RGB, rng, night: bool, lit: RGB,
             win_dark: RGB, cell: int, min_w_div: int = 14, max_w_div: int = 6):
    W = img.width
    d = ImageDraw.Draw(img, "RGBA")
    x = -rng.randint(0, W // 10)
    while x < W:
        bw = rng.randint(W // min_w_div, W // max_w_div)
        bh = rng.randint(int(max_h * 0.35), max_h)
        top = base_y - bh
        d.rectangle([x, top, x + bw, base_y + 4], fill=color)
        r = rng.random()
        if r < 0.25:   # antenna
            ax = x + bw // 2
            d.line([ax, top, ax, top - bh * 0.18], fill=color, width=max(2, W // 300))
        elif r < 0.45:  # stepped roof
            d.rectangle([x + bw * 0.2, top - bh * 0.07, x + bw * 0.8, top], fill=color)
        _windows_rect(d, x + bw * 0.08, top + bh * 0.06, x + bw * 0.92, base_y - bh * 0.05, rng, night, lit,
                      win_dark, cell)
        x += bw + rng.randint(0, W // 50)


def _stars(img: Image.Image, rng, n: int, ymax: int):
    d = ImageDraw.Draw(img, "RGBA")
    for _ in range(n):
        x, y = rng.randint(0, img.width), rng.randint(0, ymax)
        r = rng.choice([1, 1, 1, 2, 3]) * max(1, img.width // 800)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 240, rng.randint(120, 255)))


def _celestial(img: Image.Image, spec: PanelSpec, x: float, y: float, r: float) -> RGB:
    """Sun or moon with halo; returns the key-light colour."""
    W, H = img.size
    if spec.time_of_day == "night":
        col, halo = (238, 240, 255), (150, 170, 255)
    elif spec.time_of_day in ("sunset", "dawn"):
        col, halo = (255, 232, 170), (255, 150, 90)
    else:
        col, halo = (255, 250, 220), (255, 240, 190)
    arr = to_arr(img)
    radial_blend(arr, x, y, r * 6, halo, 0.55, 2.2)
    out = to_img(arr)
    ImageDraw.Draw(out, "RGBA").ellipse([x - r, y - r, x + r, y + r], fill=col + (255,))
    img.paste(out)
    return col


def _haze(img: Image.Image, y0: int, y1: int, color: RGB, strength: float):
    arr = to_arr(img)
    H = arr.shape[0]
    ys = np.arange(H, dtype=np.float32)
    edge = max(H * 0.03, 1.0)
    m = np.clip((ys - y0) / edge, 0, 1) * np.clip((y1 - ys) / edge, 0, 1)
    m = (m * strength)[:, None, None]
    arr = arr * (1 - m) + np.array(color, dtype=np.float32) * m
    img.paste(to_img(arr))


# ----------------------------------------------------------------- families
def _city(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    cell = max(8, W // 70)
    for i, (k, hmul) in enumerate([(0.55, 0.50), (0.38, 0.62), (0.22, 0.80)]):
        col = mix(sky_bottom, (10, 14, 30) if night else (60, 70, 100), k + 0.25)
        _skyline(img, hz + int(H * 0.05 * (i + 1)), int(H * hmul), col, rng, night, lit,
                 mix(col, (255, 255, 255), 0.06), cell + i * 2)
        _haze(img, hz - int(H * 0.2), hz + int(H * 0.2), sky_bottom, 0.18)
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([0, hz + int(H * 0.17), W, H], fill=shade(sky_bottom, 0.25) + (255,))


def _street(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    d = ImageDraw.Draw(img, "RGBA")
    vpx = W * rng.uniform(0.42, 0.58)
    wall_a = mix(sky_bottom, (20, 22, 40) if night else (110, 100, 100), 0.55)
    wall_b = shade(wall_a, 0.82)
    gap = W * 0.07
    # far end glow
    d.rectangle([vpx - gap, hz - H * 0.10, vpx + gap, hz + H * 0.02], fill=mix(sky_bottom, (255, 255, 255), 0.2) + (255,))
    # ground
    ground = [(0, H), (W, H), (vpx + gap, hz + H * 0.02), (vpx - gap, hz + H * 0.02)]
    d.polygon(ground, fill=shade(wall_a, 0.55) + (255,))
    # walls
    left = [(0, -H * 0.1), (vpx - gap, hz - H * 0.18), (vpx - gap, hz + H * 0.02), (0, H * 0.86)]
    right = [(W, -H * 0.1), (vpx + gap, hz - H * 0.18), (vpx + gap, hz + H * 0.02), (W, H * 0.86)]
    d.polygon(left, fill=wall_a + (255,))
    d.polygon(right, fill=wall_b + (255,))
    # lit windows on both walls (perspective rows)
    for side, xe, xv in ((0, 0.0, vpx - gap), (1, float(W), vpx + gap)):
        top_e, bot_e = -H * 0.1, H * 0.86
        top_v, bot_v = hz - H * 0.18, hz + H * 0.02
        for j in range(1, 9):
            t0, t1 = (j / 9.0) ** 1.6, ((j + 0.55) / 9.0) ** 1.6
            x0 = xe + (xv - xe) * t0
            x1 = xe + (xv - xe) * t1
            for r in range(1, 6):
                f0, f1 = r / 6.4, (r + 0.5) / 6.4
                def yy(t, f):
                    top = top_e + (top_v - top_e) * t
                    bot = bot_e + (bot_v - bot_e) * t
                    return top + (bot - top) * f
                if rng.random() < 0.3:
                    continue
                on = night and rng.random() < 0.4
                col = lit if on else mix(wall_a, (255, 255, 255), 0.08)
                d.polygon([(x0, yy(t0, f0)), (x1, yy(t1, f0)), (x1, yy(t1, f1)), (x0, yy(t0, f1))], fill=col + (255,))
    # road markings
    for k in range(1, 7):
        t = (k / 7.0) ** 1.8
        y = H - (H - hz) * t
        wdt = (W * 0.03) * (1 - t) + 2
        d.polygon([(vpx - wdt, y), (vpx + wdt, y), (vpx + wdt * 0.8, y - (H - hz) * 0.07 * (1 - t) - 3),
                   (vpx - wdt * 0.8, y - (H - hz) * 0.07 * (1 - t) - 3)], fill=(230, 220, 160, 150))
    # street lamps
    if night:
        for xlamp in (W * 0.12, W * 0.88):
            d.line([xlamp, H * 0.9, xlamp, H * 0.25], fill=(30, 30, 40, 255), width=max(3, W // 140))
            d.ellipse([xlamp - W * 0.025, H * 0.22, xlamp + W * 0.025, H * 0.27], fill=lit + (255,))


def _rooftop(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    cell = max(6, W // 100)
    col = mix(sky_bottom, (8, 10, 24) if night else (70, 80, 110), 0.7)
    _skyline(img, hz + int(H * 0.2), int(H * 0.35), col, rng, night, lit, mix(col, (255, 255, 255), 0.06), cell, 20, 9)
    _haze(img, hz - int(H * 0.1), hz + int(H * 0.25), sky_bottom, 0.25)
    d = ImageDraw.Draw(img, "RGBA")
    top = int(H * 0.82)
    d.rectangle([0, top, W, H], fill=shade(col, 0.55) + (255,))
    d.rectangle([0, top, W, top + H * 0.012], fill=mix(sky_bottom, (255, 255, 255), 0.35) + (255,))
    for x in range(0, W, max(40, W // 12)):  # railing posts
        d.line([x, top - H * 0.07, x, top], fill=shade(col, 0.4) + (255,), width=max(2, W // 280))
    d.line([0, top - H * 0.07, W, top - H * 0.07], fill=shade(col, 0.4) + (255,), width=max(2, W // 280))


def _forest(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    d = ImageDraw.Draw(img, "RGBA")
    ground_c = mix((34, 60, 40), (6, 12, 14), 0.7 if night else 0.0)
    d.rectangle([0, hz, W, H], fill=ground_c + (255,))
    for layer, (alpha, tw, n) in enumerate([(0.35, 0.02, 14), (0.6, 0.035, 9), (1.0, 0.06, 6)]):
        base = mix(sky_bottom, (6, 18, 14) if night else (22, 48, 34), 0.55 + 0.15 * layer)
        for _ in range(n):
            x = rng.uniform(-0.05, 1.05) * W
            w = W * tw * rng.uniform(0.8, 1.3)
            top = -H * 0.05
            d.polygon([(x - w * 0.55, H), (x - w * 0.35, top), (x + w * 0.35, top), (x + w * 0.55, H)],
                      fill=shade(base, 1.0) + (int(255 * min(1.0, alpha + 0.15)),))
            for _ in range(3):  # canopy blobs
                cx, cy = x + rng.uniform(-w * 3, w * 3), rng.uniform(0, H * 0.3)
                r = rng.uniform(W * 0.05, W * 0.11)
                d.ellipse([cx - r, cy - r * 0.7, cx + r, cy + r * 0.7], fill=shade(base, 0.9) + (int(220 * alpha),))
        _haze(img, int(H * 0.15), int(H * 0.9), sky_bottom, 0.12)
        d = ImageDraw.Draw(img, "RGBA")
    # light shafts
    arr = to_arr(img)
    xs, ys = np.arange(W, dtype=np.float32)[None, :], np.arange(H, dtype=np.float32)[:, None]
    shaft = np.zeros((H, W), dtype=np.float32)
    for _ in range(4):
        x0 = rng.uniform(0.1, 0.9) * W
        slope = rng.uniform(0.3, 0.6)
        shaft += np.clip(1 - np.abs((xs - x0) - ys * slope) / (W * 0.04), 0, 1) * rng.uniform(0.25, 0.6)
    shaft = blur_arr(np.clip(shaft, 0, 1), W * 0.01)[..., None] * (0.25 if night else 0.35)
    arr = arr * (1 - shaft) + np.array(lit, dtype=np.float32) * shaft
    img.paste(to_img(arr))


def _interior(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    d = ImageDraw.Draw(img, "RGBA")
    warm = (spec.time_of_day == "night") or spec.lighting in ("candle", "neon")
    wall = mix((214, 200, 186), (70, 56, 66), 0.6 if warm else 0.15)
    floor = shade(mix((150, 112, 82), (50, 36, 40), 0.5 if warm else 0.1), 1.0)
    d.rectangle([0, 0, W, H], fill=wall + (255,))
    fy = int(H * 0.72)
    d.polygon([(0, fy), (W, fy), (W, H), (0, H)], fill=floor + (255,))
    d.polygon([(0, fy), (W * 0.18, fy - H * 0.02), (W * 0.82, fy - H * 0.02), (W, fy)], fill=shade(floor, 0.8) + (255,))
    d.rectangle([0, fy - H * 0.035, W, fy - H * 0.015], fill=shade(wall, 0.8) + (255,))
    # window with sky
    wx0, wx1 = W * rng.uniform(0.08, 0.18), W * rng.uniform(0.38, 0.5)
    wy0, wy1 = H * 0.12, H * 0.55
    sky = vgradient(int(wx1 - wx0), int(wy1 - wy0), SKY["night" if spec.time_of_day == "night" else
                                                      spec.time_of_day if spec.time_of_day in SKY else "day"])
    img.paste(to_img(sky), (int(wx0), int(wy0)))
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([wx0, wy0, wx1, wy1], outline=shade(wall, 0.45) + (255,), width=max(4, W // 150))
    d.line([(wx0 + wx1) / 2, wy0, (wx0 + wx1) / 2, wy1], fill=shade(wall, 0.45) + (255,), width=max(3, W // 200))
    d.line([wx0, (wy0 + wy1) / 2, wx1, (wy0 + wy1) / 2], fill=shade(wall, 0.45) + (255,), width=max(3, W // 200))
    # furniture
    fcol = shade(floor, 0.7)
    d.rectangle([W * 0.58, H * 0.22, W * 0.92, H * 0.64], fill=shade(wall, 0.72) + (255,))   # bookshelf
    for r in range(1, 5):
        yy = H * 0.22 + (H * 0.42) * r / 5
        d.line([W * 0.58, yy, W * 0.92, yy], fill=shade(fcol, 0.9) + (255,), width=max(3, W // 200))
        x = W * 0.6
        while x < W * 0.9:
            bw = rng.uniform(W * 0.01, W * 0.025)
            bh = rng.uniform(H * 0.04, H * 0.075)
            d.rectangle([x, yy - bh, x + bw, yy], fill=mix(fcol, (rng.randint(80, 220), rng.randint(60, 160), rng.randint(60, 200)), 0.55) + (255,))
            x += bw + 2
    d.rectangle([W * 0.1, fy - H * 0.02, W * 0.5, fy + H * 0.02], fill=fcol + (255,))      # low table / desk
    d.rectangle([W * 0.12, fy + H * 0.02, W * 0.14, fy + H * 0.12], fill=shade(fcol, 0.8) + (255,))
    d.rectangle([W * 0.46, fy + H * 0.02, W * 0.48, fy + H * 0.12], fill=shade(fcol, 0.8) + (255,))
    # ceiling lamp glow
    arr = to_arr(img)
    radial_blend(arr, W * 0.55, 0, W * 0.8, lit, 0.35, 1.8)
    img.paste(to_img(arr))


def _castle(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    d = ImageDraw.Draw(img, "RGBA")
    stone = (92, 90, 104)
    d.rectangle([0, 0, W, H], fill=shade(stone, 0.55) + (255,))
    bh = H / 14
    for r in range(15):
        off = (r % 2) * (W / 12)
        x = -off
        while x < W:
            bw = W / 6
            d.rectangle([x + 1, r * bh + 1, x + bw - 1, (r + 1) * bh - 1],
                        fill=shade(stone, rng.uniform(0.42, 0.7)) + (255,))
            x += bw
    # arches
    for ax in (W * 0.25, W * 0.75):
        aw = W * 0.14
        d.rectangle([ax - aw, H * 0.3, ax + aw, H * 0.82], fill=(10, 10, 18, 255))
        d.pieslice([ax - aw, H * 0.18, ax + aw, H * 0.42], 180, 360, fill=(10, 10, 18, 255))
    d.rectangle([0, H * 0.8, W, H], fill=shade(stone, 0.35) + (255,))
    # torches
    arr = to_arr(img)
    for tx in (W * 0.5, W * 0.06, W * 0.94):
        radial_blend(arr, tx, H * 0.38, W * 0.42, (255, 160, 70), 0.6, 1.6)
        d2 = ImageDraw.Draw(img, "RGBA")
        d2.ellipse([tx - W * 0.012, H * 0.35, tx + W * 0.012, H * 0.4], fill=(255, 210, 120, 255))
    img.paste(to_img(arr))


def _battlefield(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    d = ImageDraw.Draw(img, "RGBA")
    for layer, (k, amp) in enumerate([(0.45, 0.10), (0.30, 0.07), (0.15, 0.05)]):
        col = mix(sky_bottom, (30, 14, 16), 0.45 + 0.2 * layer)
        pts = [(0, H)]
        x = 0
        while x <= W:
            pts.append((x, hz + H * (0.06 * layer) - rng.uniform(0, H * amp)))
            x += W / 14
        pts.append((W, H))
        d.polygon(pts, fill=col + (255,))
    d.rectangle([0, hz + H * 0.14, W, H], fill=mix(sky_bottom, (24, 12, 12), 0.75) + (255,))
    for _ in range(10):  # debris
        x, y = rng.uniform(0, W), rng.uniform(hz + H * 0.15, H)
        s = rng.uniform(W * 0.01, W * 0.04)
        d.polygon([(x, y), (x + s, y - s * 0.6), (x + s * 1.4, y + s * 0.2)], fill=(20, 14, 16, 255))
    arr = to_arr(img)
    for _ in range(6):  # smoke
        cx, cy = rng.uniform(0, W), rng.uniform(0, hz)
        radial_blend(arr, cx, cy, W * rng.uniform(0.2, 0.35), (40, 30, 34), 0.35, 1.5)
    img.paste(to_img(arr))


def _mountain(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    d = ImageDraw.Draw(img, "RGBA")
    for layer in range(4):
        col = mix(sky_bottom, (18, 22, 44) if night else (60, 76, 110), 0.25 + 0.2 * layer)
        pts = [(0, H)]
        x = -W * 0.05
        while x <= W * 1.05:
            peak = hz - H * rng.uniform(0.0, 0.30) + H * 0.07 * layer
            pts.append((x, peak))
            x += W / rng.uniform(4, 7)
            pts.append((x - W / 12, peak + H * rng.uniform(0.05, 0.12)))
        pts.append((W, H))
        d.polygon(pts, fill=col + (255,))
        if layer < 2:
            for (px, py) in pts[1:-1:2]:
                d.polygon([(px, py), (px - W * 0.03, py + H * 0.05), (px + W * 0.03, py + H * 0.05)],
                          fill=mix(col, (255, 255, 255), 0.7) + (200,))
        _haze(img, hz - int(H * 0.15), hz + int(H * 0.25), sky_bottom, 0.2)
        d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([0, hz + H * 0.3, W, H], fill=mix(sky_bottom, (20, 30, 24), 0.7) + (255,))


def _ocean(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    sea = vgradient(W, H - hz, [(0.0, mix(sky_bottom, (20, 60, 100), 0.6)), (1.0, (6, 24, 52) if night else (14, 60, 110))])
    img.paste(to_img(sea), (0, hz))
    d = ImageDraw.Draw(img, "RGBA")
    for i in range(30):
        y = hz + (H - hz) * (i / 30.0) ** 1.5
        amp = 2 + i * 0.4
        pts = [(x, y + math.sin(x / (W / 14.0) + i) * amp) for x in range(0, W + 10, 20)]
        d.line(pts, fill=mix(sky_bottom, (255, 255, 255), 0.55) + (int(40 + i * 4),), width=max(2, int(1 + i * 0.1)))


def _school(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    d = ImageDraw.Draw(img, "RGBA")
    wall = mix((226, 214, 196), (40, 42, 66), 0.65 if night else 0.0)
    d.rectangle([0, hz - H * 0.3, W, hz + H * 0.12], fill=wall + (255,))
    d.rectangle([0, hz - H * 0.34, W, hz - H * 0.3], fill=shade(wall, 0.6) + (255,))
    _windows_rect(d, 0, hz - H * 0.28, W, hz + H * 0.08, rng, night, lit, mix(wall, (80, 120, 170), 0.5), max(24, W // 14))
    d.rectangle([0, hz + H * 0.12, W, H], fill=mix((180, 170, 150), (30, 32, 44), 0.7 if night else 0.0) + (255,))
    for tx in (W * 0.1, W * 0.88):  # trees
        d.rectangle([tx - W * 0.012, hz - H * 0.02, tx + W * 0.012, hz + H * 0.14], fill=(60, 40, 30, 255))
        d.ellipse([tx - W * 0.09, hz - H * 0.22, tx + W * 0.09, hz + H * 0.02], fill=mix((70, 150, 80), (8, 28, 24), 0.75 if night else 0) + (255,))


def _abstract(img, spec, rng, hz, night, lit, sky_bottom):
    W, H = img.size
    arr = to_arr(img)
    for _ in range(14):  # bokeh
        cx, cy = rng.uniform(0, W), rng.uniform(0, H)
        r = rng.uniform(W * 0.03, W * 0.12)
        radial_blend(arr, cx, cy, r, mix(lit, sky_bottom, rng.random()), rng.uniform(0.08, 0.22), 0.5)
    img.paste(to_img(arr))


_FAMILY_DRAWERS = {
    "city": _city, "street": _street, "rooftop": _rooftop, "forest": _forest, "interior": _interior,
    "castle": _castle, "battlefield": _battlefield, "mountain": _mountain, "ocean": _ocean,
    "school": _school, "abstract": _abstract,
}


def draw_background(spec: PanelSpec, style: StyleProfile, rng: random.Random, W: int, H: int,
                    horizon_frac: float = 0.55) -> Backdrop:
    family = spec.location if spec.location in _FAMILY_DRAWERS else classify_location(spec.location_desc or spec.location)
    stops = sky_colors(spec, style)
    sky_img = to_img(vgradient(W, H, stops))
    hz = int(H * horizon_frac)
    night = spec.time_of_day == "night"
    sky_bottom = stops[-1][1]
    ambient = {"night": (120, 140, 230), "sunset": (255, 160, 120), "dawn": (255, 190, 170),
               "indoor": (255, 210, 170), "day": (255, 255, 255)}.get(spec.time_of_day, (255, 255, 255))
    lit = (255, 214, 130) if night or spec.time_of_day == "indoor" else (255, 244, 200)
    if spec.lighting == "neon":
        lit, ambient = (255, 80, 200), (170, 120, 255)
    elif spec.lighting == "candle":
        lit, ambient = (255, 170, 80), (255, 190, 130)

    outdoors = family not in ("interior", "castle") and spec.time_of_day != "indoor"
    light_xy = (W * rng.choice([0.2, 0.8]), H * 0.18)
    key = lit
    if outdoors and family not in ("forest", "abstract"):
        if night or spec.time_of_day in ("sunset", "dawn", "day"):
            if spec.weather == "clear":
                r = W * (0.05 if night else 0.06)
                key = _celestial(sky_img, spec, light_xy[0], H * rng.uniform(0.10, 0.28), r)
                light_xy = (light_xy[0], H * 0.18)
    if night and outdoors and spec.weather == "clear":
        _stars(sky_img, rng, 70, int(H * 0.45))

    _FAMILY_DRAWERS.get(family, _abstract)(sky_img, spec, rng, hz, night, lit, sky_bottom)

    if spec.weather == "rain":
        d = ImageDraw.Draw(sky_img, "RGBA")
        for _ in range(int(W * 0.45)):
            x, y = rng.uniform(0, W * 1.1), rng.uniform(-H * 0.1, H)
            L = rng.uniform(H * 0.03, H * 0.08)
            d.line([x, y, x - L * 0.25, y + L], fill=(210, 225, 255, rng.randint(40, 110)), width=max(1, W // 700))
    elif spec.weather == "fog":
        _haze(sky_img, int(H * 0.25), H, mix(sky_bottom, (230, 235, 240), 0.5), 0.35)
    elif spec.weather == "snow":
        d = ImageDraw.Draw(sky_img, "RGBA")
        for _ in range(int(W * 0.25)):
            x, y = rng.uniform(0, W), rng.uniform(0, H)
            r = rng.uniform(1, 4) * max(1, W // 800)
            d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, rng.randint(120, 230)))

    return Backdrop(sky_img, hz, light_xy, key, ambient, night or spec.time_of_day == "indoor")
