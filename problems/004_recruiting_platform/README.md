# 004 - Recruiting Platform

## Codebase

A small recruiting pipeline codebase across four files:

- `models.py` — `Event` and `Candidate` dataclasses
- `pipeline.py` — `Pipeline` class with candidate management
- `utils.py` — helper functions
- `test_recruiting_platform.py` — existing passing tests

## Task

Add a `funnel_report()` method to `Pipeline` that returns a list of `(status, count)` tuples representing how many candidates are at each stage, in stage order.

The defined stage progression is:

```python
["applied", "screening", "interview", "offer", "hired"]
```

### Requirements

- The result must follow that order
- Every stage must appear in the result, even if the count is zero
- Candidates in statuses outside this list (e.g. `"rejected"`) are excluded

### Example

```python
# pipeline has 2 "applied", 1 "screening", 0 others in the funnel
pipeline.funnel_report()
# -> [("applied", 2), ("screening", 1), ("interview", 0), ("offer", 0), ("hired", 0)]
```
