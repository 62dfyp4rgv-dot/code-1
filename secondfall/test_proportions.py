"""pytest: every cast head and body must stay inside human proportion ranges (see proportions.py)."""
import pytest

from secondfall import cast
from secondfall.head import HeadSpec
from secondfall.proportions import measure, measure_body, RANGES, BODY_RANGES


@pytest.mark.parametrize("who", ["tommy", "brody", "eli", "ref", "promoter"])
def test_cast_face_proportions(who):
    m = measure(cast.make(who, 100).head.s)
    thirds = m["forehead : midface : lower (thirds)"]
    mean = sum(thirds) / 3
    assert all(abs(x - mean) / mean < 0.18 for x in thirds)
    for k, (lo, hi) in RANGES.items():
        assert lo <= m[k] <= hi, (who, k, m[k])


def test_default_head_is_human():
    m = measure(HeadSpec())
    for k, (lo, hi) in RANGES.items():
        assert lo <= m[k] <= hi, (k, m[k])


@pytest.mark.parametrize("who", ["tommy", "brody", "eli"])
def test_cast_body_proportions(who):
    for k, v in measure_body(cast.make(who, 100).spec).items():
        lo, hi = BODY_RANGES[k]
        assert lo <= v <= hi, (who, k, v)
