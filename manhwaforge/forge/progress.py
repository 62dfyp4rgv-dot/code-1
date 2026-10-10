"""Progress accounting and the 95% completion rule.

Progress is a weighted sum over pipeline stages. All arithmetic uses exact fractions so
"hit 95%" is an exact comparison, never a floating-point accident.

    director 10 + style 5 + art 40 + typeset 20 + assembly 20  = 95
    polish 5                                                    = 100

The 95% mark therefore falls exactly at "layout assembled, only final polish left".
The instant progress OR confidence reaches 95%, `advance()` raises `HaltSignal`; the
orchestrator hard-saves and stops. Nothing in the pipeline runs after that until a
human issues a resume instruction.
"""
from __future__ import annotations

import threading
from fractions import Fraction
from typing import Callable, Optional

from . import config

STAGE_WEIGHTS: dict[str, int] = {
    "director": 10,
    "style": 5,
    "art": 40,
    "typeset": 20,
    "assembly": 20,
    "polish": 5,
}
assert sum(STAGE_WEIGHTS.values()) == 100
HALT_FRACTION = Fraction(config.HALT_AT).limit_denominator(1000)


class HaltSignal(Exception):
    """Raised the moment overall progress or confidence reaches the halt threshold."""

    def __init__(self, reason: str, progress: Fraction, confidence: Fraction):
        super().__init__(reason)
        self.reason = reason
        self.progress = progress
        self.confidence = confidence


class ProgressTracker:
    def __init__(self, on_change: Optional[Callable[["ProgressTracker"], None]] = None,
                 halt_at: Fraction = HALT_FRACTION):
        self._lock = threading.RLock()
        self._done: dict[str, Fraction] = {s: Fraction(0) for s in STAGE_WEIGHTS}
        self._scores: dict[int, float] = {}
        self._on_change = on_change
        self._halt_at = halt_at
        self._halted: Optional[HaltSignal] = None
        self._armed = True   # False while finishing a manual resume (the rule already fired)

    # ------------------------------------------------------------------ queries
    @property
    def progress(self) -> Fraction:
        with self._lock:
            return sum((Fraction(w, 100) * self._done[s] for s, w in STAGE_WEIGHTS.items()), Fraction(0))

    @property
    def quality_factor(self) -> Fraction:
        """1.0 while every accepted panel cleared the gate; shrinks with weak panels."""
        with self._lock:
            if not self._scores:
                return Fraction(1)
            f = [min(1.0, s / config.AMAZEMENT_THRESHOLD) for s in self._scores.values()]
            return Fraction(sum(f) / len(f)).limit_denominator(10_000)

    @property
    def confidence(self) -> Fraction:
        """Completion weighted by quality. Never exceeds progress, so it can only ever
        trigger the halt together with (or after) the progress rule, not before the
        layout exists."""
        return self.progress * self.quality_factor

    @property
    def mean_score(self) -> Optional[float]:
        with self._lock:
            return sum(self._scores.values()) / len(self._scores) if self._scores else None

    @property
    def halted(self) -> Optional[HaltSignal]:
        return self._halted

    def stage_fraction(self, stage: str) -> Fraction:
        with self._lock:
            return self._done[stage]

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "progress": float(self.progress),
                "confidence": float(self.confidence),
                "stage_progress": {s: float(f) for s, f in self._done.items()},
                "mean_amazement": self.mean_score,
            }

    # ------------------------------------------------------------------ mutation
    def record_score(self, panel_index: int, score: float) -> None:
        with self._lock:
            self._scores[panel_index] = score

    def advance(self, stage: str, done: int, total: int) -> None:
        """Set `stage` to done/total complete (monotonic). Raises HaltSignal at the threshold."""
        total = max(total, 1)
        frac = Fraction(min(done, total), total)
        with self._lock:
            if frac > self._done[stage]:
                self._done[stage] = frac
            self._notify()
            self._check_locked()

    def checkpoint(self) -> None:
        """Called by workers between units of work: stop at once if the rule has fired."""
        if self._halted:
            raise self._halted

    def restore(self, stage_progress: dict[str, float], scores: dict[int, float]) -> None:
        """Rebuild tracker state from a persisted job (used when a halted job is resumed)."""
        with self._lock:
            for stage, frac in stage_progress.items():
                if stage in self._done:
                    self._done[stage] = Fraction(frac).limit_denominator(10_000)
            self._scores = dict(scores)

    def disarm(self) -> None:
        """After a human resume instruction the rule has already done its job."""
        with self._lock:
            self._armed = False
            self._halted = None

    # ------------------------------------------------------------------ internals
    def _check_locked(self) -> None:
        if not self._armed:
            return
        if self._halted:
            raise self._halted
        p, c = self.progress, self.confidence
        if p >= self._halt_at or c >= self._halt_at:
            which = "progress" if p >= self._halt_at else "confidence"
            self._halted = HaltSignal(
                f"{which} reached {float(max(p, c)) * 100:.1f}% (threshold {float(self._halt_at) * 100:.0f}%)", p, c)
            raise self._halted

    def _notify(self) -> None:
        if self._on_change:
            self._on_change(self)
