# Feature Flag Service

Design a feature flag service that supports weighted variants, consistent user assignment, and historical lookups.

## Setup

A feature flag configuration is a dict mapping feature names to a list of `(variant, weight)` tuples. Weights are floats that sum to 1.0.

```python
flags = {
    "checkout_redesign": [("control", 0.5), ("variant_a", 0.25), ("variant_b", 0.25)],
    "dark_mode":         [("off", 1.0), ("on", 0.0)],
}
```

---

## Part 1 — Weighted Assignment

Implement `get_variant(feature, flags)` that returns a variant for the given feature sampled according to its weights.

- A variant with weight `0.5` should be returned ~50% of the time across many calls.
- Raise `KeyError` if the feature does not exist in `flags`.

```python
def get_variant(feature: str, flags: dict) -> str:
    pass
```

---

## Part 2 — Consistent User Assignment

Implement `get_variant_for_user(user_id, feature, flags)` that returns a **stable** variant for a given `(user_id, feature)` pair.

- The same `user_id` + `feature` combination must always return the same variant.
- Different users should be distributed across variants according to the weights.
- Do **not** store any state — derive the assignment deterministically from the inputs.

```python
def get_variant_for_user(user_id: str, feature: str, flags: dict) -> str:
    pass
```

---

## Part 3 — Change Logging and Historical Lookup

Implement a `FeatureFlagService` class that tracks flag configuration changes over time and can answer what variant a user would have seen at any past timestamp.

```python
class FeatureFlagService:
    def __init__(self, initial_flags: dict, timestamp: float):
        pass

    def update_flags(self, new_flags: dict, timestamp: float) -> None:
        """Record a new version of the flag configuration at the given timestamp."""
        pass

    def get_variant_at(self, user_id: str, feature: str, timestamp: float) -> str:
        """Return the variant user_id would have seen for feature at the given timestamp."""
        pass
```

### Constraints
- `timestamp` values are Unix epoch floats (e.g. `time.time()`).
- `get_variant_at` should use the most recent configuration that was active **at or before** `timestamp`.
- Raise `KeyError` if the feature did not exist in the configuration active at that timestamp.
- Raise `ValueError` if `timestamp` is before the service was initialized.

---

## Examples

```python
import time

flags_v1 = {"button_color": [("blue", 0.5), ("green", 0.5)]}
flags_v2 = {"button_color": [("blue", 0.0), ("green", 1.0)]}

t0 = 1000.0
t1 = 2000.0

svc = FeatureFlagService(flags_v1, t0)
svc.update_flags(flags_v2, t1)

# At t=1500 (between t0 and t1), flags_v1 was active
variant_old = svc.get_variant_at("user_123", "button_color", 1500.0)
# variant_old is deterministic for "user_123" under flags_v1

# At t=2500 (after t1), flags_v2 is active — green weight is 1.0
variant_new = svc.get_variant_at("user_123", "button_color", 2500.0)
assert variant_new == "green"
```
