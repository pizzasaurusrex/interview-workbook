# 002 - Flatten a Nested Dictionary

## Problem

You're building a data pipeline for a recruiting platform. Candidate profiles come in as deeply nested JSON objects. Flatten them into a single-level dictionary where each key represents the full dot-separated path to its value.

## Signature

```python
def flatten(d: dict, prefix: str = "") -> dict:
```

## Example

```python
input = {
    "name": "Alice",
    "location": {
        "city": "San Francisco",
        "zip": "94105"
    },
    "experience": {
        "current": {
            "title": "Engineer",
            "years": 3
        }
    }
}

flatten(input)
# -> {
#     "name": "Alice",
#     "location.city": "San Francisco",
#     "location.zip": "94105",
#     "experience.current.title": "Engineer",
#     "experience.current.years": 3
# }
```

## Constraints

- Values are always `str`, `int`, or `dict` — no lists
- Keys never contain dots
- Empty dicts should be omitted from the output
- Input dict is never `None`
