# 001 - Meeting Scheduler

## Problem

You're building a feature for a recruiting platform. Given a list of busy time blocks for an interviewer and a candidate, write a function that returns all available meeting slots of a given duration.

## Signature

```python
def find_available_slots(
    interviewer_busy: list[tuple[int, int]],
    candidate_busy: list[tuple[int, int]],
    day_start: int,
    day_end: int,
    duration: int,
) -> list[tuple[int, int]]:
```

## Example

```
interviewer_busy = [(9, 10), (12, 13), (16, 18)]
candidate_busy   = [(10, 11), (13, 15)]
day_start = 9
day_end   = 18
duration  = 1

find_available_slots(...) -> [(11, 12), (15, 16)]
```

## Constraints

- Times are integers (hours)
- Inputs are **not** necessarily sorted
- A slot is valid only if its full duration fits within `[day_start, day_end]`
- Busy blocks may overlap between the two participants
