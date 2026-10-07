import pytest
from solution import flatten


def test_flat_dict():
    assert flatten({"name": "Alice"}) == {"name": "Alice"}


def test_one_level_nested():
    result = flatten({"location": {"city": "SF", "zip": "94105"}})
    assert result == {"location.city": "SF", "location.zip": "94105"}


def test_example_case():
    input = {
        "name": "Alice",
        "location": {"city": "San Francisco", "zip": "94105"},
        "experience": {"current": {"title": "Engineer", "years": 3}},
    }
    assert flatten(input) == {
        "name": "Alice",
        "location.city": "San Francisco",
        "location.zip": "94105",
        "experience.current.title": "Engineer",
        "experience.current.years": 3,
    }


def test_empty_dict():
    assert flatten({}) == {}


def test_empty_nested_dict_omitted():
    assert flatten({"a": {}, "b": 1}) == {"b": 1}


def test_integer_values():
    assert flatten({"stats": {"age": 30, "score": 95}}) == {
        "stats.age": 30,
        "stats.score": 95,
    }


def test_deeply_nested():
    input = {"a": {"b": {"c": {"d": "deep"}}}}
    assert flatten(input) == {"a.b.c.d": "deep"}


def test_mixed_depth():
    input = {"x": 1, "y": {"z": 2}}
    assert flatten(input) == {"x": 1, "y.z": 2}
