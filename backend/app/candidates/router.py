from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.candidates.schemas import (
    CandidateCreate,
    CandidateHistoryResponse,
    CandidateResponse,
    StageTransitionRequest,
)
from app.candidates.service import (
    create_candidate,
    get_candidate,
    get_candidates,
    move_candidate,
    reject_candidate,
)
from app.database.connection import get_db


router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.post("", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def add_candidate(data: CandidateCreate, db: Session = Depends(get_db)):
    return create_candidate(db, data)


@router.get("", response_model=list[CandidateResponse])
def list_candidates(db: Session = Depends(get_db)):
    return get_candidates(db)


@router.get("/{candidate_id}", response_model=CandidateHistoryResponse)
def candidate_details(candidate_id: int, db: Session = Depends(get_db)):
    return get_candidate(db, candidate_id)


@router.post("/{candidate_id}/transition", response_model=CandidateResponse)
def transition_candidate(
    candidate_id: int,
    data: StageTransitionRequest,
    db: Session = Depends(get_db),
):
    return move_candidate(db, candidate_id, data)


@router.post("/{candidate_id}/reject", response_model=CandidateResponse)
def reject(candidate_id: int, db: Session = Depends(get_db)):
    return reject_candidate(db, candidate_id)