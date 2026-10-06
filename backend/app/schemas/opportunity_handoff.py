from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    field_validator,
)


HANDOFF_STATUSES = {
    "handed_off",
    "accepted",
    "in_progress",
    "completed",
}


class OpportunityHandoffCreate(
    BaseModel
):
    target_unit_id: str
    notes: str | None = None

    @field_validator(
        "target_unit_id"
    )
    @classmethod
    def validate_target_unit_id(
        cls,
        value: str,
    ):
        normalized = (
            value.strip()
        )

        if not normalized:
            raise ValueError(
                "Le métier cible est obligatoire."
            )

        return normalized

    @field_validator(
        "notes",
        mode="before",
    )
    @classmethod
    def normalize_notes(
        cls,
        value,
    ):
        if value is None:
            return None

        normalized = (
            str(value).strip()
        )

        return (
            normalized
            or None
        )


class OpportunityHandoffStatusUpdate(
    BaseModel
):
    status: str

    @field_validator(
        "status"
    )
    @classmethod
    def validate_status(
        cls,
        value: str,
    ):
        normalized = (
            value.strip().lower()
        )

        if (
            normalized
            not in HANDOFF_STATUSES
        ):
            raise ValueError(
                "Statut de handoff invalide."
            )

        return normalized


class HandoffTargetUnitResponse(
    BaseModel
):
    id: str
    name: str
    code: str
    unit_type: str


class OpportunityHandoffResponse(
    BaseModel
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: str

    opportunity_id: str
    target_unit_id: str

    status: str

    handed_off_at: datetime
    handed_off_by_profile_id: str | None

    accepted_at: datetime | None
    accepted_by_profile_id: str | None

    started_at: datetime | None
    completed_at: datetime | None

    notes: str | None

    created_at: datetime
    updated_at: datetime


class OpportunityHandoffDetailResponse(
    OpportunityHandoffResponse
):
    target_unit: HandoffTargetUnitResponse


class HandoffTargetListResponse(
    BaseModel
):
    items: list[
        HandoffTargetUnitResponse
    ]
