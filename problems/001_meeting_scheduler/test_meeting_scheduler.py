import pytest
from solution import find_available_slots


def test_basic_example():
    interviewer_busy = [(9, 10), (12, 13), (16, 18)]
    candidate_busy = [(10, 11), (13, 15)]
    assert find_available_slots(interviewer_busy, candidate_busy, 9, 18, 1) == [
        (11, 12),
        (15, 16),
    ]


def test_unsorted_inputs():
    interviewer_busy = [(16, 18), (9, 10), (12, 13)]
    candidate_busy = [(13, 15), (10, 11)]
    assert find_available_slots(interviewer_busy, candidate_busy, 9, 18, 1) == [
        (11, 12),
        (15, 16),
    ]


def test_no_available_slots():
    interviewer_busy = [(9, 18)]
    candidate_busy = []
    assert find_available_slots(interviewer_busy, candidate_busy, 9, 18, 1) == []


def test_gap():
  interviewer_busy = [(9, 10), (15, 16)]
  candidate_busy   = []

  assert find_available_slots(interviewer_busy, candidate_busy, 9, 18, 1) == [(10,11), (11,12), (12,13), (13,14), (14,15), (16, 17), (17, 18)]


# TODO: add a test where duration is longer than any free gap
# TODO: add a test where both participants are fully free all day
