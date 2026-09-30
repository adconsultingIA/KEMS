from datetime import datetime

from pydantic import BaseModel


class ContactIngestionCreate(BaseModel):
    first_name: str
    last_name: str

    job_title: str | None = None

    email: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None

    decision_role: str = "unknown"

    organization_id: str | None = None

    source_type: str
    source_reference: str | None = None

    notes: str | None = None


class OrganizationIngestionCreate(BaseModel):
    name: str

    legal_name: str | None = None
    organization_type: str = "company"
    industry: str | None = None

    website: str | None = None
    email: str | None = None
    phone: str | None = None

    country: str | None = None
    city: str | None = None
    address: str | None = None

    source_type: str
    source_reference: str | None = None

    notes: str | None = None


class IngestionResult(BaseModel):
    ingestion_id: str

    entity_type: str
    status: str

    entity_id: str | None = None
    candidate_entity_id: str | None = None

    match_score: int | None = None
    match_reason: str | None = None


class IngestionRecordResponse(BaseModel):
    id: str

    entity_type: str
    source_type: str
    source_reference: str | None

    status: str

    entity_id: str | None
    candidate_entity_id: str | None

    match_score: int | None
    match_reason: str | None

    error_message: str | None

    created_at: datetime
