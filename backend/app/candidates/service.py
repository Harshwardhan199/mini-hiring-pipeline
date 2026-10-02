from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.candidates.constants import NEXT_STAGE, TERMINAL_STAGES
from app.candidates.models import Candidate, StageEvent
from app.candidates.schemas import CandidateCreate, CandidateHistoryResponse, StageTransitionRequest


def create_candidate(db: Session, data: CandidateCreate) -> Candidate:
    candidate = Candidate(
        name=data.name,
        email=data.email,
        current_stage="Applied",
    )

    db.add(candidate)
    db.flush()

    event = StageEvent(
        candidate_id=candidate.id,
        from_stage=None,
        to_stage="Applied",
    )

    db.add(event)
    db.commit()
    db.refresh(candidate)

    return candidate


def get_candidates(db: Session) -> list[Candidate]:
    return db.query(Candidate).order_by(Candidate.created_at.desc()).all()


def get_candidate_record(db: Session, candidate_id: int) -> Candidate:
    candidate = db.get(Candidate, candidate_id)

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    return candidate


def get_candidate(db: Session, candidate_id: int) -> CandidateHistoryResponse:
    candidate = get_candidate_record(db, candidate_id)

    history = candidate.stage_events

    if not history:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Candidate has no stage history",
        )

    current_stage_event = history[-1]

    return CandidateHistoryResponse(
        id=candidate.id,
        name=candidate.name,
        email=candidate.email,
        current_stage=candidate.current_stage,
        created_at=candidate.created_at,
        current_stage_since=current_stage_event.occurred_at,
        history=history,
    )


def move_candidate(db: Session, candidate_id: int, data: StageTransitionRequest) -> Candidate:
    candidate = get_candidate_record(db, candidate_id)

    if candidate.current_stage in TERMINAL_STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Candidate is already in terminal stage: {candidate.current_stage}",
        )

    target_stage = data.target_stage
    expected_stage = NEXT_STAGE.get(candidate.current_stage)

    if target_stage != expected_stage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition: {candidate.current_stage} → {target_stage}",
        )

    previous_stage = candidate.current_stage
    candidate.current_stage = target_stage

    event = StageEvent(
        candidate_id=candidate.id,
        from_stage=previous_stage,
        to_stage=target_stage,
    )

    db.add(event)
    db.commit()
    db.refresh(candidate)

    return candidate


def reject_candidate(db: Session, candidate_id: int) -> Candidate:
    candidate = get_candidate_record(db, candidate_id)

    if candidate.current_stage in TERMINAL_STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Candidate is already in terminal stage: {candidate.current_stage}",
        )

    previous_stage = candidate.current_stage
    candidate.current_stage = "Rejected"

    event = StageEvent(
        candidate_id=candidate.id,
        from_stage=previous_stage,
        to_stage="Rejected",
    )

    db.add(event)
    db.commit()
    db.refresh(candidate)

    return candidate