"""Central configuration. Everything tunable lives here or in environment variables."""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = Path(os.environ.get("MANHWAFORGE_DATA", ROOT / "data")).resolve()
WEB_DIR = ROOT / "web"

# --- Quality gate (Agent 4) -------------------------------------------------
AMAZEMENT_THRESHOLD = float(os.environ.get("MANHWAFORGE_THRESHOLD", "7.5"))
# Hard ceiling on re-prompt rounds per panel. The Artist escalates its refinements
# every round, so the loop normally clears the gate well before this; the cap only
# exists so a pathological panel can never spin forever. A panel that still misses
# the gate is accepted at its best score and flagged in the summary, never hidden.
MAX_REFINE_ATTEMPTS = int(os.environ.get("MANHWAFORGE_MAX_ATTEMPTS", "8"))

# --- The 95% rule -----------------------------------------------------------
HALT_AT = 0.95

# --- Workers ----------------------------------------------------------------
JOB_WORKERS = int(os.environ.get("MANHWAFORGE_JOB_WORKERS", "2"))
PANEL_WORKERS = int(os.environ.get("MANHWAFORGE_PANEL_WORKERS", str(min(4, os.cpu_count() or 2))))

# --- Output geometry --------------------------------------------------------
STRIP_WIDTH = 800          # standard webtoon width
SLIDE_SIZE = (1280, 720)   # 16:9 "visual slide" format
SUPERSAMPLE = 2

# --- Upload limits ----------------------------------------------------------
MAX_FILE_BYTES = 15 * 1024 * 1024
MAX_TOTAL_BYTES = 60 * 1024 * 1024
MAX_FILES = 24
TEXT_EXTS = {".txt", ".md", ".markdown", ".json"}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}

# --- Optional LLM director --------------------------------------------------
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
LLM_MODEL = os.environ.get("MANHWAFORGE_LLM_MODEL", "claude-sonnet-5-5")
LLM_TIMEOUT = float(os.environ.get("MANHWAFORGE_LLM_TIMEOUT", "90"))

MAX_PANELS = 40
MIN_PANELS = 4
