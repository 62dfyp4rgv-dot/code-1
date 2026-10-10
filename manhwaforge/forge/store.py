"""Job persistence: one directory per job, atomic state.json, append-only events.jsonl."""
from __future__ import annotations

import json
import os
import threading
import time
import uuid
from pathlib import Path
from typing import Callable, Optional

from . import config
from .models import Event, JobState


class JobRecord:
    def __init__(self, state: JobState, root: Path):
        self.state = state
        self.dir = root / state.id
        self.lock = threading.RLock()
        self.events: list[Event] = []
        self.tracker = None          # set by the runner while a job executes
        self.cancel = threading.Event()

    # ---- paths
    @property
    def inputs_dir(self) -> Path: return self.dir / "inputs"
    @property
    def work_dir(self) -> Path: return self.dir / "work"
    @property
    def out_dir(self) -> Path: return self.dir / "output"

    # ---- mutation
    def mutate(self, fn: Callable[[JobState], None]) -> None:
        with self.lock:
            fn(self.state)
            self.state.updated = time.time()
            self._persist()

    def log(self, agent: str, msg: str, level: str = "info") -> None:
        with self.lock:
            ev = Event(n=len(self.events), t=time.time(), agent=agent, level=level, msg=msg)
            self.events.append(ev)
            with open(self.dir / "events.jsonl", "a", encoding="utf-8") as f:
                f.write(ev.model_dump_json() + "\n")

    def events_since(self, n: int) -> list[dict]:
        with self.lock:
            return [e.model_dump() for e in self.events[n:]]

    def snapshot(self) -> dict:
        with self.lock:
            return self.state.model_dump(mode="json")

    def _persist(self) -> None:
        tmp = self.dir / ".state.json.tmp"
        tmp.write_text(self.state.model_dump_json(indent=1), encoding="utf-8")
        os.replace(tmp, self.dir / "state.json")


class JobStore:
    def __init__(self, data_dir: Path = config.DATA_DIR):
        self.root = data_dir / "jobs"
        self.root.mkdir(parents=True, exist_ok=True)
        self._jobs: dict[str, JobRecord] = {}
        self._lock = threading.Lock()
        self._load()

    def _load(self) -> None:
        for d in sorted(self.root.iterdir()):
            sp = d / "state.json"
            if not (d.is_dir() and sp.exists()):
                continue
            try:
                state = JobState.model_validate_json(sp.read_text(encoding="utf-8"))
            except Exception:
                continue
            rec = JobRecord(state, self.root)
            ev = d / "events.jsonl"
            if ev.exists():
                for line in ev.read_text(encoding="utf-8").splitlines():
                    try:
                        rec.events.append(Event.model_validate_json(line))
                    except Exception:
                        pass
            if state.status in ("queued", "running"):
                state.status, state.stage = "interrupted", "interrupted"
                state.error = "The server restarted while this job was running. Submit it again."
                rec._persist()
                rec.log("System", state.error, "warn")
            self._jobs[state.id] = rec

    def create(self, **fields) -> JobRecord:
        jid = uuid.uuid4().hex[:12]
        state = JobState(id=jid, **fields)
        rec = JobRecord(state, self.root)
        for d in (rec.dir, rec.inputs_dir, rec.work_dir, rec.out_dir):
            d.mkdir(parents=True, exist_ok=True)
        rec._persist()
        with self._lock:
            self._jobs[jid] = rec
        return rec

    def get(self, jid: str) -> Optional[JobRecord]:
        return self._jobs.get(jid)

    def list(self) -> list[JobRecord]:
        with self._lock:
            return sorted(self._jobs.values(), key=lambda r: r.state.created, reverse=True)
