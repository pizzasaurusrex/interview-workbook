import pytest
from collections import Counter
from solution import get_variant, get_variant_for_user, FeatureFlagService

FLAGS = {
    "checkout_redesign": [("control", 0.5), ("variant_a", 0.25), ("variant_b", 0.25)],
    "dark_mode": [("off", 1.0), ("on", 0.0)],
    "single": [("only", 1.0)],
}


# ---------------------------------------------------------------------------
# Part 1 — Weighted Assignment
# ---------------------------------------------------------------------------

class TestGetVariant:
    def test_returns_valid_variant(self):
        variant = get_variant("checkout_redesign", FLAGS)
        assert variant in ("control", "variant_a", "variant_b")

    def test_weight_zero_variant_never_returned(self):
        results = {get_variant("dark_mode", FLAGS) for _ in range(200)}
        assert "on" not in results
        assert results == {"off"}

    def test_weight_one_always_returned(self):
        results = {get_variant("single", FLAGS) for _ in range(50)}
        assert results == {"only"}

    def test_approximate_distribution(self):
        n = 10_000
        counts = Counter(get_variant("checkout_redesign", FLAGS) for _ in range(n))
        assert 0.44 < counts["control"] / n < 0.56
        assert 0.19 < counts["variant_a"] / n < 0.31
        assert 0.19 < counts["variant_b"] / n < 0.31

    def test_unknown_feature_raises_key_error(self):
        with pytest.raises(KeyError):
            get_variant("nonexistent", FLAGS)


# ---------------------------------------------------------------------------
# Part 2 — Consistent User Assignment
# ---------------------------------------------------------------------------

class TestGetVariantForUser:
    def test_same_user_same_feature_is_stable(self):
        results = [get_variant_for_user("alice", "checkout_redesign", FLAGS) for _ in range(20)]
        assert len(set(results)) == 1
        assert results[0] in ("control", "variant_a", "variant_b")

    def test_different_features_may_differ(self):
        # Not guaranteed to differ, but with weight=1 dark_mode must be "off"
        assert get_variant_for_user("alice", "dark_mode", FLAGS) == "off"

    def test_returns_valid_variant(self):
        for user in ["alice", "bob", "carol", "dave"]:
            v = get_variant_for_user(user, "checkout_redesign", FLAGS)
            assert v in ("control", "variant_a", "variant_b")

    def test_approximate_distribution_across_users(self):
        n = 2_000
        users = [f"user_{i}" for i in range(n)]
        counts = Counter(get_variant_for_user(u, "checkout_redesign", FLAGS) for u in users)
        assert 0.44 < counts["control"] / n < 0.56
        assert 0.19 < counts["variant_a"] / n < 0.31
        assert 0.19 < counts["variant_b"] / n < 0.31

    def test_unknown_feature_raises_key_error(self):
        with pytest.raises(KeyError):
            get_variant_for_user("alice", "nonexistent", FLAGS)

    def test_no_mutable_state_required(self):
        flags_copy = dict(FLAGS)
        v1 = get_variant_for_user("alice", "checkout_redesign", flags_copy)
        v2 = get_variant_for_user("alice", "checkout_redesign", flags_copy)
        assert v1 == v2
        assert v1 in ("control", "variant_a", "variant_b")


# ---------------------------------------------------------------------------
# Part 3 — Change Logging and Historical Lookup
# ---------------------------------------------------------------------------

FLAGS_V1 = {"button_color": [("blue", 0.5), ("green", 0.5)]}
FLAGS_V2 = {"button_color": [("blue", 0.0), ("green", 1.0)], "new_feature": [("on", 1.0)]}

T0 = 1000.0
T1 = 2000.0
T2 = 3000.0


class TestFeatureFlagService:
    def setup_method(self):
        self.svc = FeatureFlagService(FLAGS_V1, T0)
        self.svc.update_flags(FLAGS_V2, T1)

    # --- basic lookups ---

    def test_lookup_uses_flags_v2_after_update(self):
        variant = self.svc.get_variant_at("user_1", "button_color", T2)
        assert variant == "green"  # weight=1.0 in v2

    def test_lookup_uses_flags_v1_before_update(self):
        variant = self.svc.get_variant_at("user_1", "button_color", 1500.0)
        assert variant in ("blue", "green")  # valid v1 variants

    def test_lookup_at_exact_update_timestamp_uses_new_flags(self):
        variant = self.svc.get_variant_at("user_1", "button_color", T1)
        assert variant == "green"  # v2 is active at T1

    def test_lookup_at_init_timestamp_uses_initial_flags(self):
        variant = self.svc.get_variant_at("user_1", "button_color", T0)
        assert variant in ("blue", "green")

    # --- consistency ---

    def test_same_user_same_feature_same_time_is_stable(self):
        v1 = self.svc.get_variant_at("alice", "button_color", 1500.0)
        v2 = self.svc.get_variant_at("alice", "button_color", 1500.0)
        assert v1 == v2
        assert v1 in ("blue", "green")

    def test_historical_variant_consistent_with_same_config(self):
        # Two timestamps that fall under v1 should give the same variant for a user
        v_early = self.svc.get_variant_at("alice", "button_color", 1200.0)
        v_later = self.svc.get_variant_at("alice", "button_color", 1800.0)
        assert v_early == v_later
        assert v_early in ("blue", "green")

    # --- feature availability ---

    def test_new_feature_available_after_update(self):
        variant = self.svc.get_variant_at("user_1", "new_feature", T2)
        assert variant == "on"

    def test_new_feature_not_available_before_update(self):
        with pytest.raises(KeyError):
            self.svc.get_variant_at("user_1", "new_feature", 1500.0)

    def test_unknown_feature_raises_key_error(self):
        with pytest.raises(KeyError):
            self.svc.get_variant_at("user_1", "nonexistent", T2)

    # --- error cases ---

    def test_timestamp_before_init_raises_value_error(self):
        with pytest.raises(ValueError):
            self.svc.get_variant_at("user_1", "button_color", T0 - 1)

    # --- multiple updates ---

    def test_three_versions(self):
        flags_v3 = {"button_color": [("red", 1.0)]}
        self.svc.update_flags(flags_v3, T2)

        assert self.svc.get_variant_at("user_1", "button_color", 1500.0) in ("blue", "green")
        assert self.svc.get_variant_at("user_1", "button_color", 2500.0) == "green"
        assert self.svc.get_variant_at("user_1", "button_color", 3500.0) == "red"
