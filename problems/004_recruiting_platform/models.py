from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Event:
    type: str
    timestamp: datetime


@dataclass
class Candidate:
    id: str
    name: str
    email: str
    status: str
    events: list[Event] = field(default_factory=list)

    def latest_event(self) -> Event | None:
        if not self.events:
            return None
        return max(self.events, key=lambda e: e.timestamp)
