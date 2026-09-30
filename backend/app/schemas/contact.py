from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ContactCreate(BaseModel):
    organization_id: str | None = None

    first_name: str
    last_name: str

    job_title: str | None = None

    email: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None

    decision_role: str = "unknown"

    source_type: str = "manual"
    source_reference: str | None = None

    notes: str | None = None


class ContactUpdate(BaseModel):
    organization_id: str | None = None

    first_name: str | None = None
    last_name: str | None = None

    job_title: str | None = None

    email: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None

    decision_role: str | None = None

    source_type: str | None = None
    source_reference: str | None = None

    verification_status: str | None = None
    is_verified: bool | None = None
    is_active: bool | None = None

    notes: str | None = None


class ContactResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: str
    organization_id: str | None
    merged_into_contact_id: str | None

    first_name: str
    last_name: str

    job_title: str | None

    email: str | None
    phone: str | None
    linkedin_url: str | None

    decision_role: str

    source_type: str
    source_reference: str | None

    verification_status: str

    is_primary: bool
    is_verified: bool
    is_active: bool

    notes: str | None

    collected_at: datetime | None
    last_verified_at: datetime | None

    created_at: datetime
    updated_at: datetime
