from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LeadCreate(BaseModel):
    organization_id: str | None = None
    contact_id: str | None = None
    owner_id: str | None = None

    source: str = "manual"
    source_detail: str | None = None

    need_summary: str | None = None
    estimated_value: float | None = None
    currency: str = "CHF"
    urgency: str = "medium"

    fit_score: int = Field(default=0, ge=0, le=25)
    intent_score: int = Field(default=0, ge=0, le=25)
    engagement_score: int = Field(default=0, ge=0, le=25)
    potential_score: int = Field(default=0, ge=0, le=25)

    qualification_notes: str | None = None


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str

    organization_id: str | None
    contact_id: str | None
    owner_id: str | None

    source: str
    source_detail: str | None

    status: str

    need_summary: str | None
    estimated_value: float | None
    currency: str
    urgency: str

    fit_score: int
    intent_score: int
    engagement_score: int
    potential_score: int

    growth_score: int

    qualification_notes: str | None
    qualified_at: datetime | None
    disqualified_reason: str | None

    created_at: datetime
    updated_at: datetime
    

class LeadQualify(BaseModel):
    qualification_notes: str | None = None