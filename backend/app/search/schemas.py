from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


Stage = Literal[
    "Applied",
    "Screening",
    "Interview",
    "Offer",
    "Hired",
    "Rejected",
]

DurationOperator = Literal[
    "gt",
    "gte",
    "lt",
    "lte",
    "eq",
]


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class SearchQuery(BaseModel):
    query_type: Literal["candidate_search", "invalid"]

    name: str | None = None

    current_stage: Stage | None = None

    stage_duration_operator: DurationOperator | None = None
    stage_duration_days: int | None = Field(default=None, ge=0)

    moved_to_stage: Stage | None = None
    moved_since: date | None = None

    reached_stage: Stage | None = None
    not_reached_stage: Stage | None = None

    exclude_rejected: bool = False

    explanation: str | None = None

    @model_validator(mode="after")
    def validate_duration(self):
        has_operator = self.stage_duration_operator is not None
        has_days = self.stage_duration_days is not None

        if has_operator != has_days:
            raise ValueError(
                "stage_duration_operator and stage_duration_days "
                "must be provided together"
            )

        return self


class SearchCandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    current_stage: Stage
    created_at: datetime
    current_stage_since: datetime | None = None
    current_stage_duration_days: int | None = None
    match_score: float


class SearchResponse(BaseModel):
    query: str
    interpreted_query: SearchQuery
    results: list[SearchCandidateResponse]
    total: int