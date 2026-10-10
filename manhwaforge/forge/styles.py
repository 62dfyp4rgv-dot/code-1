"""Style presets, reference-image analysis, style selection, and character design."""
from __future__ import annotations

import hashlib
import random
import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from .models import CharacterSheet, StyleProfile

PRESETS: dict[str, StyleProfile] = {
    "korean_manhwa": StyleProfile(
        key="korean_manhwa", name="Korean Manhwa (semi-realistic)",
        description="Thin clean ink contours, elongated realistic proportions, almond eyes with lashes, soft painterly skin shading, strand-lined hair.",
        line_weight=1.5, shading="soft", contrast=1.0, saturation=0.9, halftone=0.0, glow=0.10, rim_light=0.18, bg_depth=0.6,
        figure="semi"),
    "webtoon_digital": StyleProfile(
        key="webtoon_digital", name="Modern Digital Webtoon",
        description="Clean digital line-art, soft gradient shading, bright readable colour.",
        line_weight=1.8, shading="soft", contrast=1.05, saturation=1.05, halftone=0.0, glow=0.10, rim_light=0.15, bg_depth=0.2, figure="semi"),
    "cinematic_3d": StyleProfile(
        key="cinematic_3d", name="Cinematic 3D-Blended",
        description="Depth-of-field backgrounds, volumetric light, fine line-work blended into painterly depth.",
        line_weight=1.3, shading="depth", contrast=1.2, saturation=0.95, halftone=0.0, glow=0.25, rim_light=0.30, bg_depth=1.0, figure="semi"),
    "cel_shaded": StyleProfile(
        key="cel_shaded", name="Stylized Cel-Shading",
        description="Heavy ink outlines, hard two-tone shadows and screentone.",
        line_weight=2.6, shading="cel", contrast=1.12, saturation=1.12, halftone=0.8, glow=0.0, rim_light=0.10, bg_depth=0.0, figure="semi"),
    "fantasy_action": StyleProfile(
        key="fantasy_action", name="Fantasy / Action Rendering",
        description="Saturated colour, bloom, embers and speed lines, aggressive rim lighting.",
        line_weight=2.0, shading="cel", contrast=1.2, saturation=1.3, halftone=0.2, glow=0.6, rim_light=0.40, bg_depth=0.3,
        palette_bias=(120, 70, 190), figure="semi"),
    "flat_vector": StyleProfile(
        key="flat_vector", name="Flat Vector Anime (legacy look)",
        description="Chunky flat-colour anime figures with heavy outlines. Only used when requested explicitly.",
        line_weight=2.6, shading="soft", contrast=1.05, saturation=1.05, halftone=0.0, glow=0.10, rim_light=0.15, bg_depth=0.2, figure="stylized"),
}

_STYLE_KEYWORDS = {
    "korean_manhwa": ("romance", "drama", "office", "school", "love", "cafe", "café", "family", "slice of life", "korean", "webtoon", "manhwa", "realistic"),
    "cinematic_3d": ("cinematic", "realistic", "film", "3d", "depth", "moody", "noir", "atmospheric", "city", "neon", "rain"),
    "cel_shaded": ("cel", "ink", "retro", "90s", "gritty", "manga", "black and white", "screentone", "yakuza", "thriller"),
    "fantasy_action": ("fantasy", "magic", "sword", "dragon", "battle", "fight", "hunter", "dungeon", "spell", "demon",
                       "monster", "kingdom", "mage", "knight", "power", "awaken", "war", "blade", "slash"),
    "webtoon_digital": ("comedy", "friend", "campus", "daily", "chibi", "cute"),
}


@dataclass
class ReferenceInfo:
    name: str
    palette: list[tuple[int, int, int]]
    saturation: float
    contrast: float
    edge_density: float
    focus_x: float            # ink / dark mass centroid, 0..1
    focus_y: float
    width: int
    height: int


def analyze_image(path: Path) -> ReferenceInfo:
    """Statistics of a user sketch / reference image that steer style, palette and composition."""
    img = Image.open(path)
    img.load()
    if img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        rgba = img.convert("RGBA")
        bg.paste(rgba, mask=rgba.getchannel("A"))
        img = bg
    img = img.convert("RGB")
    w, h = img.size
    img.thumbnail((256, 256))
    arr = np.asarray(img, dtype=np.float32) / 255.0
    lum = arr @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    mx, mn = arr.max(axis=2), arr.min(axis=2)
    sat = float(np.mean(np.where(mx > 0.05, (mx - mn) / np.maximum(mx, 1e-3), 0)))
    contrast = float(np.percentile(lum, 95) - np.percentile(lum, 5))
    gray = img.convert("L").filter(ImageFilter.FIND_EDGES)
    edge = float(np.mean(np.asarray(gray, dtype=np.float32) > 40))
    ink = np.clip((np.median(lum) - lum) * 2.0, 0, 1) if np.median(lum) > 0.5 else np.clip(lum - np.median(lum), 0, 1)
    tot = float(ink.sum())
    if tot > 1e-3:
        ys, xs = np.mgrid[0:lum.shape[0], 0:lum.shape[1]]
        fx = float((ink * xs).sum() / tot) / lum.shape[1]
        fy = float((ink * ys).sum() / tot) / lum.shape[0]
    else:
        fx = fy = 0.5
    q = img.quantize(colors=5, method=Image.Quantize.MEDIANCUT).convert("RGB")
    cols = sorted(q.getcolors(65536) or [], reverse=True)
    palette = [c for _, c in cols[:5]]
    return ReferenceInfo(path.name, palette, sat, contrast, edge, fx, fy, w, h)


def choose_style(request: str, text: str, refs: list[ReferenceInfo]) -> StyleProfile:
    """Map the request + story + reference statistics to a style preset (with reasons)."""
    if request and request != "auto" and request in PRESETS:
        s = PRESETS[request].model_copy(deep=True)
        s.reasons = [f"style requested explicitly: {s.name}"]
        return _bias_from_refs(s, refs)
    scores = {k: 0.0 for k in PRESETS if k != "flat_vector"}
    scores["korean_manhwa"] = 1.0           # the house look: wins unless the story or references clearly ask for something else
    reasons: dict[str, list[str]] = {k: [] for k in PRESETS}
    low = text.lower()
    for key, words in _STYLE_KEYWORDS.items():
        hits = [w for w in words if re.search(r"\b" + re.escape(w), low)]
        if hits:
            scores[key] += len(hits) * (0.6 if key == "korean_manhwa" else 1.0)
            reasons[key].append("story keywords: " + ", ".join(hits[:5]))
    if refs:
        sat = float(np.mean([r.saturation for r in refs]))
        edge = float(np.mean([r.edge_density for r in refs]))
        con = float(np.mean([r.contrast for r in refs]))
        if sat < 0.30 and edge < 0.35:
            # clean thin line-art / soft painted portraits on light paper: the Korean manhwa look
            scores["korean_manhwa"] += 3.0
            reasons["korean_manhwa"].append(f"references are clean line-art / soft-shaded portraits (sat {sat:.2f}, edges {edge:.2f})")
        if sat < 0.08 and edge > 0.35:
            scores["cel_shaded"] += 2.5
            reasons["cel_shaded"].append(f"references are low-colour, very line-heavy (sat {sat:.2f}, edges {edge:.2f})")
        if sat > 0.45:
            scores["fantasy_action"] += 2.0
            reasons["fantasy_action"].append(f"references are highly saturated ({sat:.2f})")
        if con > 0.7 and edge < 0.08:
            scores["cinematic_3d"] += 2.0
            reasons["cinematic_3d"].append(f"references have wide tonal range and soft edges (contrast {con:.2f})")
    best = max(scores, key=lambda k: (scores[k], k == "korean_manhwa"))
    s = PRESETS[best].model_copy(deep=True)
    s.reasons = reasons[best] or ["no strong signal in the input: using the house Korean-manhwa look"]
    return _bias_from_refs(s, refs)


def _bias_from_refs(s: StyleProfile, refs: list[ReferenceInfo]) -> StyleProfile:
    if refs:
        cols = [c for r in refs for c in r.palette[:5] if max(c) - min(c) > 28 and max(c) < 245]
        if cols:
            avg = tuple(int(np.mean([c[i] for c in cols])) for i in range(3))
            s.palette_bias = avg  # type: ignore[assignment]
            s.reasons.append(f"palette biased toward reference colours {avg}")
    return s


# --------------------------------------------------------------------------- characters
_HAIR = {"black": (24, 22, 30), "charcoal": (58, 60, 68), "dark grey": (70, 72, 80), "dark gray": (70, 72, 80), "brown": (92, 60, 40), "blonde": (232, 196, 100), "golden": (232, 196, 100), "yellow": (232, 196, 100),
         "silver": (200, 204, 216), "white": (236, 236, 244), "grey": (150, 152, 164), "gray": (150, 152, 164),
         "red": (176, 44, 52), "crimson": (160, 30, 50), "orange": (230, 120, 50), "blue": (60, 100, 200), "navy": (30, 44, 100),
         "purple": (110, 64, 170), "violet": (130, 80, 190), "pink": (236, 130, 170), "green": (60, 150, 90), "teal": (40, 150, 150)}
_EYES = {"black": (30, 28, 40), "brown": (120, 70, 40), "amber": (220, 150, 40), "golden": (230, 180, 50), "gold": (230, 180, 50),
         "blue": (70, 130, 230), "green": (60, 170, 100), "emerald": (40, 170, 110), "red": (210, 50, 60), "crimson": (190, 30, 50),
         "violet": (140, 90, 210), "purple": (130, 80, 200), "grey": (150, 160, 175), "gray": (150, 160, 175), "silver": (190, 200, 215),
         "teal": (50, 170, 170), "hazel": (150, 110, 50)}
_SKIN = {"pale": (248, 226, 212), "fair": (244, 214, 190), "light": (244, 214, 190), "tan": (214, 164, 120), "tanned": (214, 164, 120),
         "olive": (200, 166, 124), "dark": (140, 94, 66), "brown-skinned": (160, 110, 78), "porcelain": (250, 232, 222)}
_OUTFIT_COLORS = {"black": (34, 34, 48), "white": (232, 232, 240), "red": (176, 44, 52), "crimson": (150, 28, 48), "blue": (50, 92, 176),
                  "navy": (30, 44, 100), "green": (50, 120, 80), "grey": (112, 116, 130), "gray": (112, 116, 130), "brown": (110, 76, 52),
                  "purple": (100, 60, 150), "gold": (200, 160, 60), "golden": (200, 160, 60), "silver": (176, 182, 196), "orange": (210, 110, 50),
                  "pink": (220, 120, 160), "teal": (40, 130, 130), "yellow": (220, 190, 70), "cream": (230, 218, 190)}
_OUTFIT_WORDS = {"uniform": "uniform", "school": "uniform", "blazer": "uniform", "coat": "coat", "trench": "coat", "cloak": "coat", "cape": "coat",
                 "armor": "armor", "armour": "armor", "knight": "armor", "plate": "armor", "robe": "robe", "kimono": "robe", "hanbok": "robe",
                 "mage": "robe", "wizard": "robe", "shirt": "shirt", "collared": "shirt", "blouse": "shirt", "suit": "shirt", "hoodie": "casual", "jacket": "casual", "tee": "casual", "sweater": "casual"}
_HAIR_STYLE = {"spiky": "spiky", "messy": "spiky", "long": "long", "ponytail": "ponytail", "tail": "ponytail", "bob": "bob", "bun": "bun",
               "short": "short", "cropped": "short", "braid": "long", "flowing": "long"}
_ACCENTS = [(214, 60, 70), (240, 190, 60), (70, 170, 220), (160, 90, 220), (60, 190, 130), (235, 120, 60)]


def stable_seed(*parts: object) -> int:
    h = hashlib.sha256("|".join(str(p) for p in parts).encode()).hexdigest()
    return int(h[:12], 16)


def design_character(name: str, description: str, series_key: str, style: StyleProfile) -> CharacterSheet:
    """Deterministic character design: same (series, name, description) always yields the same sheet."""
    seed = stable_seed("char", series_key, name.lower())
    rng = random.Random(seed)
    d = description.lower()
    traits: list[str] = []

    def find(table: dict, near: str | None = None):
        # prefer "<colour> hair", "<colour> eyes", "<colour> skin" patterns
        for k in table:
            if near and re.search(rf"\b{k}[- ]?(?:coloured|colored)?\s+{near}", d):
                return k
        return None

    hair_k = find(_HAIR, "hair") or find(_HAIR, "haired") or (next((k for k in _HAIR if re.search(rf"\b{k}[- ]haired", d)), None))
    eye_k = find(_EYES, "eyes") or find(_EYES, "eyed") or (next((k for k in _EYES if re.search(rf"\b{k}[- ]eyed", d)), None))
    skin_k = next((k for k in _SKIN if re.search(rf"\b{k}\b", d)), None)
    hair = _HAIR[hair_k] if hair_k else rng.choice(list(_HAIR.values())[:12])
    eye = _EYES[eye_k] if eye_k else rng.choice(list(_EYES.values()))
    skin = _SKIN[skin_k] if skin_k else rng.choice([_SKIN["fair"], _SKIN["pale"], _SKIN["tan"], _SKIN["olive"], _SKIN["fair"]])
    if hair_k:
        traits.append(f"{hair_k} hair")
    if eye_k:
        traits.append(f"{eye_k} eyes")
    hair_style = next((v for k, v in _HAIR_STYLE.items() if re.search(rf"\b{k}", d)), None) or rng.choice(["short", "spiky", "long", "bob", "short", "ponytail"])
    traits.append(f"{hair_style} hair style")
    outfit_style = next((v for k, v in _OUTFIT_WORDS.items() if re.search(rf"\b{k}", d)), None) or rng.choice(["casual", "uniform", "coat", "casual"])
    outfit_color = None
    user_specified = False
    for k, c in _OUTFIT_COLORS.items():
        if re.search(rf"\b{k}\b[\w\s,-]{{0,18}}(?:{'|'.join(_OUTFIT_WORDS)})", d):
            outfit_color = c
            user_specified = True
            traits.append(f"{k} {outfit_style}")
            break
    if outfit_color is None:
        outfit_color = rng.choice(list(_OUTFIT_COLORS.values()))
        traits.append(f"{outfit_style} outfit")
    # an invented outfit colour must stay distinguishable from the hair; a described one is kept as written
    if not user_specified and sum(abs(outfit_color[i] - hair[i]) for i in range(3)) < 90:
        outfit_color = _OUTFIT_COLORS["navy"] if sum(hair) > 380 else _OUTFIT_COLORS["cream"]
    build = "slim" if re.search(r"slim|slender|lean|thin|petite|lithe", d) else "broad" if re.search(r"muscular|broad|burly|strong|imposing|hulking", d) else "average"
    head_units = 7.0
    if re.search(r"\btall\b|towering|statuesque", d):
        head_units = 7.8
    elif re.search(r"child|kid|little|young boy|young girl|small|short stature", d):
        head_units = 6.0
    elif rng.random() < 0.4:
        head_units = 7.3
    eye_shape = "sharp" if re.search(r"sharp|cold|piercing|stern|fierce|cunning", d) else "round" if re.search(r"round|bright|cheerful|innocent|big-eyed|energetic", d) else rng.choice(["round", "soft", "sharp"])
    accent = rng.choice(_ACCENTS)
    from .render.util import mix as _mix, shade as _shade
    female = len(re.findall(r"\b(girl|woman|female|lady|she|her|princess|queen|witch|actress|heroine|mother|sister|schoolgirl)\b", d))
    male = len(re.findall(r"\b(boy|man|male|guy|he|his|him|prince|king|knight|hero|father|brother|schoolboy|gentleman)\b", d))
    gender = "female" if female > male else "male" if male > female else "neutral"
    accessory = "glasses" if re.search(r"\b(glasses|spectacles|bespectacled)\b", d) else ""
    if accessory:
        traits.append("glasses")
    if style.figure == "semi":
        # the semi-realistic look: paler, softer skin and slightly muted hair/eye colour; taller, narrower figures
        if not skin_k:
            skin = _mix(skin, (250, 236, 228), 0.55)
        hair = _mix(hair, (92, 94, 102), 0.18) if not hair_k else hair
        head_units = max(head_units, 7.5) if head_units >= 7.0 and head_units != 6.0 else head_units
        eye_shape = "soft" if gender == "female" and eye_shape == "round" else eye_shape
    return CharacterSheet(
        name=name, description=description, seed=seed, skin=skin, hair=hair, hair_shade=_shade(hair, 0.62), eye=eye,
        outfit=outfit_color, outfit_shade=_shade(outfit_color, 0.7), accent=accent, hair_style=hair_style,
        outfit_style=outfit_style, head_units=head_units, build=build, eye_shape=eye_shape, gender=gender, accessory=accessory, traits=traits)
