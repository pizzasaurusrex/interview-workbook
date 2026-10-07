from models import Candidate


def format_name(candidate: Candidate) -> str:
    return candidate.name.strip().title()


def count_events_by_type(candidate: Candidate, event_type: str) -> int:
    count = 0
    for event in candidate.events:
        if event.type == event_type:
            count += 1
    return count
