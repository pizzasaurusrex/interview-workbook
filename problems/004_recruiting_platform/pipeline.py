from __future__ import annotations

from datetime import datetime

from models import Candidate, Event


class Pipeline:
    def __init__(self):
        self.candidates: list[Candidate] = []
        self.stages: list[str] = ["applied", "screening", "interview", "offer", "hired"]

    def add_candidate(self, candidate: Candidate) -> None:
        self.candidates.append(candidate)

    def get_candidate(self, candidate_id: str) -> Candidate | None:
        for c in self.candidates:
            if c.id == candidate_id:
                return c
        return None

    def update_status(self, candidate_id: str, new_status: str) -> bool:
        candidate = self.get_candidate(candidate_id)
        if not candidate:
            return False
        candidate.status = new_status
        return True

    def add_event(self, candidate_id: str, event_type: str) -> bool:
        candidate = self.get_candidate(candidate_id)
        if not candidate:
            return False
        candidate.events.append(Event(type=event_type, timestamp=datetime.now()))
        return True

    def get_by_status(self, status: str) -> list[Candidate]:
        return [c for c in self.candidates if c.status == status]
