from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.handoffs import (
    can_orchestrate_handoffs,
    can_process_handoff,
    can_read_handoff,
    require_handoff_processing,
)


def membership(
    unit_id: str,
    code: str,
):
    return SimpleNamespace(
        id=f"membership-{unit_id}",
        unit=SimpleNamespace(
            id=unit_id,
            code=code,
            name=code.title(),
        ),
        role=SimpleNamespace(
            id="role-1",
            code="collaborator",
            name="Collaborateur",
        ),
        is_primary=False,
    )


def auth(
    projection: str,
    memberships=None,
):
    return SimpleNamespace(
        account_type="internal",
        projection=projection,
        profile=SimpleNamespace(
            id="profile-1",
        ),
        memberships=(
            memberships
            or []
        ),
    )


def handoff(
    target_unit_id: str,
):
    return SimpleNamespace(
        target_unit_id=(
            target_unit_id
        )
    )


def test_direction_can_orchestrate_read_and_process():
    context = auth(
        "direction"
    )

    item = handoff(
        "assurance"
    )

    assert (
        can_orchestrate_handoffs(
            context
        )
    )

    assert can_read_handoff(
        context,
        item,
    )

    assert can_process_handoff(
        context,
        item,
    )


def test_commercial_can_orchestrate_and_read_all():
    context = auth(
        "commercial",
        [
            membership(
                "commercial",
                "COMMERCIAL",
            ),
        ],
    )

    item = handoff(
        "assurance"
    )

    assert (
        can_orchestrate_handoffs(
            context
        )
    )

    assert can_read_handoff(
        context,
        item,
    )

    assert not can_process_handoff(
        context,
        item,
    )


def test_assurance_only_reads_and_processes_assurance():
    context = auth(
        "assurance",
        [
            membership(
                "assurance",
                "ASSURANCE",
            ),
        ],
    )

    assurance = handoff(
        "assurance"
    )

    technologies = handoff(
        "technologies"
    )

    assert not can_orchestrate_handoffs(
        context
    )

    assert can_read_handoff(
        context,
        assurance,
    )

    assert can_process_handoff(
        context,
        assurance,
    )

    assert not can_read_handoff(
        context,
        technologies,
    )

    assert not can_process_handoff(
        context,
        technologies,
    )


def test_multi_membership_commercial_and_technology():
    context = auth(
        "technologies",
        [
            membership(
                "technologies",
                "TECHNOLOGIES",
            ),
            membership(
                "commercial",
                "COMMERCIAL",
            ),
        ],
    )

    technology_handoff = handoff(
        "technologies"
    )

    assurance_handoff = handoff(
        "assurance"
    )

    assert (
        can_orchestrate_handoffs(
            context
        )
    )

    assert can_read_handoff(
        context,
        assurance_handoff,
    )

    assert can_process_handoff(
        context,
        technology_handoff,
    )

    assert not can_process_handoff(
        context,
        assurance_handoff,
    )


def test_cross_unit_processing_is_forbidden():
    context = auth(
        "assurance",
        [
            membership(
                "assurance",
                "ASSURANCE",
            ),
        ],
    )

    item = handoff(
        "technologies"
    )

    with pytest.raises(
        HTTPException
    ) as error:
        require_handoff_processing(
            context,
            item,
        )

    assert (
        error.value.status_code
        == 403
    )
