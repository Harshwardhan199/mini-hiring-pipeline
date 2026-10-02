from rapidfuzz.fuzz import ratio

from app.candidates.models import Candidate


def calculate_name_score(query_name: str | None, candidate: Candidate) -> float:
    if not query_name:
        return 100.0

    query_name = query_name.strip().lower()
    candidate_name = candidate.name.strip().lower()

    if query_name == candidate_name:
        return 100.0

    if query_name in candidate_name:
        return 95.0

    return float(ratio(query_name, candidate_name))