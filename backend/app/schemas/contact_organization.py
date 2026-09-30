from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ContactOrganizationCreate(BaseModel):
    contact_id: str
    organization_id: str

    relationship_type: str = "employee"

    job_title: str | None = None
    relationship_role: str | None = None

    is_primary: bool = False

    started_at: date | None = None


class ContactOrganizationUpdate(BaseModel):
    relationship_type: str | None = None

    job_title: str | None = None
    relationship_role: str | None = None

    is_primary: bool | None = None
    is_active: bool | None = None

    started_at: date | None = None
    ended_at: date | None = None


class ContactOrganizationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: str

    contact_id: str
    organization_id: str

    relationship_type: str

    job_title: str | None
    relationship_role: str | None

    is_primary: bool
    is_active: bool

    started_at: date | None
    ended_at: date | None

    created_at: datetime
    updated_at: datetime


class ContactOrganizationEnd(BaseModel):
    ended_at: date | None = None
