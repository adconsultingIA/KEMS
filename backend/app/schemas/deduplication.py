from pydantic import BaseModel


class DuplicateEntitySummary(BaseModel):
    id: str
    label: str


class DuplicateCandidate(BaseModel):
    score: int
    confidence: str
    reasons: list[str]

    left: DuplicateEntitySummary
    right: DuplicateEntitySummary


class DuplicateCandidateResponse(BaseModel):
    total: int
    candidates: list[DuplicateCandidate]
