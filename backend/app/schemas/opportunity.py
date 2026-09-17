from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class OpportunityCreate(BaseModel):
    lead_id: str

    name: str
    description: str | None = None

    estimated_value: float | None = None
    currency: str = "CHF"

    probability: int = Field(
        default=0,
        ge=0,
        le=100,
    )

    expected_close_date: date | None = None


class OpportunityResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: str

    lead_id: str
    organization_id: str | None
    primary_contact_id: str | None
    owner_id: str | None

    name: str
    description: str | None

    stage: str

    estimated_value: float | None
    currency: str

    probability: int
    expected_close_date: date | None

    won_at: datetime | None
    lost_at: datetime | None
    lost_reason: str | None

    created_at: datetime
    updated_at: datetime