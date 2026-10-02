from datetime import datetime, time, timezone

from sqlalchemy.orm import Session

from app.candidates.models import Candidate
from app.search.ranking import calculate_name_score
from app.search.schemas import SearchCandidateResponse, SearchQuery


def get_stage_entered_at(candidate: Candidate) -> datetime | None:
    if not candidate.stage_events:
        return None

    return candidate.stage_events[-1].occurred_at


def get_duration_days(start: datetime | None) -> int | None:
    if start is None:
        return None

    now = datetime.now(timezone.utc)

    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)

    duration = now - start

    return max(0, duration.days)


def compare_duration(
    duration_days: int | None,
    operator: str | None,
    target_days: int | None,
) -> bool:
    if duration_days is None or operator is None or target_days is None:
        return True

    if operator == "gt":
        return duration_days > target_days

    if operator == "gte":
        return duration_days >= target_days

    if operator == "lt":
        return duration_days < target_days

    if operator == "lte":
        return duration_days <= target_days

    if operator == "eq":
        return duration_days == target_days

    return False


def has_reached_stage(candidate: Candidate, stage: str) -> bool:
    return any(
        event.to_stage == stage
        for event in candidate.stage_events
    )


def has_moved_to_stage_since(
    candidate: Candidate,
    stage: str,
    since: datetime,
) -> bool:
    if since.tzinfo is None:
        since = since.replace(tzinfo=timezone.utc)

    for event in candidate.stage_events:
        event_time = event.occurred_at

        if event_time.tzinfo is None:
            event_time = event_time.replace(tzinfo=timezone.utc)

        if event.to_stage == stage and event_time >= since:
            return True

    return False


def matches_candidate(
    candidate: Candidate,
    search_query: SearchQuery,
) -> bool:
    if search_query.current_stage:
        if candidate.current_stage != search_query.current_stage:
            return False

    if search_query.exclude_rejected:
        if candidate.current_stage == "Rejected":
            return False

    current_stage_since = get_stage_entered_at(candidate)
    duration_days = get_duration_days(current_stage_since)

    if search_query.stage_duration_operator:
        if not compare_duration(
            duration_days,
            search_query.stage_duration_operator,
            search_query.stage_duration_days,
        ):
            return False

    if search_query.moved_to_stage:
        if not search_query.moved_since:
            return False

        moved_since = datetime.combine(
            search_query.moved_since,
            time.min,
            tzinfo=timezone.utc,
        )

        if not has_moved_to_stage_since(
            candidate,
            search_query.moved_to_stage,
            moved_since,
        ):
            return False

    if search_query.reached_stage:
        if not has_reached_stage(
            candidate,
            search_query.reached_stage,
        ):
            return False

    if search_query.not_reached_stage:
        if has_reached_stage(
            candidate,
            search_query.not_reached_stage,
        ):
            return False

    return True


def search_candidates(
    db: Session,
    search_query: SearchQuery,
) -> list[SearchCandidateResponse]:
    candidates = (
        db.query(Candidate)
        .order_by(Candidate.created_at.desc())
        .all()
    )

    matching_candidates = []

    for candidate in candidates:
        if not matches_candidate(candidate, search_query):
            continue

        name_score = calculate_name_score(
            search_query.name,
            candidate,
        )

        if search_query.name and name_score < 55:
            continue

        current_stage_since = get_stage_entered_at(candidate)
        duration_days = get_duration_days(current_stage_since)

        matching_candidates.append(
            SearchCandidateResponse(
                id=candidate.id,
                name=candidate.name,
                email=candidate.email,
                current_stage=candidate.current_stage,
                created_at=candidate.created_at,
                current_stage_since=current_stage_since,
                current_stage_duration_days=duration_days,
                match_score=round(name_score, 2),
            )
        )

    matching_candidates.sort(
        key=lambda candidate: (
            -candidate.match_score,
            candidate.name.lower(),
        )
    )

    return matching_candidates