# ManhwaForge Studio

Autonomous, multi-agent generator that turns a story description (plus optional sketches and script files)
into a vertical-scroll **manhwa/webtoon chapter** or a **16:9 slide deck**. Submit once; no approval prompts;
it runs to **95%**, hard-saves a downloadable package and **halts until you tell it what to do**.

```
pip install -r requirements.txt
uvicorn forge.app:app --port 8000      # then open http://localhost:8000
pytest                                  # 60 tests, ~2 min
```

## What it is, honestly

The pipeline, quality gate, consistency system, lettering, layout, reader, API and dashboard are real and tested.
The **art** is produced by a bundled *procedural painter* (Pillow + numpy), not an image model. It targets
**semi-realistic Korean manhwa** and is built to read as a drawing rather than as vector shapes:

* **Painted, not assembled**: each material (skin, hair, cloth) is shaded as a *volume* from its own silhouette, with cast
  shadows (hair on the forehead, chin on the neck), a hair sheen, hand-painted face modelling (eye sockets, cheek hollow,
  nose/lip shadows, highlights), soft brush marks along the form in the shadows, and paper / watercolour grain.
* **Pen lines, not outlines**: strokes with pressure, flowing wobble, tapered ends, heavier on the shadow side; in loose
  styles they overshoot, double up, and hair sheds curly flyaway strands.
* **Anatomy**: tapered limbs, hands with fingers, almond eyes with gradient irises and lash lines, heads tilted off-axis.
* Backgrounds get a painted wash (soft edges, colour drift, brush streaks) instead of hard vector blocks.

It is deterministic and runs fully offline, but it is **still procedural**: faces and hair are the strong part, full-body
poses are stiff, and it will not match a hand-painted reference's finish. A **looseness** dial (0 clean pen-and-ink ... 1 raw
sketch-paint) ties these behaviours together; styles set it (`korean_manhwa` 0.3, `sketch_painterly` 0.9).
For model-quality art, plug a hosted image model in behind the `ImageProvider` interface (see below). Everything
else (Director, Critic, Typesetter, Assembler, 95% rule, UI) works unchanged.

## The four agents

| Agent | Code | What it does |
|---|---|---|
| **1 Director** | `forge/agents/director.py` | Ingests description / script / sketches. Writes the panel-by-panel JSON script: shot, angle, location, time, weather, lighting, mood, characters + expressions + poses, dialogue (speech / thought / shout / whisper / caption), SFX, pacing. **LLM mode** (set `ANTHROPIC_API_KEY`; JSON-validated, falls back on any failure) or the built-in **heuristic parser** (character extraction, quote-aware dialogue attribution, setting/mood/action from prose, panel-budget fitting, reaction cut-ins). |
| **2 Artist** | `forge/agents/artist.py`, `forge/styles.py`, `forge/render/` | Analyses sketches (palette, saturation, edge density, composition centroid) and maps input to a style: **Korean manhwa (default)**, **sketch-painterly** (loose ink + brush shading, muted palette), *modern digital webtoon*, *cinematic 3D-blended*, *stylised cel-shading*, *fantasy/action* (all share the semi-realistic figure and differ in line weight, lighting, screentone and FX); `flat_vector` is the old chunky anime look, only on request. Reference images steer auto-detection: clean line-art / soft portraits -> Korean manhwa; stark, muted, ink-heavy sketch-paintings -> sketch-painterly. (Pinterest could not be browsed from the build sandbox; add your own references through the sketch drop-zone and they are analysed directly.) Keeps a **persistent character bank** (sheet + reference image per character, reused across panels *and* across chapters of a `series`). Generates each panel, sends it to the Critic and **re-prompts/refines until it clears the gate**. |
| **3 Typesetter + Assembler** | `typesetter.py`, `assembler.py`, `packaging.py` | Collision-aware speech/thought/shout/whisper bubbles with tails, caption boxes, SFX typography (never drops text: grows a caption band if a panel is full). Stitches an 800px vertical strip with pacing-driven gutters and inset panels (or a slide deck + PDF), and builds a standalone reader. |
| **4 Critic** | `forge/agents/critic.py` | Scores every panel 0-10 (**Amazement Score**, gate **7.5**) from the actual pixels: *anatomy/identity consistency* (framing, occlusion, colours vs the character sheet), *lighting drama* (range, direction, key/fill, subject separation), *line quality* (crispness, closed contours, noise). Also owns the confidence metric. |

The Critic is an image-statistics heuristic, not a learned taste model: reliable at catching flat lighting, soft
lines, crushed shadows and character-colour drift; it cannot judge taste. A vision-model critic can be swapped in
behind `Critic.score`.

### Critique -> refine loop
Per panel: render, score, and if < 7.5 the Artist applies a **diagnostic, escalating** refinement chosen from what the
Critic measured (crushed shadows vs flat range vs missing highlights -> light pool / contrast / rim light; soft lines ->
ink weight / sharpen; colour drift -> palette lock; overlapping faces -> re-staging), hill-climbing from the best
attempt so far. A cap (`MANHWAFORGE_MAX_ATTEMPTS`, default 8) exists only to prevent infinite loops; a panel that still
misses the gate ships at its best score and is **flagged** in the UI and summary, never hidden.

## The 95% rule

Progress is an exact-fraction weighted sum: director 10 + style 5 + art 40 + lettering 20 + layout 20 = **95**, polish = 5.
The instant progress **or** confidence (completion x quality, so it can never lead progress) reaches 95%:

1. `ProgressTracker.advance()` raises `HaltSignal`; workers stop at their next checkpoint.
2. **Hard save**: `<title>-chapter.zip` (reader, `strip.jpg` / slides + PDF, every panel, character sheets, `script.json`,
   `layout.json`), plus `completion_summary.md/.json` (scores, retries, flagged panels, log).
3. Status becomes `halted`. **Nothing else runs** (tested: no events, no threads, no state changes).

Only a manual instruction continues: `POST /api/jobs/{id}/resume` with `{"action":"finalize","instruction":"..."}` runs the final
5% (optimise, validate the package, rebuild summary and zip) -> 100%; `{"action":"cancel"}` stops there.
The dashboard has *Finalize last 5%* / *Stop here* buttons.

## API

| | |
|---|---|
| `POST /api/jobs` | multipart: `story`, `title`, `format` (webtoon\|slides), `style` (auto\|korean_manhwa\|sketch_painterly\|webtoon_digital\|cinematic_3d\|cel_shaded\|fantasy_action\|flat_vector), `panels` (4-40), `series`, `files[]` (txt/md/json scripts, png/jpg/webp/gif/bmp sketches) |
| `GET /api/jobs`, `GET /api/jobs/{id}`, `GET /api/jobs/{id}/events?since=n` | state, live progress, agent log |
| `POST /api/jobs/{id}/resume` | manual instruction after a halt (409 unless halted) |
| `GET /api/jobs/{id}/download` | the zip |
| `GET /api/jobs/{id}/files/output/reader/index.html` | the reader (also in the dashboard) |

A story or script file is required: sketches steer composition, palette and style but cannot replace the story.
PDF/DOCX are rejected with a clear message (not parsed).

## Configuration (env)

`MANHWAFORGE_DATA` (storage, default `./data`), `MANHWAFORGE_THRESHOLD` (7.5), `MANHWAFORGE_MAX_ATTEMPTS` (8),
`MANHWAFORGE_JOB_WORKERS` (2), `MANHWAFORGE_PANEL_WORKERS` (parallel panels per job), `ANTHROPIC_API_KEY` +
`MANHWAFORGE_LLM_MODEL` (LLM Director), `MANHWAFORGE_IMAGE_PROVIDER`.

## Using a real image model

Implement `ImageProvider.generate(spec, style, sheets, params, size, seed) -> RenderResult` in
`forge/agents/artist.py`, register it in `PROVIDERS`, and set `MANHWAFORGE_IMAGE_PROVIDER`. Send
`build_prompt(...)` plus each character's reference sheet (`data/series/<series>/characters/*.png`, with LoRA/embedding
IDs added to the stored `CharacterSheet`), and return `RenderResult.figures` (face/head boxes) so lettering and the
Critic keep working. The `params` the Critic's refinements adjust map naturally onto guidance/reference strength.

## Layout

```
forge/  app.py (API) orchestrator.py progress.py store.py ingest.py styles.py packaging.py models.py config.py
        agents/ director artist critic typesetter assembler     render/ background figures panel util
web/    dashboard (vanilla JS, no build step): drag-and-drop input, live monitor, panel grid, log, reader
tests/  progress, director (+LLM mock), critic/artist loop, typesetter, full pipeline + API
```

## Known limits
* Art is procedural (see above). Gender and glasses are read from the character description only (never guessed from names). Characters keep identity via the sheet, but skin tone can look darker under strong night tint.
* The heuristic Director is rule-based English prose parsing; unusual narration styles may mis-attribute speakers. Use the LLM Director or `NAME: line` scripts for precision.
* The LLM Director path is covered by mocked-transport tests only (no live API call was made in development).
* Jobs run in-process threads; a server restart marks in-flight jobs `interrupted` (halted/completed jobs survive).
* No auth or rate limiting: run it locally or behind your own gateway.
