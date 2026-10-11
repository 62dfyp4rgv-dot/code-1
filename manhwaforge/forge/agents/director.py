"""Agent 1: the Director & Orchestrator's brain. Turns raw input into a panel-by-panel JSON script.

Two engines behind one interface:

* LLM director  - used when ANTHROPIC_API_KEY is set. Asks the model for the script as strict JSON
  and validates it against the Script schema.
* Heuristic director - always available, fully offline. A rule-based story parser: it finds
  characters, splits dialogue from narration and attributes speakers, reads the setting, mood and
  action out of the prose, then plans coverage (establishing shot -> coverage -> reaction -> insert)
  and fits the beats to the requested panel count.

Any failure of the LLM path falls back to the heuristic director, and the job log says which ran.
"""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from collections import Counter
from dataclasses import dataclass, field
from typing import Callable, Optional

from .. import config
from ..ingest import InputPackage
from ..models import CharacterSpec, Dialogue, PanelCharacter, PanelSpec, Script
from ..render.background import classify_location
from ..render.figures import canonical_expression

# --------------------------------------------------------------------------- vocab
SPEECH_VERBS = ("said", "asked", "replied", "shouted", "whispered", "muttered", "yelled", "cried", "answered", "called", "murmured",
                "growled", "snapped", "sighed", "laughed", "screamed", "exclaimed", "added", "declared", "demanded", "told", "hissed",
                "stammered", "breathed", "roared", "pleaded", "begged", "continued", "warned")
SHOUT_VERBS = ("shouted", "yelled", "screamed", "roared", "exclaimed", "cried", "demanded", "snapped")
WHISPER_VERBS = ("whispered", "murmured", "muttered", "breathed", "hissed")
STOP_CAPS = set("""The A An He She It They We I You But And Then As When Suddenly Inside Outside In On At After Before Meanwhile Later
That This There His Her Their With Without Chapter Night Day Morning Evening Afternoon If So Yet Still Now Just Even Only Once While
For From To Of By Not No Yes Do Does Did What Why How Who Where Which Whoever Every Each All Some One Two Three Maybe Perhaps Somewhere
Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November
December Mr Mrs Ms Dr Sir Lord Lady Miss Unlike Because Although Though Until Since Under Over Behind Beyond Above Below Across Through
Beside Between Among Against Toward Towards During Despite Instead Rather Whatever Whenever Nobody Everyone Someone Anyone Nothing
Everything Something Anything Its Our My Your Me Him Us Them Let Like Please Thank Okay OK Oh Ah Hey Well Look Listen Wait Stop Go Come""".split())
COMMON_VERBS = set("""is was walked ran looked turned stood sat smiled nodded felt knew saw heard held opened closed took gave went came
stepped reached grabbed pulled pushed raised drew swung stared glared frowned grinned sighed paused froze fell rose
moved stopped began started wanted needed tried decided remembered noticed realized whispered shouted said asked
replied lunged charged struck fought attacked dodged blocked cast""".split())
KNOWN_PLACES = set("""Seoul Tokyo Busan Korea Japan Earth Paris London York Moon Sun Heaven Hell Kingdom Empire Academy Tower Guild Gate""".split())

EXPR_KEYS = ("smil", "laugh", "angr", "furious", "glare", "scowl", "sad", "cry", "wept", "tears", "shock", "surpris", "gasp", "stun", "fear",
             "terrif", "afraid", "exhaust", "smirk", "determin", "resolv", "blush", "shy", "tired", "worr", "anxious", "grin", "sneer")
POSE_RULES = [
    (("ran", "runs", "running", "sprint", "dash", "charge", "rushed", "fled", "chased"), "running"),
    (("fight", "attack", "lunge", "punch", "strike", "slash", "swung", "battle", "duel", "clash", "kick", "block", "dodge"), "fight"),
    (("point", "gestur"), "pointing"),
    (("arms crossed", "crossed his arms", "crossed her arms", "folded his arms", "folded her arms", "leaned against"), "crossed"),
    (("slump", "collaps", "knelt", "kneel", "fell to", "sank", "dropped to"), "slumped"),
]
MOODS = [
    ("action", ("fight", "attack", "charge", "slash", "explod", "battle", "clash", "chase", "ran", "sprint", "lunge", "strike", "burst", "roar")),
    ("dread", ("dread", "horror", "terror", "scream", "blood", "dark", "ominous", "monster", "nightmare", "corpse", "shadow")),
    ("tense", ("tense", "suddenly", "danger", "threat", "warn", "afraid", "fear", "trap", "silence", "hesitat", "nervous", "footsteps", "stare", "glare")),
    ("sad", ("sad", "cry", "wept", "tears", "grief", "loss", "lonely", "goodbye", "farewell", "funeral", "died", "alone", "mourn")),
    ("joyful", ("laugh", "smile", "happy", "joy", "cheer", "celebrat", "grin", "delight", "giggle", "fun", "party")),
    ("romantic", ("love", "kiss", "heart", "blush", "confess", "embrace", "hand in hand", "romance", "crush", "date")),
    ("mystery", ("mystery", "strange", "secret", "clue", "whisper", "unknown", "hidden", "puzzle", "curious")),
]
SFX_RULES = [
    (("explod", "explosion", "blast"), "BOOM!"), (("crash", "shatter", "smash"), "CRASH!"), (("slam",), "SLAM!"),
    (("punch", "punched", "hit him", "hit her"), "WHAM!"), (("slash", "sword", "blade", "sliced"), "SHING!"),
    (("thunder",), "RUMBLE"), (("footstep", "footsteps", "walked slowly", "approach"), "tap tap"), (("knock",), "knock knock"),
    (("door opened", "door creak", "creak"), "creeeak"), (("gunshot", "shot rang", "fired"), "BANG!"), (("heartbeat", "heart pounded", "heart raced"), "thump thump"),
    (("lightning",), "CRACK!"), (("splash",), "SPLASH"), (("magic", "spell", "glowed", "energy"), "FWOOM"), (("cheer", "applause"), "clap clap"),
    (("phone rang", "alarm"), "RIIING"), (("drip",), "drip"),
]
TIME_RULES = [("night", ("night", "midnight", "moonlit", "moon", "dark street", "after dark", "stars")), ("sunset", ("sunset", "dusk", "twilight", "evening", "golden hour")),
              ("dawn", ("dawn", "sunrise", "first light", "early morning", "daybreak")), ("day", ("day", "noon", "afternoon", "morning", "sunny", "daylight"))]
WEATHER_RULES = [("rain", ("rain", "storm", "downpour", "drizzle", "wet street")), ("snow", ("snow", "blizzard", "frost")), ("fog", ("fog", "mist", "haze"))]
DESC_WORDS = re.compile(r"\b(hair|eyes?|tall|short|slim|slender|muscular|wearing|wore|dressed|uniform|coat|cloak|armor|armour|robe|scar|pale|tanned|"
                        r"young|old|stern|cheerful|cold|quiet|loud|jacket|hoodie|blazer|ponytail|spiky|messy|silver|golden|crimson)\b", re.I)


@dataclass
class _Beat:
    narration: str = ""
    dialogue: list[Dialogue] = field(default_factory=list)
    names: list[str] = field(default_factory=list)
    raw: str = ""

    @property
    def text(self) -> str:
        return (self.raw or self.narration + " " + " ".join(d.text for d in self.dialogue)).strip()


def has(low: str, words) -> bool:
    """Word-start match (so 'star' does not fire on 'staring'); very short words must match whole."""
    for w in words:
        if re.search(rf"\b{re.escape(w)}\b" if len(w) <= 3 else rf"\b{re.escape(w)}", low):
            return True
    return False


# --------------------------------------------------------------------------- heuristic director
class HeuristicDirector:
    name = "heuristic"

    def plan(self, pkg: InputPackage, target: int) -> Script:
        text = pkg.text.replace("\r\n", "\n").replace("\r", "\n")
        title, text = self._title(pkg, text)
        char_desc, text = self._character_block(text)
        text = text.strip()
        sentences = self._sentences(text)
        names = self._find_names(text, sentences, set(char_desc))
        for n in char_desc:
            if n not in names:
                names.insert(0, n)
        if not names:
            guess = self._guess_protagonist(text)
            if guess:
                names = [guess]
        beats = self._beats(sentences, names)
        beats = self._fit(beats, target, names)
        descs = self._describe(names, char_desc, sentences)
        panels = self._panels(beats, names, pkg)
        panels = self._pad_with_reactions(panels, target)
        panels = self._enforce_limits(panels)
        for i, p in enumerate(panels):
            p.index = i
        self._attach_sketches(panels, pkg)
        logline = (sentences[0] if sentences else "")[:200]
        return Script(title=title, logline=logline, characters=[CharacterSpec(name=n, description=descs.get(n, "")) for n in names],
                      panels=panels[:config.MAX_PANELS], source="heuristic")

    # ------------------------------------------------------------ text structure
    @staticmethod
    def _title(pkg: InputPackage, text: str) -> tuple[str, str]:
        title = pkg.title
        lines = text.split("\n")
        for i, l in enumerate(lines[:4]):
            m = re.match(r"^\s*(?:#+\s*|title\s*:\s*)(.+?)\s*$", l, re.I)
            if m:
                if not title:
                    title = m.group(1)
                lines.pop(i)
                break
        text = "\n".join(lines)
        if not title:
            first = re.split(r"[.!?\n]", text.strip(), maxsplit=1)[0]
            title = " ".join(first.split()[:6]).strip(" ,;:\"'") or "Untitled Chapter"
        return title, text

    @staticmethod
    def _character_block(text: str) -> tuple[dict[str, str], str]:
        """Parse an optional 'Characters:' section ('- Name: description' / 'Name - description')."""
        out: dict[str, str] = {}
        lines = text.split("\n")
        keep: list[str] = []
        i = 0
        while i < len(lines):
            if re.match(r"^\s*#*\s*(characters?|cast|dramatis personae)\s*:?\s*$", lines[i], re.I):
                i += 1
                while i < len(lines) and lines[i].strip():
                    m = re.match(r"^\s*[-*•]?\s*([A-Z][\w' .-]{0,30}?)\s*(?:[:\-–—]|\()\s*(.+?)\)?\s*$", lines[i])
                    if m:
                        out[m.group(1).strip()] = m.group(2).strip()
                    i += 1
                continue
            keep.append(lines[i])
            i += 1
        return out, "\n".join(keep)

    @staticmethod
    def _sentences(text: str) -> list[str]:
        out: list[str] = []
        attrib = re.compile(r"^(?:[A-Z][a-z']+|he|she|they|I)\s+(?:" + "|".join(SPEECH_VERBS) + r")\b", re.I)
        for para in re.split(r"\n\s*\n|\n(?=\s*[A-Z][A-Za-z' ]{0,24}\s*:)", text):
            para = " ".join(para.split())
            if not para:
                continue
            parts: list[str] = []
            start, in_q = 0, False
            i = 0
            while i < len(para):
                ch = para[i]
                if ch in "\"“”":
                    in_q = (ch != "”") if ch != '"' else not in_q
                    if ch == "“":
                        in_q = True
                    elif ch == "”":
                        in_q = False
                if ch in ".!?…" and not in_q:
                    j = i + 1
                    while j < len(para) and para[j] in ".!?…\"”’)":
                        j += 1
                    if j >= len(para) or (para[j] == " " and j + 1 < len(para) and (para[j + 1].isupper() or para[j + 1] in "\"“‘'([*_")):
                        parts.append(para[start:j].strip())
                        start = j
                        i = j
                        continue
                elif ch in ".!?…" and in_q:
                    pass
                i += 1
            if para[start:].strip():
                parts.append(para[start:].strip())
            merged: list[str] = []
            for part in parts:
                # '"Hi!" Mira said.' -> keep the attribution with its quote
                if merged and merged[-1].rstrip().endswith(('"', "”", '!"', '?"')) and attrib.match(part):
                    merged[-1] += " " + part
                else:
                    merged.append(part)
            out.extend(merged)
        return out

    # ------------------------------------------------------------ names
    @staticmethod
    def _find_names(text: str, sentences: list[str], declared: set[str]) -> list[str]:
        score: Counter[str] = Counter()
        for n in declared:
            score[n] += 10
        for m in re.finditer(r"^\s*([A-Z][A-Za-z']{1,20})\s*:\s*\S", text, re.M):        # NAME: dialogue
            if m.group(1) not in STOP_CAPS and m.group(1).lower() not in ("title", "characters", "setting", "scene", "note"):
                score[m.group(1)] += 4
        sv = "|".join(SPEECH_VERBS)
        for m in re.finditer(rf"\b([A-Z][a-z']{{1,20}})\s+(?:{sv})\b", text):
            if m.group(1) not in STOP_CAPS:
                score[m.group(1)] += 3
        for m in re.finditer(rf"\b(?:{sv})\s+([A-Z][a-z']{{1,20}})\b", text):
            if m.group(1) not in STOP_CAPS:
                score[m.group(1)] += 2
        for s in sentences:
            for m in re.finditer(r"(?<![.!?]\s)(?<!^)\b([A-Z][a-z']{2,20})\b(?:'s)?(?:\s+([a-z]+))?", s):
                w, nxt = m.group(1), (m.group(2) or "")
                if w in STOP_CAPS or w in KNOWN_PLACES:
                    continue
                score[w] += 1
                if nxt in COMMON_VERBS or nxt.endswith("ed"):
                    score[w] += 2
            fm = re.match(r"([A-Z][a-z']{2,20})\s+([a-z]+)", s)       # sentence-initial: only counts if followed by a verb
            if fm and fm.group(1) not in STOP_CAPS and (fm.group(2) in COMMON_VERBS or fm.group(2).endswith("ed") or fm.group(2) in SPEECH_VERBS):
                score[fm.group(1)] += 2
        names = [n for n, sc in score.most_common() if sc >= 3 and n not in KNOWN_PLACES][:5]
        # keep declared order first
        names.sort(key=lambda n: (n not in declared, -score[n]))
        return names

    @staticmethod
    def _guess_protagonist(text: str) -> str:
        m = re.search(r"\b(?:a|an|the)\s+(?:[a-z]+\s+){0,2}(girl|boy|man|woman|knight|hunter|swordsman|mage|witch|student|child|warrior|prince|princess|"
                      r"detective|thief|assassin|king|queen|stranger|soldier|monk|samurai)\b", text, re.I)
        return m.group(1).title() if m else ""

    # ------------------------------------------------------------ beats
    def _beats(self, sentences: list[str], names: list[str]) -> list[_Beat]:
        beats: list[_Beat] = []
        last_speaker: Optional[str] = None
        recent: list[str] = []
        for s in sentences:
            b = _Beat(raw=s)
            m = re.match(r"^([A-Z][A-Za-z']{1,20})\s*:\s*(.+)$", s)
            if m and (m.group(1) in names or m.group(1).lower() not in ("note", "scene", "setting", "title")):
                spk = m.group(1)
                if spk not in names and spk not in STOP_CAPS:
                    names.append(spk)
                kind = self._kind(m.group(2), "")
                b.dialogue.append(Dialogue(speaker=spk, text=m.group(2).strip().strip('"“”'), kind=kind))
                b.names = [spk]
                last_speaker = spk
            else:
                quotes = list(re.finditer(r"[\"“]([^\"”]+)[\"”]", s))
                outside = re.sub(r"[\"“][^\"”]+[\"”]", " ", s)
                nm = [n for n in names if re.search(rf"\b{re.escape(n)}\b", s)]
                if quotes:
                    for q in quotes:
                        before = s[:q.start()]
                        after = s[q.end():]
                        spk = self._speaker(before, after, names, last_speaker, recent)
                        verb = self._verb(before + " " + after)
                        txt = q.group(1).strip().rstrip(",;")
                        if q.group(1).strip().endswith(","):
                            txt += "."
                        if not txt:
                            continue
                        b.dialogue.append(Dialogue(speaker=spk, text=txt, kind=self._kind(txt, verb)))
                        if spk:
                            last_speaker = spk
                            if spk not in nm:
                                nm.append(spk)
                    narr = re.sub(r"\s+", " ", re.sub(r"\b(?:" + "|".join(names or ["\\0"]) + r")?\s*(?:" + "|".join(SPEECH_VERBS) + r")\b[,.]?", " ", outside)).strip(" ,.-—")
                    b.narration = (narr[:1].upper() + narr[1:]) if len(narr.split()) > 4 else ""
                else:
                    th = re.match(r"^[*_(]\s*(.+?)\s*[*_)]$", s)
                    if th:
                        b.dialogue.append(Dialogue(speaker=last_speaker, text=th.group(1), kind="thought"))
                    else:
                        b.narration = s
                b.names = nm
                if not b.names and recent and re.search(r"\b(he|she|his|her|him|they|their)\b", s, re.I):
                    b.names = [recent[-1]]      # pronoun: continue with the last mentioned character
                if not b.names and names and not quotes:
                    pass
            for n in b.names:
                recent.append(n)
            recent = recent[-6:]
            beats.append(b)
        return beats

    @staticmethod
    def _speaker(before: str, after: str, names: list[str], last: Optional[str], recent: list[str]) -> Optional[str]:
        sv = "|".join(SPEECH_VERBS)
        for n in names:
            if re.search(rf"\b{re.escape(n)}\s+(?:{sv})\b", after) or re.search(rf"\b(?:{sv})\s+{re.escape(n)}\b", after) \
                    or re.search(rf"\b{re.escape(n)}\b[^.]*?\b(?:{sv})\b[^\"“]*[,:]?\s*$", before):
                return n
        for n in names:   # "Jin turned and said" style: nearest name before the quote
            if re.search(rf"\b{re.escape(n)}\b", before[-60:]) and re.search(rf"\b(?:{sv})\b", before[-40:]):
                return n
        if names and re.search(r"\b(he|she)\s+(?:" + sv + r")\b", after, re.I) and recent:
            return recent[-1]
        # alternate between the two most recent speakers
        if last and len(names) > 1:
            others = [n for n in names if n != last]
            return others[0]
        return last or (names[0] if names else None)

    @staticmethod
    def _verb(ctx: str) -> str:
        for v in SPEECH_VERBS:
            if re.search(rf"\b{v}\b", ctx):
                return v
        return ""

    @staticmethod
    def _kind(text: str, verb: str) -> str:
        if verb in WHISPER_VERBS:
            return "whisper"
        if verb in SHOUT_VERBS or text.endswith("!!") or (text.endswith("!") and text.upper() == text and len(text) > 3):
            return "shout"
        return "speech"

    # ------------------------------------------------------------ fitting beats to the panel budget
    def _fit(self, beats: list[_Beat], target: int, names: list[str]) -> list[_Beat]:
        target = max(config.MIN_PANELS, min(config.MAX_PANELS, target))
        beats = [b for b in beats if b.narration or b.dialogue]
        # split multi-line dialogue exchanges so each line can have its own coverage when we have room
        while len(beats) < target:
            idx = max((i for i, b in enumerate(beats) if len(b.dialogue) > 1), key=lambda i: len(beats[i].dialogue), default=None)
            if idx is not None:
                b = beats[idx]
                first = _Beat(narration=b.narration, dialogue=b.dialogue[:1], names=b.names, raw="")
                rest = _Beat(dialogue=b.dialogue[1:], names=b.names, raw="")
                beats[idx:idx + 1] = [first, rest]
                continue
            idx = max((i for i, b in enumerate(beats) if len(b.narration.split()) > 24 and b.narration.count(",") + b.narration.count(";") >= 1), key=lambda i: len(beats[i].narration), default=None)
            if idx is None:
                break
            b = beats[idx]
            parts = re.split(r"(?<=[,;])\s+", b.narration, maxsplit=1)
            beats[idx:idx + 1] = [_Beat(narration=parts[0], names=b.names, dialogue=b.dialogue), _Beat(narration=parts[1], names=b.names, raw=parts[1])]
        # merge the cheapest adjacent pair until we are within budget
        while len(beats) > target:
            best_i, best_cost = 0, 10**9
            for i in range(len(beats) - 1):
                a, b = beats[i], beats[i + 1]
                cost = len(a.dialogue) + len(b.dialogue) + (0 if (not a.dialogue and not b.dialogue) else 2) + len((a.narration + b.narration).split()) / 20
                if len(a.dialogue) + len(b.dialogue) > 3:
                    cost += 50
                if cost < best_cost:
                    best_i, best_cost = i, cost
            a, b = beats[best_i], beats[best_i + 1]
            beats[best_i:best_i + 2] = [_Beat(narration=(a.narration + " " + b.narration).strip(), dialogue=a.dialogue + b.dialogue,
                                              names=list(dict.fromkeys(a.names + b.names)), raw=(a.text + " " + b.text).strip())]
        return beats

    # ------------------------------------------------------------ descriptions
    @staticmethod
    def _describe(names: list[str], declared: dict[str, str], sentences: list[str]) -> dict[str, str]:
        out: dict[str, str] = {}
        for n in names:
            if n in declared:
                out[n] = declared[n]
                continue
            bits = [s for s in sentences if re.search(rf"\b{re.escape(n)}\b", s) and DESC_WORDS.search(s)]
            out[n] = " ".join(re.sub(r"[\"“][^\"”]*[\"”]", "", s) for s in bits[:2])[:300]
        return out

    # ------------------------------------------------------------ panels
    def _panels(self, beats: list[_Beat], names: list[str], pkg: InputPackage) -> list[PanelSpec]:
        panels: list[PanelSpec] = []
        loc_desc, loc, tod, weather = "", "abstract", "day", "clear"
        slots: dict[str, str] = {}
        n_beats = len(beats)
        prev_shot = ""
        last_present: list[str] = []
        for i, b in enumerate(beats):
            low = b.text.lower()
            found = classify_location(low)
            if found != "abstract":
                loc, loc_desc = found, self._loc_phrase(low, found)
            for key, words in TIME_RULES:
                if any(re.search(rf"\b{re.escape(w)}", low) for w in words):
                    tod = key
                    break
            wx = next((k for k, ws in WEATHER_RULES if any(w in low for w in ws)), None)
            if wx:
                weather = wx
            elif i and re.search(r"\b(clear|stopped raining|sunny)\b", low):
                weather = "clear"
            if loc == "interior" and not any(re.search(rf"\b{w}\b", low) for w in ("night", "dusk", "sunset")):
                pass
            mood = next((m for m, ws in MOODS if has(low, ws)), "calm")
            present = [n for n in b.names if n in names] or ([b.dialogue[0].speaker] if b.dialogue and b.dialogue[0].speaker in names else [])
            if not present and last_present and (b.dialogue or re.search(r"\b(he|she|they)\b", low)):
                present = last_present[:1]
            present = list(dict.fromkeys(present))[:3]
            if present:
                last_present = present
            expr = canonical_expression(low) if has(low, EXPR_KEYS) else "neutral"
            pose = next((p for ws, p in POSE_RULES if has(low, ws)), "standing")
            chars = []
            for k, n in enumerate(present):
                if n not in slots:
                    slots[n] = ("left", "right", "center")[len(slots) % 3]
                e = self._expression_for(n, low, b, mood, primary=(k == 0))
                chars.append(PanelCharacter(name=n, expression=e, pose=pose, position=slots[n]))
            shot = self._shot(i, n_beats, b, len(chars), mood, low, prev_shot, bool(loc != "abstract"))
            prev_shot = shot
            pacing = "impact" if (mood == "action" and i > n_beats * 0.4) or re.search(r"\b(suddenly|explod|shatter|burst|slam)\b", low) or b.text.count("!") >= 2 \
                else "slow" if (shot in ("establishing",) or "silence" in low or "quiet" in low) else "beat" if (shot in ("insert", "extreme_close") and not b.dialogue) else "normal"
            lighting = self._lighting(tod, mood, loc, low)
            effects = []
            if has(low, ("fire", "flame", "burn", "ember")):
                effects.append("embers")
            if has(low, ("magic", "spell", "glow", "sparkl", "stars")) or mood == "romantic":
                effects.append("sparkles")
            if has(low, ("dust", "rubble", "debris")):
                effects.append("dust")
            if pose in ("running", "fight") and mood == "action":
                effects.append("speed_lines")
            sfx = []
            for ws, token in SFX_RULES:
                if has(low, ws):
                    sfx.append(token)
                    break
            dialogue = list(b.dialogue)
            cap = self._caption(b.narration, bool(dialogue), shot, i)
            if cap:
                dialogue.insert(0, Dialogue(speaker=None, text=cap, kind="caption"))
            angle = "dutch" if mood in ("tense", "dread") and shot not in ("establishing",) and i % 3 == 1 else \
                "low" if shot == "low_angle" else "high" if shot == "high_angle" else "eye"
            panels.append(PanelSpec(index=i, summary=(b.narration or (b.dialogue[0].text if b.dialogue else ""))[:160], shot=shot, angle=angle, location=loc,
                                    location_desc=loc_desc, time_of_day=tod if loc != "interior" or tod in ("night", "dawn", "sunset") else "day", weather=weather,
                                    lighting=lighting, mood=mood, characters=chars, dialogue=dialogue, sfx=sfx, effects=effects, pacing=pacing))
        return panels

    @staticmethod
    def _expression_for(name: str, low: str, b: _Beat, mood: str, primary: bool) -> str:
        """Expression for one character: keyword near their name, else their own line, else the scene mood."""
        m = re.search(rf"\b{re.escape(name.lower())}\b[^.!?]{{0,45}}?\b(" + "|".join(EXPR_KEYS) + r")\w*", low)
        if m:
            return canonical_expression(m.group(1))
        mine = [d for d in b.dialogue if d.speaker == name]
        if mine:
            d = mine[0]
            if d.kind == "shout":
                return "angry" if mood != "joyful" else "laugh"
            if d.kind == "whisper":
                return "worried" if mood in ("tense", "dread", "sad") else "shy" if mood == "romantic" else "neutral"
            if d.text.endswith("?!") or d.text.endswith("!?"):
                return "shock"
            if d.text.endswith("..."):
                return "worried"
            if d.text.endswith("?"):
                return "neutral"
        return {"tense": "worried", "action": "determined", "sad": "sad", "joyful": "smile", "romantic": "shy", "dread": "fear",
                "mystery": "worried"}.get(mood, "neutral") if primary else "neutral"

    @staticmethod
    def _loc_phrase(low: str, fam: str) -> str:
        from ..render.background import LOCATION_FAMILIES
        for w in LOCATION_FAMILIES[fam]:
            m = re.search(rf"(?:\w+\s+)?{re.escape(w)}\w*", low)
            if m:
                return m.group(0).strip()
        return fam

    @staticmethod
    def _shot(i: int, n: int, b: _Beat, n_chars: int, mood: str, low: str, prev: str, has_loc: bool) -> str:
        if i == 0:
            return "establishing" if has_loc or not n_chars else "wide"
        if re.search(r"\b(eyes?|gaze|stared|glare|pupils?)\b", low) and n_chars == 1 and not b.dialogue and prev != "insert":
            return "insert"
        if mood in ("action",) and not b.dialogue:
            return "low_angle" if prev != "low_angle" else "wide"
        if re.search(r"\b(cry|cried|tears|wept|gasp|shock|stunned|screamed|fear|terrif)", low) and n_chars >= 1:
            return "extreme_close" if prev != "extreme_close" else "close"
        if b.dialogue and n_chars >= 2:
            return "over_shoulder" if prev == "medium" else "medium"
        if b.dialogue and n_chars == 1:
            return "close" if prev != "close" else "medium"
        if n_chars == 0:
            return "wide" if prev != "wide" else "establishing"
        if i == n - 1:
            return "wide" if n_chars >= 1 and prev != "wide" else "close"
        if mood in ("tense", "dread"):
            return "high_angle" if prev != "high_angle" else "close"
        return "medium" if prev != "medium" else "wide"

    @staticmethod
    def _lighting(tod: str, mood: str, loc: str, low: str) -> str:
        if "neon" in low:
            return "neon"
        if any(w in low for w in ("candle", "torch", "lantern", "fireplace")):
            return "candle"
        if mood in ("dread", "tense") or "spotlight" in low:
            return "dramatic" if mood == "dread" else "spotlight" if "spotlight" in low else "dramatic"
        if tod == "night":
            return "moonlit"
        if tod in ("sunset", "dawn"):
            return "backlit" if mood in ("romantic", "sad") else "sunset"
        return "neutral"

    @staticmethod
    def _caption(narr: str, has_dialogue: bool, shot: str, i: int) -> str:
        if not narr:
            return ""
        narr = re.sub(r"\s+", " ", narr).strip()
        limit = 80 if has_dialogue else 130
        if len(narr) <= limit:
            return narr
        cut = narr[:limit]
        end = max(cut.rfind(". "), cut.rfind(", "), cut.rfind("; "))
        if end > limit * 0.5:
            return cut[:end].rstrip(",;") + ("." if cut[end] in ".," else "…")
        return cut[:cut.rfind(" ")].rstrip(",;") + "…"

    # ------------------------------------------------------------ post
    @staticmethod
    def _pad_with_reactions(panels: list[PanelSpec], target: int) -> list[PanelSpec]:
        """A thin story still gets the panel count asked for: add silent reaction / eye-insert cut-ins after the most
        intense beats (the standard manhwa way to stretch a moment), never more than one per beat."""
        target = min(target, config.MAX_PANELS)
        intensity = {"action": 3, "dread": 3, "tense": 2, "sad": 2, "romantic": 2, "joyful": 1, "mystery": 1, "calm": 0}
        order = sorted((i for i, p in enumerate(panels) if p.characters and p.shot != "insert"),
                       key=lambda i: (-(intensity.get(panels[i].mood, 0) + (2 if panels[i].pacing == "impact" else 0)
                                        + (1 if any(d.kind == "shout" for d in panels[i].dialogue) else 0)), i))
        picks: list[int] = []
        for i in order:
            if len(panels) + len(picks) >= target:
                break
            picks.append(i)
        for k, i in enumerate(sorted(picks, reverse=True)):
            src = panels[i]
            who = src.characters[:1]
            r = src.model_copy(deep=True)
            r.characters = [c.model_copy() for c in who]
            r.shot = "insert" if (k % 2 == 0 and len(who) == 1) else "close"
            r.pacing = "beat"
            r.dialogue, r.sfx, r.effects = [], [], []
            r.sketch_ref = r.focus_x = None
            r.summary = f"Reaction: {who[0].name}"
            if r.mood == "calm":
                r.mood = "tense"
            panels.insert(i + 1, r)
        return panels

    @staticmethod
    def _enforce_limits(panels: list[PanelSpec]) -> list[PanelSpec]:
        """Max 3 bubbles per panel and <=150 chars each; overflow continues in a follow-up panel."""
        out: list[PanelSpec] = []
        for p in panels:
            items: list[Dialogue] = []
            for d in p.dialogue:
                if len(d.text) > 150:
                    parts = re.split(r"(?<=[.!?…,;])\s+", d.text)
                    cur = ""
                    for part in parts:
                        if len(cur) + len(part) + 1 > 140 and cur:
                            items.append(Dialogue(speaker=d.speaker, text=cur.strip(), kind=d.kind))
                            cur = part
                        else:
                            cur = (cur + " " + part).strip()
                    if cur:
                        items.append(Dialogue(speaker=d.speaker, text=cur.strip(), kind=d.kind))
                else:
                    items.append(d)
            if len(items) <= 3:
                p.dialogue = items
                out.append(p)
                continue
            p.dialogue = items[:3]
            out.append(p)
            rest = items[3:]
            while rest:
                q = p.model_copy(deep=True)
                q.dialogue = rest[:3]
                q.shot = "close" if p.shot != "close" else "medium"
                q.pacing = "beat"
                q.sfx = []
                q.effects = []
                out.append(q)
                rest = rest[3:]
        return out

    @staticmethod
    def _attach_sketches(panels: list[PanelSpec], pkg: InputPackage) -> None:
        """Spread the user's sketches over the chapter; each sketch's ink centroid steers that panel's composition."""
        k = len(pkg.sketches)
        if not k or not panels:
            return
        for j, ref in enumerate(pkg.sketches):
            idx = min(len(panels) - 1, round((j + 0.5) * len(panels) / k - 0.5))
            p = panels[idx]
            p.sketch_ref = j
            p.focus_x = ref.focus_x


# --------------------------------------------------------------------------- LLM director
_LLM_SYSTEM = """You are the Director agent of a manhwa (vertical-scroll webtoon) studio. Convert the user's story into a panel-by-panel \
script. Reply with ONE JSON object and nothing else, matching exactly:
{"title": str, "logline": str,
 "characters": [{"name": str, "description": str (hair, eyes, build, outfit), "role": str}],
 "panels": [{"summary": str,
   "shot": one of establishing|wide|medium|close|extreme_close|over_shoulder|low_angle|high_angle|insert,
   "angle": eye|low|high|dutch,
   "location": one of city|street|rooftop|forest|interior|castle|battlefield|mountain|ocean|school|abstract,
   "location_desc": str, "time_of_day": dawn|day|sunset|night|indoor, "weather": clear|rain|fog|snow,
   "lighting": neutral|backlit|moonlit|neon|candle|spotlight|sunset|dramatic, "mood": str,
   "characters": [{"name": str, "expression": str, "pose": standing|fight|crossed|pointing|slumped|running, "position": left|center|right}],
   "dialogue": [{"speaker": str|null, "text": str (<=140 chars), "kind": speech|thought|shout|whisper|caption}],
   "sfx": [str], "effects": [speed_lines|sparkles|embers|dust], "pacing": normal|slow|impact|beat}]}
Rules: use only characters from the story; at most 3 dialogue items per panel; vary shots for cinematic rhythm; open with an establishing shot; \
keep each character's appearance description consistent."""


class LLMDirector:
    name = "llm"

    def __init__(self, api_key: str = config.ANTHROPIC_API_KEY, model: str = config.LLM_MODEL,
                 transport: Optional[Callable[[dict], dict]] = None):
        self.api_key, self.model = api_key, model
        self._transport = transport or self._http

    def _http(self, payload: dict) -> dict:
        req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=json.dumps(payload).encode(),
                                     headers={"content-type": "application/json", "x-api-key": self.api_key, "anthropic-version": "2023-06-01"})
        with urllib.request.urlopen(req, timeout=config.LLM_TIMEOUT) as r:     # noqa: S310 (fixed https URL)
            return json.loads(r.read())

    def plan(self, pkg: InputPackage, target: int) -> Script:
        hints = ""
        if pkg.sketches:
            hints = f"\nThe user also supplied {len(pkg.sketches)} sketch(es); keep compositions varied."
        payload = {"model": self.model, "max_tokens": 8000, "system": _LLM_SYSTEM,
                   "messages": [{"role": "user", "content": f"Title hint: {pkg.title or '(none)'}\nTarget panel count: {target}{hints}\n\nSTORY:\n{pkg.text}"}]}
        data = self._transport(payload)
        text = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
        m = re.search(r"\{.*\}", text, re.S)
        if not m:
            raise ValueError("no JSON object in model reply")
        raw = json.loads(m.group(0))
        script = Script.model_validate({**raw, "source": "llm"})
        known = {c.name for c in script.characters}
        for p in script.panels:
            p.characters = [c for c in p.characters if c.name in known]
            p.dialogue = p.dialogue[:3]
        if not script.panels:
            raise ValueError("model returned no panels")
        script.panels = script.panels[:config.MAX_PANELS]
        for i, p in enumerate(script.panels):
            p.index = i
        HeuristicDirector._attach_sketches(script.panels, pkg)
        return script


class Director:
    name = "Director"

    def __init__(self, llm: Optional[LLMDirector] = None):
        self.llm = llm if llm is not None else (LLMDirector() if config.ANTHROPIC_API_KEY else None)
        self.heuristic = HeuristicDirector()

    def plan(self, pkg: InputPackage, target: int, log: Callable[[str], None] = lambda m: None) -> Script:
        if not pkg.text.strip():
            raise ValueError("no story text: give a description or upload a script file")
        if self.llm:
            try:
                s = self.llm.plan(pkg, target)
                log(f"script written by the LLM director ({self.llm.model}): {len(s.panels)} panels")
                return s
            except Exception as e:   # noqa: BLE001 - any failure falls back, loudly
                log(f"LLM director failed ({type(e).__name__}: {e}); falling back to the heuristic director")
        s = self.heuristic.plan(pkg, target)
        log(f"script written by the heuristic director: {len(s.panels)} panels, {len(s.characters)} characters")
        return s
