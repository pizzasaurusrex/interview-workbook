from datetime import datetime

import pytest

from models import Candidate, Event
from pipeline import Pipeline
from utils import count_events_by_type, format_name


@pytest.fixture
def pipeline():
    p = Pipeline()
    p.add_candidate(Candidate(id="c1", name="alice smith", email="alice@example.com", status="applied"))
    p.add_candidate(Candidate(id="c2", name="bob jones", email="bob@example.com", status="screening"))
    p.add_candidate(Candidate(id="c3", name="carol white", email="carol@example.com", status="applied"))
    return p


def test_add_candidate(pipeline):
    pipeline.add_candidate(Candidate(id="c4", name="dan brown", email="dan@example.com", status="applied"))
    assert len(pipeline.candidates) == 4


def test_get_by_status(pipeline):
    applied = pipeline.get_by_status("applied")
    assert len(applied) == 2
    assert all(c.status == "applied" for c in applied)


def test_update_status(pipeline):
    result = pipeline.update_status("c1", "screening")
    assert result is True
    assert pipeline.get_candidate("c1").status == "screening"


def test_update_status_unknown_candidate(pipeline):
    result = pipeline.update_status("unknown", "screening")
    assert result is False


def test_add_event(pipeline):
    pipeline.add_event("c1", "email_opened")
    candidate = pipeline.get_candidate("c1")
    assert len(candidate.events) == 1
    assert candidate.events[0].type == "email_opened"


def test_format_name():
    c = Candidate(id="x", name="  jane doe  ", email="jane@example.com", status="applied")
    assert format_name(c) == "Jane Doe"


def test_count_events_by_type():
    c = Candidate(id="x", name="Test", email="t@example.com", status="applied", events=[
        Event(type="email_opened", timestamp=datetime(2024, 1, 1)),
        Event(type="link_clicked", timestamp=datetime(2024, 1, 2)),
        Event(type="email_opened", timestamp=datetime(2024, 1, 3)),
    ])
    assert count_events_by_type(c, "email_opened") == 2
    assert count_events_by_type(c, "link_clicked") == 1
    assert count_events_by_type(c, "replied") == 0

def test_funnel_report(pipeline):
    result = pipeline.funnel_report()
    assert result == [("applied", 2), ("screening", 1), ("interview", 0), ("offer", 0), ("hired", 0)]


