from datetime import datetime

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


class ContactMergeCreate(BaseModel):
    canonical_contact_id: str
    duplicate_contact_id: str

    confirmed: bool = False

    reason: str | None = None


class ContactMergeResponse(BaseModel):
    id: str

    canonical_contact_id: str
    duplicate_contact_id: str

    reason: str | None

    copied_fields: list[str]

    transferred_relationships: int
    transferred_leads: int
    transferred_opportunities: int

    created_at: datetime
