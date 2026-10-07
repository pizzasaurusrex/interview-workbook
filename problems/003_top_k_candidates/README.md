# 003 - Top K Most Active Candidates

## Problem

You're building a reporting feature. Given a list of events (each event is a dict with a candidate ID and an action), return the top K candidates by total event count.

## Signature

```python
def top_k_candidates(events: list[dict], k: int) -> list[str]:
```

## Example

```python
events = [
    {"candidate_id": "a1", "action": "email_opened"},
    {"candidate_id": "b2", "action": "link_clicked"},
    {"candidate_id": "a1", "action": "replied"},
    {"candidate_id": "c3", "action": "email_opened"},
    {"candidate_id": "b2", "action": "email_opened"},
    {"candidate_id": "a1", "action": "link_clicked"},
]

top_k_candidates(events, k=2)
# -> ["a1", "b2"]
```

## Constraints

- Ties can be broken arbitrarily
- Order in the output doesn't matter
- `k` will never exceed the number of unique candidates
- Events list will not be empty
