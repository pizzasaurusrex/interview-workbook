# Calendar Availability

A recruiter wants to share their open times with candidates. Given the recruiter's existing calendar events, compute the available 30-minute slots within working hours.

## Data Model

A calendar **event** is a dict with ISO-8601 datetime strings:

```python
event = {
    "start": "2024-06-10T09:30:00",
    "end":   "2024-06-10T10:00:00",
}
```

A **time slot** (your output) is a dict in the same shape:

```python
slot = {
    "start": "2024-06-10T08:00:00",
    "end":   "2024-06-10T08:30:00",
}
```

---

## Part 1 — Find Free Slots

Implement `get_free_slots` that returns all available 30-minute slots on a given date within working hours, excluding any time blocked by existing events.

```python
from datetime import date, time

def get_free_slots(
    events: list[dict],
    day: date,
    work_start: time = time(9, 0),
    work_end: time   = time(17, 0),
) -> list[dict]:
    """
    Return a sorted list of free 30-minute slots on `day` between
    `work_start` and `work_end`, given the busy `events`.

    Only include events that overlap with `day`.
    Slots are non-overlapping and aligned to the half-hour
    (e.g. 09:00–09:30, 09:30–10:00, …).
    """
    pass
```

### Example

```python
from datetime import date, time

events = [
    {"start": "2024-06-10T09:00:00", "end": "2024-06-10T10:30:00"},
    {"start": "2024-06-10T12:00:00", "end": "2024-06-10T13:00:00"},
]

slots = get_free_slots(events, date(2024, 6, 10))
# uses defaults: work_start=time(9, 0), work_end=time(17, 0)
# [
#   {"start": "2024-06-10T10:30:00", "end": "2024-06-10T11:00:00"},
#   {"start": "2024-06-10T11:00:00", "end": "2024-06-10T11:30:00"},
#   {"start": "2024-06-10T11:30:00", "end": "2024-06-10T12:00:00"},
#   {"start": "2024-06-10T13:00:00", "end": "2024-06-10T13:30:00"},
#   ... (through 16:30–17:00)
# ]
```

---

## Part 2 — Handle Overlapping Events

Real calendars contain overlapping or back-to-back events (e.g. a meeting invite accepted twice, or events with a shared boundary). Your implementation should handle these gracefully — a slot should only appear if the entire 30-minute window is free.

No API change; `get_free_slots` should already handle this correctly.

### Example

```python
events = [
    {"start": "2024-06-10T10:00:00", "end": "2024-06-10T11:00:00"},
    {"start": "2024-06-10T10:30:00", "end": "2024-06-10T11:30:00"},  # overlaps
]

slots = get_free_slots(events, date(2024, 6, 10))
# 10:00–11:30 is fully blocked; neither 10:00 nor 10:30 nor 11:00 slot appears
```

---

## Part 3 — Multi-Day Availability

Implement `get_availability` that returns free slots across a range of dates.

```python
from datetime import date, time

def get_availability(
    events: list[dict],
    start_day: date,
    end_day: date,
    work_start: time = time(9, 0),
    work_end: time   = time(17, 0),
) -> dict[str, list[dict]]:
    """
    Return a dict mapping each date string (YYYY-MM-DD) between
    `start_day` and `end_day` (inclusive) to its list of free slots.

    Days with no free slots should still appear as empty lists.
    """
    pass
```

### Example

```python
events = [
    {"start": "2024-06-10T09:00:00", "end": "2024-06-10T17:00:00"},  # fully booked
    {"start": "2024-06-11T14:00:00", "end": "2024-06-11T15:00:00"},
]

availability = get_availability(events, date(2024, 6, 10), date(2024, 6, 11))
# {
#   "2024-06-10": [],
#   "2024-06-11": [
#       {"start": "2024-06-11T09:00:00", "end": "2024-06-11T09:30:00"},
#       ...
#       {"start": "2024-06-11T13:30:00", "end": "2024-06-11T14:00:00"},
#       {"start": "2024-06-11T15:00:00", "end": "2024-06-11T15:30:00"},
#       ...
#   ]
# }
```
