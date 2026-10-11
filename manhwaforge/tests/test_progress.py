from fractions import Fraction

import pytest

from forge.progress import STAGE_WEIGHTS, HaltSignal, ProgressTracker


def run_to(tr, upto):
    for stage in ("director", "style", "art", "typeset", "assembly"):
        tr.advance(stage, 1, 1)
        if stage == upto:
            return


def test_weights_sum_to_100_and_pre_polish_is_95():
    assert sum(STAGE_WEIGHTS.values()) == 100
    assert sum(w for s, w in STAGE_WEIGHTS.items() if s != "polish") == 95


def test_halts_at_exactly_95_not_before():
    tr = ProgressTracker()
    for stage in ("director", "style", "art", "typeset"):
        tr.advance(stage, 1, 1)
    assert tr.progress == Fraction(75, 100) and tr.halted is None
    tr.advance("assembly", 3, 4)                      # 90%
    assert tr.progress == Fraction(90, 100) and tr.halted is None
    with pytest.raises(HaltSignal) as e:
        tr.advance("assembly", 4, 4)                  # 95%
    assert e.value.progress == Fraction(95, 100)
    assert tr.halted is e.value


def test_exact_fraction_arithmetic_no_float_drift():
    tr = ProgressTracker()
    tr.advance("director", 1, 1)
    tr.advance("style", 1, 1)
    for i in range(1, 8):                              # 7/7 panels in three odd-sized increments
        tr.advance("art", i, 7)
    tr.advance("typeset", 7, 7)
    with pytest.raises(HaltSignal):
        tr.advance("assembly", 1, 1)


def test_checkpoint_stops_workers_after_halt():
    tr = ProgressTracker()
    run_to(tr, "typeset")
    with pytest.raises(HaltSignal):
        tr.advance("assembly", 1, 1)
    with pytest.raises(HaltSignal):
        tr.checkpoint()                                # any worker polling afterwards is stopped
    with pytest.raises(HaltSignal):
        tr.advance("polish", 1, 1)                     # and nothing may advance past the halt


def test_confidence_never_exceeds_progress_and_weak_panels_lower_it():
    tr = ProgressTracker()
    tr.advance("director", 1, 1)
    tr.record_score(0, 9.0)
    assert tr.confidence == tr.progress
    tr.record_score(1, 3.75)                           # half of the 7.5 gate
    assert tr.confidence < tr.progress


def test_confidence_can_trigger_halt_only_together_with_progress():
    tr = ProgressTracker()
    for s in ("director", "style", "art", "typeset"):
        tr.advance(s, 1, 1)
    tr.record_score(0, 10)
    assert tr.confidence <= tr.progress < Fraction(95, 100)


def test_monotonic():
    tr = ProgressTracker()
    tr.advance("art", 5, 10)
    tr.advance("art", 2, 10)
    assert tr.stage_fraction("art") == Fraction(1, 2)


def test_disarm_allows_finishing_after_manual_instruction():
    tr = ProgressTracker()
    run_to(tr, "typeset")
    with pytest.raises(HaltSignal):
        tr.advance("assembly", 1, 1)
    tr2 = ProgressTracker()
    tr2.restore({s: 1.0 for s in ("director", "style", "art", "typeset", "assembly")}, {})
    tr2.disarm()
    tr2.advance("polish", 1, 1)
    assert tr2.progress == 1
