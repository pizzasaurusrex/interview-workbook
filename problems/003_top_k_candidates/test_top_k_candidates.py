import pytest
from solution import top_k_candidates


EVENTS = [
    {"candidate_id": "a1", "action": "email_opened"},
    {"candidate_id": "b2", "action": "link_clicked"},
    {"candidate_id": "a1", "action": "replied"},
    {"candidate_id": "c3", "action": "email_opened"},
    {"candidate_id": "b2", "action": "email_opened"},
    {"candidate_id": "a1", "action": "link_clicked"},
]


def test_example_case():
    assert set(top_k_candidates(EVENTS, k=2)) == {"a1", "b2"}


def test_k_equals_one():
    assert top_k_candidates(EVENTS, k=1) == ["a1"]


def test_k_equals_all():
    assert set(top_k_candidates(EVENTS, k=3)) == {"a1", "b2", "c3"}


def test_single_event():
    events = [{"candidate_id": "x1", "action": "email_opened"}]
    assert top_k_candidates(events, k=1) == ["x1"]


def test_returns_correct_count():
    assert len(top_k_candidates(EVENTS, k=2)) == 2
