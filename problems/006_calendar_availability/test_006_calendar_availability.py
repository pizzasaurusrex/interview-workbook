import pytest
from datetime import date, time
from solution import get_free_slots, get_availability


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slot(start: str, end: str) -> dict:
    return {"start": start, "end": end}


def event(start: str, end: str) -> dict:
    return {"start": start, "end": end}


# ---------------------------------------------------------------------------
# Part 1 — get_free_slots basics
# ---------------------------------------------------------------------------

class TestGetFreeSlots:
    def test_no_events_returns_all_slots(self):
        slots = get_free_slots([], date(2024, 6, 10))
        # 09:00–17:00 → 16 half-hour blocks
        assert len(slots) == 16
        assert slots[0] == slot("2024-06-10T09:00:00", "2024-06-10T09:30:00")
        assert slots[-1] == slot("2024-06-10T16:30:00", "2024-06-10T17:00:00")

    def test_event_at_start_removes_first_slot(self):
        events = [event("2024-06-10T09:00:00", "2024-06-10T09:30:00")]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert len(slots) == 15
        assert slots[0] == slot("2024-06-10T09:30:00", "2024-06-10T10:00:00")

    def test_event_at_end_removes_last_slot(self):
        events = [event("2024-06-10T16:30:00", "2024-06-10T17:00:00")]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert len(slots) == 15
        assert slots[-1] == slot("2024-06-10T16:00:00", "2024-06-10T16:30:00")

    def test_event_blocks_two_slots(self):
        events = [event("2024-06-10T09:00:00", "2024-06-10T10:00:00")]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert len(slots) == 14
        assert slots[0] == slot("2024-06-10T10:00:00", "2024-06-10T10:30:00")

    def test_mid_day_event(self):
        events = [event("2024-06-10T12:00:00", "2024-06-10T13:00:00")]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert len(slots) == 14
        assert slot("2024-06-10T12:00:00", "2024-06-10T12:30:00") not in slots
        assert slot("2024-06-10T12:30:00", "2024-06-10T13:00:00") not in slots

    def test_event_partially_overlapping_slot_blocks_it(self):
        # Event starts mid-slot — the entire slot containing that time is blocked
        events = [event("2024-06-10T09:15:00", "2024-06-10T09:45:00")]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert slot("2024-06-10T09:00:00", "2024-06-10T09:30:00") not in slots
        assert slot("2024-06-10T09:30:00", "2024-06-10T10:00:00") not in slots

    def test_event_on_different_day_is_ignored(self):
        events = [event("2024-06-11T09:00:00", "2024-06-11T17:00:00")]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert len(slots) == 16

    def test_fully_booked_day_returns_empty(self):
        events = [event("2024-06-10T09:00:00", "2024-06-10T17:00:00")]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert slots == []

    def test_slots_are_sorted(self):
        events = [event("2024-06-10T11:00:00", "2024-06-10T11:30:00")]
        slots = get_free_slots(events, date(2024, 6, 10))
        starts = [s["start"] for s in slots]
        assert starts == sorted(starts)

    def test_custom_work_hours(self):
        slots = get_free_slots([], date(2024, 6, 10), work_start=time(10, 0), work_end=time(12, 0))
        assert len(slots) == 4
        assert slots[0] == slot("2024-06-10T10:00:00", "2024-06-10T10:30:00")
        assert slots[-1] == slot("2024-06-10T11:30:00", "2024-06-10T12:00:00")

    def test_event_outside_work_hours_is_ignored(self):
        events = [event("2024-06-10T07:00:00", "2024-06-10T08:30:00")]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert len(slots) == 16


# ---------------------------------------------------------------------------
# Part 2 — overlapping / adjacent events
# ---------------------------------------------------------------------------

class TestOverlappingEvents:
    def test_two_overlapping_events_merged(self):
        events = [
            event("2024-06-10T10:00:00", "2024-06-10T11:00:00"),
            event("2024-06-10T10:30:00", "2024-06-10T11:30:00"),
        ]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert slot("2024-06-10T10:00:00", "2024-06-10T10:30:00") not in slots
        assert slot("2024-06-10T10:30:00", "2024-06-10T11:00:00") not in slots
        assert slot("2024-06-10T11:00:00", "2024-06-10T11:30:00") not in slots
        assert slot("2024-06-10T11:30:00", "2024-06-10T12:00:00") in slots

    def test_adjacent_events_block_continuously(self):
        events = [
            event("2024-06-10T09:00:00", "2024-06-10T10:00:00"),
            event("2024-06-10T10:00:00", "2024-06-10T11:00:00"),
        ]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert slot("2024-06-10T09:00:00", "2024-06-10T09:30:00") not in slots
        assert slot("2024-06-10T09:30:00", "2024-06-10T10:00:00") not in slots
        assert slot("2024-06-10T10:00:00", "2024-06-10T10:30:00") not in slots
        assert slot("2024-06-10T10:30:00", "2024-06-10T11:00:00") not in slots
        assert slot("2024-06-10T11:00:00", "2024-06-10T11:30:00") in slots

    def test_duplicate_events(self):
        events = [
            event("2024-06-10T09:00:00", "2024-06-10T09:30:00"),
            event("2024-06-10T09:00:00", "2024-06-10T09:30:00"),
        ]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert len(slots) == 15

    def test_event_contained_within_another(self):
        events = [
            event("2024-06-10T10:00:00", "2024-06-10T12:00:00"),
            event("2024-06-10T10:30:00", "2024-06-10T11:00:00"),  # fully inside
        ]
        slots = get_free_slots(events, date(2024, 6, 10))
        assert slot("2024-06-10T10:00:00", "2024-06-10T10:30:00") not in slots
        assert slot("2024-06-10T11:30:00", "2024-06-10T12:00:00") not in slots
        assert slot("2024-06-10T12:00:00", "2024-06-10T12:30:00") in slots


# ---------------------------------------------------------------------------
# Part 3 — get_availability (multi-day)
# ---------------------------------------------------------------------------

class TestGetAvailability:
    def test_returns_all_days_in_range(self):
        availability = get_availability([], date(2024, 6, 10), date(2024, 6, 12))
        assert set(availability.keys()) == {"2024-06-10", "2024-06-11", "2024-06-12"}

    def test_single_day_range(self):
        availability = get_availability([], date(2024, 6, 10), date(2024, 6, 10))
        assert list(availability.keys()) == ["2024-06-10"]
        assert len(availability["2024-06-10"]) == 16

    def test_fully_booked_day_is_empty_list(self):
        events = [event("2024-06-10T09:00:00", "2024-06-10T17:00:00")]
        availability = get_availability(events, date(2024, 6, 10), date(2024, 6, 11))
        assert availability["2024-06-10"] == []
        assert len(availability["2024-06-11"]) == 16

    def test_events_routed_to_correct_days(self):
        events = [
            event("2024-06-10T09:00:00", "2024-06-10T17:00:00"),
            event("2024-06-11T14:00:00", "2024-06-11T15:00:00"),
        ]
        availability = get_availability(events, date(2024, 6, 10), date(2024, 6, 11))
        assert availability["2024-06-10"] == []
        assert len(availability["2024-06-11"]) == 14

    def test_no_events_all_days_have_full_slots(self):
        availability = get_availability([], date(2024, 6, 10), date(2024, 6, 14))
        for day_slots in availability.values():
            assert len(day_slots) == 16

    def test_event_outside_range_is_ignored(self):
        events = [event("2024-06-09T09:00:00", "2024-06-09T17:00:00")]
        availability = get_availability(events, date(2024, 6, 10), date(2024, 6, 10))
        assert len(availability["2024-06-10"]) == 16
