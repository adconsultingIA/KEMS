from app.models.opportunity_handoff import (
    OpportunityHandoff,
)
from app.services.opportunity_handoff_service import (
    HANDOFF_TRANSITIONS,
    update_handoff_status,
)


def test_handoff_default_status():
    handoff = OpportunityHandoff(
        opportunity_id="opp-test",
        target_unit_id="unit-test",
    )

    assert (
        handoff.status
        in (
            None,
            "handed_off",
        )
    )


def test_handoff_transition_chain():
    handoff = OpportunityHandoff(
        opportunity_id="opp-test",
        target_unit_id="unit-test",
        status="handed_off",
    )

    update_handoff_status(
        handoff,
        new_status="accepted",
        actor_profile_id="profile-test",
    )

    assert (
        handoff.status
        == "accepted"
    )

    assert (
        handoff.accepted_at
        is not None
    )

    assert (
        handoff.accepted_by_profile_id
        == "profile-test"
    )

    update_handoff_status(
        handoff,
        new_status="in_progress",
    )

    assert (
        handoff.status
        == "in_progress"
    )

    assert (
        handoff.started_at
        is not None
    )

    update_handoff_status(
        handoff,
        new_status="completed",
    )

    assert (
        handoff.status
        == "completed"
    )

    assert (
        handoff.completed_at
        is not None
    )


def test_handoff_transition_map():
    assert HANDOFF_TRANSITIONS == {
        "handed_off": {
            "accepted",
        },
        "accepted": {
            "in_progress",
        },
        "in_progress": {
            "completed",
        },
        "completed": set(),
    }
