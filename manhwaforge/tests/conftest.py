import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from forge.store import JobStore  # noqa: E402

STORY = (Path(__file__).parent / "story.txt").read_text()


@pytest.fixture()
def store(tmp_path):
    return JobStore(tmp_path / "data")


@pytest.fixture()
def story():
    return STORY
