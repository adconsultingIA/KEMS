from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


ALLOWED_LEAD_TYPES = {
    "b2c",
    "b2b",
}


class LeadCreate(BaseModel):
    # --------------------------------------------------------
    # Autonomous prospect identity
    # --------------------------------------------------------

    lead_type: str = "b2c"

    first_name: str | None = None
    last_name: str | None = None

    company_name: str | None = None

    email: str | None = None
    phone: str | None = None

    city: str | None = None
    country: str | None = None

    # --------------------------------------------------------
    # Future Core links
    # --------------------------------------------------------

    organization_id: str | None = None
    contact_id: str | None = None

    # --------------------------------------------------------
    # Ownership
    # --------------------------------------------------------

    owner_id: str | None = None

    # --------------------------------------------------------
    # Acquisition source
    # --------------------------------------------------------

    source: str = "manual"
    source_detail: str | None = None

    # --------------------------------------------------------
    # Qualification
    # --------------------------------------------------------

    need_summary: str | None = None

    estimated_value: float | None = None

    currency: str = "CHF"

    urgency: str = "medium"

    fit_score: int = Field(
        default=0,
        ge=0,
        le=25,
    )

    intent_score: int = Field(
        default=0,
        ge=0,
        le=25,
    )

    engagement_score: int = Field(
        default=0,
        ge=0,
        le=25,
    )

    potential_score: int = Field(
        default=0,
        ge=0,
        le=25,
    )

    qualification_notes: str | None = None

    # --------------------------------------------------------
    # Normalization
    # --------------------------------------------------------

    @field_validator(
        "lead_type"
    )
    @classmethod
    def validate_lead_type(
        cls,
        value: str,
    ):
        normalized = (
            value.strip().lower()
        )

        if (
            normalized
            not in ALLOWED_LEAD_TYPES
        ):
            raise ValueError(
                "lead_type doit être "
                "'b2c' ou 'b2b'."
            )

        return normalized

    @field_validator(
        "first_name",
        "last_name",
        "company_name",
        "email",
        "phone",
        "city",
        "country",
        "source_detail",
        "need_summary",
        "qualification_notes",
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
        "email"
    )
    @classmethod
    def normalize_email(
        cls,
        value: str | None,
    ):
        if not value:
            return None

        return value.lower()

    @field_validator(
        "source",
        "currency",
        "urgency",
    )
    @classmethod
    def normalize_required_text(
        cls,
        value: str,
    ):
        normalized = (
            value.strip()
        )

        if not normalized:
            raise ValueError(
                "La valeur ne peut "
                "pas être vide."
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
        return value.upper()

    @model_validator(
        mode="after"
    )
    def validate_identity(
        self,
    ):
        if (
            self.lead_type
            == "b2c"
        ):
            if not (
                self.first_name
                or self.last_name
                or self.email
                or self.phone
            ):
                raise ValueError(
                    "Un lead B2C doit avoir "
                    "au moins un nom, email "
                    "ou téléphone."
                )

        if (
            self.lead_type
            == "b2b"
        ):
            if not (
                self.company_name
                or self.email
                or self.phone
            ):
                raise ValueError(
                    "Un lead B2B doit avoir "
                    "au moins une entreprise, "
                    "un email ou un téléphone."
                )

        return self


class LeadResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: str

    lead_type: str

    first_name: str | None
    last_name: str | None

    company_name: str | None

    email: str | None
    phone: str | None

    city: str | None
    country: str | None

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

    contacted_at: datetime | None
    qualification_started_at: datetime | None
    qualified_at: datetime | None
    disqualified_at: datetime | None
    core_converted_at: datetime | None

    disqualified_reason: str | None

    created_at: datetime
    updated_at: datetime


class LeadQualificationUpdate(BaseModel):
    need_summary: str | None = None

    estimated_value: float | None = Field(
        default=None,
        ge=0,
    )

    currency: str | None = None
    urgency: str | None = None

    fit_score: int | None = Field(
        default=None,
        ge=0,
        le=25,
    )

    intent_score: int | None = Field(
        default=None,
        ge=0,
        le=25,
    )

    engagement_score: int | None = Field(
        default=None,
        ge=0,
        le=25,
    )

    potential_score: int | None = Field(
        default=None,
        ge=0,
        le=25,
    )

    qualification_notes: str | None = None

    @field_validator(
        "need_summary",
        "currency",
        "urgency",
        "qualification_notes",
        mode="before",
    )
    @classmethod
    def normalize_optional_qualification_text(
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

        return value.upper()


class LeadQualify(
    LeadQualificationUpdate
):
    pass


class LeadDisqualify(BaseModel):
    reason: str = Field(
        min_length=3,
        max_length=1000,
    )

    @field_validator(
        "reason"
    )
    @classmethod
    def normalize_reason(
        cls,
        value: str,
    ):
        normalized = (
            value.strip()
        )

        if (
            len(normalized)
            < 3
        ):
            raise ValueError(
                "Le motif de "
                "disqualification "
                "est obligatoire."
            )

        return normalized



class LeadCoreEntitySummary(BaseModel):
    id: str
    entity_type: str
    label: str


class LeadCoreConversionResponse(BaseModel):
    lead: LeadResponse

    contact: LeadCoreEntitySummary | None = None

    organization: LeadCoreEntitySummary | None = None

    contact_created: bool
    organization_created: bool
