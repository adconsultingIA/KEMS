from app.models.audit_event import (
    AuditEvent,
)
from app.schemas.auth import (
    AuthContextResponse,
    AuthProfileResponse,
    AuthRoleResponse,
    AuthUnitResponse,
)
from app.services.audit_service import (
    record_audit_event,
)


def build_direction_auth():
    return AuthContextResponse(
        account_id="account-direction",
        account_type="internal",
        email="santos@kems.test",
        projection="direction",
        profile=AuthProfileResponse(
            id="profile-direction",
            full_name="Euloge Santos",
            email="santos@kems.test",
        ),
        role=AuthRoleResponse(
            id="role-direction",
            code="manager",
            name="Manager",
        ),
        primary_unit=AuthUnitResponse(
            id="unit-direction",
            code="DIRECTION",
            name="Direction",
        ),
        memberships=[],
    )


def test_record_audit_event_preserves_identity_and_context(
    db_session,
):
    auth = build_direction_auth()

    event = record_audit_event(
        db_session,
        auth=auth,
        effective_context="assurance",
        action_type="action.reassigned",
        entity_type="action",
        entity_id="action-001",
        action_id=None,
        description=(
            "Réassignation effectuée "
            "depuis le contexte Assurance."
        ),
        source_type="action_center",
        before_data={
            "owner_profile_id":
                "profile-old",
        },
        after_data={
            "owner_profile_id":
                "profile-new",
        },
    )

    db_session.commit()

    persisted = db_session.get(
        AuditEvent,
        event.id,
    )

    assert persisted is not None

    # Identity stays Direction.
    assert (
        persisted.actor_name
        == "Euloge Santos"
    )

    assert (
        persisted.actor_unit_name
        == "Direction"
    )

    assert (
        persisted.actor_role_name
        == "Manager"
    )

    # But execution happened in Assurance.
    assert (
        persisted.effective_context
        == "assurance"
    )

    assert (
        persisted.action_type
        == "action.reassigned"
    )

    assert (
        persisted.entity_type
        == "action"
    )

    assert (
        persisted.before_data[
            "owner_profile_id"
        ]
        == "profile-old"
    )

    assert (
        persisted.after_data[
            "owner_profile_id"
        ]
        == "profile-new"
    )


def test_audit_can_record_client_actor(
    db_session,
):
    auth = AuthContextResponse(
        account_id="account-client",
        account_type="client",
        email="client@example.com",
        projection="client",
        profile=None,
        contact={
            "id": "contact-client",
            "first_name": "Jean",
            "last_name": "Dupont",
            "email": "client@example.com",
        },
        role=None,
        primary_unit=None,
        memberships=[],
    )

    event = record_audit_event(
        db_session,
        auth=auth,
        effective_context="client",
        action_type="advice.request",
        entity_type="contact",
        entity_id=None,
        source_type="client_360",
    )

    db_session.commit()

    persisted = db_session.get(
        AuditEvent,
        event.id,
    )

    assert persisted is not None

    assert (
        persisted.actor_type
        == "client"
    )

    assert (
        persisted.actor_name
        == "Jean Dupont"
    )

    assert (
        persisted.effective_context
        == "client"
    )
