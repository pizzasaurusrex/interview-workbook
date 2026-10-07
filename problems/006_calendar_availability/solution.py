from datetime import date, time, datetime, timedelta


def get_free_slots(
    events: list[dict],
    day: date,
    work_start: time = time(9, 0),
    work_end: time = time(17, 0),
) -> list[dict]:
    pass


def get_availability(
    events: list[dict],
    start_day: date,
    end_day: date,
    work_start: time = time(9, 0),
    work_end: time = time(17, 0),
) -> dict[str, list[dict]]:
    pass
