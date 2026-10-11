"""Global look switch. Every style except 'noir' is built on the webtoon base (pastel flesh, detailed eyes, fine hair strands, thin line
art) and then changes the shading constants (STAGE) and/or runs a whole-panel post look (`looks.py`).

  webtoon    clean line art + soft two-tone cel shading, rosy shadows, high-key colour (the series anchor; default)
  noir       the earlier dark sepia gradient-map treatment
  inkwash    sumi-e / ink-wash manhua: brush-black on rice paper, grey washes, one red seal accent
  comic      western comic: heavy black inks, posterised flats, halftone shadows
  watercolor soft pigment washes, wet edges, paper grain, faint pencil line
  riso       two-ink risograph print: misregistered colour plates, grain, paper
  dream      shoujo pastel: glowing high-key, rosy bloom, sparkles, delicate lines
  pixel      16-colour pixel art
  neon       cyber night: teal/magenta gradient map, glow, scanlines
"""
import os

STYLE = os.environ.get("SF_STYLE", "webtoon")
WEB = STYLE != "noir"

_DEFAULT = dict(ambient=0.46, ambient_gain=0.5, key_mix=0.45, shadow=(0.80, 0.67, 0.76), steps=(0.0, 0.0, 1.0, 1.0), rim=0.45,
                ink=0.78, scratch=0.06, ink_scale=0.8, silhouette=1.9, line=(0.17, 0.11, 0.12), brush=0.25, grain=0.3, grade=True)
_OVR = {
    "webtoon": {},
    "noir": {},
    "inkwash": dict(ambient=0.50, shadow=(0.74, 0.74, 0.76), ink=0.95, scratch=0.45, ink_scale=1.0, silhouette=2.6, line=(0.05, 0.05, 0.06), brush=0.8),
    "comic": dict(ambient=0.36, shadow=(0.58, 0.52, 0.72), ink=1.0, scratch=0.04, ink_scale=1.25, silhouette=3.0, line=(0.03, 0.02, 0.04), rim=0.3),
    "watercolor": dict(ambient=0.55, shadow=(0.82, 0.76, 0.86), steps=(0.0, 0.25, 0.85, 1.0), ink=0.45, scratch=0.5, ink_scale=0.65,
                       silhouette=1.4, line=(0.30, 0.22, 0.22), brush=1.0, grain=0.6),
    "riso": dict(ambient=0.42, shadow=(0.70, 0.62, 0.74), ink=0.9, scratch=0.2, ink_scale=1.0, silhouette=2.4, line=(0.06, 0.05, 0.09)),
    "dream": dict(ambient=0.62, shadow=(0.88, 0.76, 0.86), ink=0.5, scratch=0.02, ink_scale=0.6, silhouette=1.3, line=(0.42, 0.26, 0.32), rim=0.7),
    "pixel": dict(ambient=0.44, ink=0.85, ink_scale=0.9, line=(0.08, 0.07, 0.1), grade=True),
    "neon": dict(ambient=0.34, shadow=(0.55, 0.45, 0.8), ink=0.7, ink_scale=0.8, line=(0.05, 0.03, 0.12), rim=1.1),
}
STAGE = {**_DEFAULT, **_OVR.get(STYLE, {})}
LINE = STAGE["line"]               # line-art colour (webtoon: a dark warm brown, softer than pure black)
