from types import (
    SimpleNamespace,
)
from unittest.mock import (
    MagicMock,
    patch,
)

from app.services.handoff_event_service import (
    handoff_audit_snapshot,
    record_handoff_governance,
)


def fake_objects(
    *,
    status: str,
):
    opportunity = SimpleNamespace(
        id="opp-1",
        name=(
            "Horizon Consulting SA "
            "· Couverture entreprise"
        ),
        primary_contact_id="contact-1",
        organization_id="org-1",
    )

    target_unit = SimpleNamespace(
        id="unit-assurance",
        name="Assurance",
        code="ASSURANCE",
    )

    handoff = SimpleNamespace(
        id="handoff-1",
        opportunity_id="opp-1",
        target_unit_id=(
            "unit-assurance"
        ),
        status=status,
        handed_off_at=None,
        accepted_at=None,
        started_at=None,
        completed_at=None,
        notes="Transmission test",
    )

    auth = SimpleNamespace(
        account_type="internal",
        profile=SimpleNamespace(
            id="profile-1",
        ),
        contact=None,
    )

    return (
        opportunity,
        target_unit,
        handoff,
        auth,
    )


def test_handoff_snapshot_contains_target_and_status():
    (
        _,
        target_unit,
        handoff,
        _,
    ) = fake_objects(
        status="completed"
    )

    snapshot = (
        handoff_audit_snapshot(
            handoff,
            target_unit,
        )
    )

    assert (
        snapshot["status"]
        == "completed"
    )

    assert (
        snapshot["target_unit_code"]
        == "ASSURANCE"
    )

    assert (
        snapshot["opportunity_id"]
        == "opp-1"
    )


def test_handoff_created_records_activity_and_audit():
    (
        opportunity,
        target_unit,
        handoff,
        auth,
    ) = fake_objects(
        status="handed_off"
    )

    db = MagicMock()

    with (
        patch(
            "app.services."
            "handoff_event_service."
            "record_activity"
        ) as activity_mock,
        patch(
            "app.services."
            "handoff_event_service."
            "record_audit_event"
        ) as audit_mock,
    ):
        record_handoff_governance(
            db,
            auth=auth,
            opportunity=opportunity,
            handoff=handoff,
            target_unit=target_unit,
            effective_context=(
                "commercial"
            ),
            previous_status=None,
        )

    activity_kwargs = (
        activity_mock.call_args.kwargs
    )

    audit_kwargs = (
        audit_mock.call_args.kwargs
    )

    assert (
        activity_kwargs["event_type"]
        == "handoff.created"
    )

    assert (
        activity_kwargs["contact_id"]
        == "contact-1"
    )

    assert (
        activity_kwargs["organization_id"]
        == "org-1"
    )

    assert (
        activity_kwargs["context"]
        == "commercial"
    )

    assert (
        audit_kwargs["action_type"]
        == "handoff.created"
    )

    assert (
        audit_kwargs["before_data"]
        is None
    )

    assert (
        audit_kwargs["after_data"][
            "status"
        ]
        == "handed_off"
    )


def test_handoff_completed_records_before_after():
    (
        opportunity,
        target_unit,
        handoff,
        auth,
    ) = fake_objects(
        status="completed"
    )

    db = MagicMock()

    with (
        patch(
            "app.services."
            "handoff_event_service."
            "record_activity"
        ) as activity_mock,
        patch(
            "app.services."
            "handoff_event_service."
            "record_audit_event"
        ) as audit_mock,
    ):
        record_handoff_governance(
            db,
            auth=auth,
            opportunity=opportunity,
            handoff=handoff,
            target_unit=target_unit,
            effective_context=(
                "assurance"
            ),
            previous_status=(
                "in_progress"
            ),
        )

    activity_kwargs = (
        activity_mock.call_args.kwargs
    )

    audit_kwargs = (
        audit_mock.call_args.kwargs
    )

    assert (
        activity_kwargs["event_type"]
        == "handoff.completed"
    )

    assert (
        activity_kwargs["context"]
        == "assurance"
    )

    assert (
        audit_kwargs["action_type"]
        == "handoff.completed"
    )

    assert (
        audit_kwargs["before_data"][
            "status"
        ]
        == "in_progress"
    )

    assert (
        audit_kwargs["after_data"][
            "status"
        ]
        == "completed"
    )

    assert (
        audit_kwargs[
            "source_entity_type"
        ]
        == "opportunity"
    )

    assert (
        audit_kwargs[
            "source_entity_id"
        ]
        == "opp-1"
    )
