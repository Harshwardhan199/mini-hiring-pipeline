from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CandidateCreate(BaseModel):
    name: str
    email: str


class CandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    current_stage: str
    created_at: datetime


class StageEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_stage: str | None
    to_stage: str
    occurred_at: datetime


class CandidateHistoryResponse(CandidateResponse):
    current_stage_since: datetime
    history: list[StageEventResponse]


class StageTransitionRequest(BaseModel):
    target_stage: str