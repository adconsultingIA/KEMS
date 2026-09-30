from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrganizationCreate(BaseModel):
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

    source_type: str = "manual"
    source_reference: str | None = None

    notes: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None

    legal_name: str | None = None
    organization_type: str | None = None
    industry: str | None = None

    website: str | None = None
    email: str | None = None
    phone: str | None = None

    country: str | None = None
    city: str | None = None
    address: str | None = None

    source_type: str | None = None
    source_reference: str | None = None

    verification_status: str | None = None
    is_verified: bool | None = None
    is_active: bool | None = None

    notes: str | None = None


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: str

    name: str
    legal_name: str | None

    organization_type: str
    industry: str | None

    website: str | None
    domain: str | None

    email: str | None
    phone: str | None

    country: str | None
    city: str | None
    address: str | None

    source_type: str
    source_reference: str | None

    verification_status: str
    is_verified: bool
    is_active: bool

    notes: str | None

    collected_at: datetime | None
    last_verified_at: datetime | None

    created_at: datetime
    updated_at: datetime
