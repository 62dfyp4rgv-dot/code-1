"""Input package: story text + sketches + reference files, validated and read from disk."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image

from . import config
from .styles import ReferenceInfo, analyze_image

Image.MAX_IMAGE_PIXELS = 60_000_000


@dataclass
class InputPackage:
    title: str = ""
    text: str = ""
    sketches: list[ReferenceInfo] = field(default_factory=list)
    sketch_paths: list[Path] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)       # what was read / skipped, for the log
    files: list[dict] = field(default_factory=list)


def safe_filename(name: str) -> str:
    base = Path(name.replace("\\", "/")).name
    base = re.sub(r"[^A-Za-z0-9._ -]+", "_", base).strip(" .") or "file"
    return base[:96]


def ingest(story: str, title: str, input_dir: Path) -> InputPackage:
    """Read the saved uploads in `input_dir` (already size-checked by the API layer)."""
    pkg = InputPackage(title=title.strip(), text=story.strip())
    texts: list[str] = [pkg.text] if pkg.text else []
    for path in sorted(input_dir.glob("*")) if input_dir.exists() else []:
        ext = path.suffix.lower()
        info = {"name": path.name, "bytes": path.stat().st_size, "kind": "other"}
        try:
            if ext in config.TEXT_EXTS:
                raw = path.read_text(encoding="utf-8", errors="replace")
                if ext == ".json":
                    raw = _json_to_text(raw, pkg)
                texts.append(raw.strip())
                info["kind"] = "text"
                pkg.notes.append(f"read script file {path.name} ({len(raw)} chars)")
            elif ext in config.IMAGE_EXTS:
                ref = analyze_image(path)
                pkg.sketches.append(ref)
                pkg.sketch_paths.append(path)
                info["kind"] = "sketch"
                pkg.notes.append(f"analysed sketch {path.name}: {ref.width}x{ref.height}, saturation {ref.saturation:.2f}, "
                                 f"edge density {ref.edge_density:.2f}, focus x {ref.focus_x:.2f}")
            else:
                pkg.notes.append(f"stored {path.name} as an attachment (unsupported type, not analysed)")
        except Exception as e:   # one bad file must not sink the job
            pkg.notes.append(f"could not read {path.name}: {type(e).__name__}: {e}")
            info["kind"] = "unreadable"
        pkg.files.append(info)
    pkg.text = "\n\n".join(t for t in texts if t)
    return pkg


def _json_to_text(raw: str, pkg: InputPackage) -> str:
    """Accept {"title","story"/"text","characters":[{name,description}]} or any JSON (dumped as text)."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return raw
    if isinstance(data, dict):
        if not pkg.title and isinstance(data.get("title"), str):
            pkg.title = data["title"]
        body = data.get("story") or data.get("text") or data.get("script") or ""
        chars = data.get("characters")
        block = ""
        if isinstance(chars, list):
            lines = []
            for c in chars:
                if isinstance(c, dict) and c.get("name"):
                    lines.append(f"- {c['name']}: {c.get('description', '')}")
            if lines:
                block = "Characters:\n" + "\n".join(lines) + "\n\n"
        if isinstance(body, list):
            body = "\n\n".join(str(b) for b in body)
        if body or block:
            return block + str(body)
    return json.dumps(data, indent=2, ensure_ascii=False)
