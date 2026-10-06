from datetime import (
    date,
    datetime,
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


ALLOWED_STAGES = {
    "qualified",
    "proposal",
    "negotiation",
    "won",
    "lost",
}


class OpportunityCreate(BaseModel):
    lead_id: str

    name: str
    description: str | None = None

    estimated_value: float | None = Field(
        default=None,
        ge=0,
    )

    currency: str = "CHF"

    probability: int = Field(
        default=25,
        ge=0,
        le=100,
    )

    expected_close_date: date | None = None

    @field_validator(
        "name"
    )
    @classmethod
    def normalize_name(
        cls,
        value: str,
    ):
        normalized = (
            value.strip()
        )

        if not normalized:
            raise ValueError(
                "Le nom de l'opportunité "
                "est obligatoire."
            )

        return normalized

    @field_validator(
        "currency"
    )
    @classmethod
    def normalize_currency(
        cls,
        value: str,
    ):
        normalized = (
            value.strip().upper()
        )

        if not normalized:
            raise ValueError(
                "La devise est obligatoire."
            )

        return normalized


class OpportunityUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

    estimated_value: float | None = Field(
        default=None,
        ge=0,
    )

    currency: str | None = None

    probability: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    expected_close_date: date | None = None

    owner_id: str | None = None

    @field_validator(
        "name",
        "description",
        mode="before",
    )
    @classmethod
    def normalize_optional_text(
        cls,
        value,
    ):
        if (
            value is None
        ):
            return None

        if (
            isinstance(
                value,
                str,
            )
        ):
            normalized = (
                value.strip()
            )

            return (
                normalized
                or None
            )

        return value

    @field_validator(
        "currency"
    )
    @classmethod
    def normalize_optional_currency(
        cls,
        value: str | None,
    ):
        if not value:
            return None

        return value.strip().upper()


class OpportunityStageUpdate(BaseModel):
    stage: str

    lost_reason: str | None = None

    @field_validator(
        "stage"
    )
    @classmethod
    def validate_stage(
        cls,
        value: str,
    ):
        normalized = (
            value.strip().lower()
        )

        if (
            normalized
            not in ALLOWED_STAGES
        ):
            raise ValueError(
                "Stage opportunité invalide."
            )

        return normalized

    @field_validator(
        "lost_reason",
        mode="before",
    )
    @classmethod
    def normalize_lost_reason(
        cls,
        value,
    ):
        if (
            value is None
        ):
            return None

        normalized = (
            value.strip()
        )

        return (
            normalized
            or None
        )


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
