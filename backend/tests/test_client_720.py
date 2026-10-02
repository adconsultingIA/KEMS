from app.models.auth_account import (
    AuthAccount,
)
from app.models.contact import Contact
from app.models.contact_organization import (
    ContactOrganization,
)
from app.models.organization import Organization
from app.models.organizational_unit import (
    OrganizationalUnit,
)
from app.models.profile import Profile
from app.models.role import Role
from app.models.user_membership import (
    UserMembership,
)
from app.services.auth_service import (
    hash_password,
)


def create_internal_token(
    client,
    db_session,
):
    assurance = OrganizationalUnit(
        name="Assurance",
        code="ASSURANCE",
        unit_type="business_unit",
    )

    collaborator = Role(
        code="collaborator",
        name="Collaborateur",
        is_system=True,
    )

    profile = Profile(
        full_name="Naomie Nassara",
        email="naomie@kems.test",
        role="assurance",
    )

    db_session.add_all(
        [
            assurance,
            collaborator,
            profile,
        ]
    )
    db_session.flush()

    membership = UserMembership(
        user_id=profile.id,
        unit_id=assurance.id,
        role_id=collaborator.id,
        is_primary=True,
    )

    account = AuthAccount(
        account_type="internal",
        profile_id=profile.id,
        email="naomie@kems.test",
        password_hash=hash_password(
            "KemsDemo2026!"
        ),
    )

    db_session.add_all(
        [
            membership,
            account,
        ]
    )
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email":
                "naomie@kems.test",
            "password":
                "KemsDemo2026!",
        },
    )

    assert (
        response.status_code
        == 200
    )

    return response.json()[
        "access_token"
    ]


def create_client_contact(
    db_session,
):
    organization = Organization(
        name=(
            "Example Consulting SA"
        ),
        legal_name=(
            "Example Consulting SA"
        ),
        organization_type="company",
        city="Genève",
        country="Suisse",
        source_type="legacy_import",
        is_verified=True,
        verification_status="verified",
    )

    db_session.add(
        organization
    )
    db_session.flush()

    contact = Contact(
        first_name="Jean",
        last_name="Dupont",
        normalized_name=(
            "jean dupont"
        ),
        job_title="Directeur",
        email=(
            "jean.dupont@example.ch"
        ),
        phone="+41791234567",
        decision_role="decider",
        source_type="legacy_import",
        source_reference=(
            "legacy-client-001"
        ),
        verification_status=(
            "verified"
        ),
        is_verified=True,
        is_active=True,
    )

    db_session.add(
        contact
    )
    db_session.flush()

    relationship = (
        ContactOrganization(
            contact_id=contact.id,
            organization_id=(
                organization.id
            ),
            relationship_type=(
                "employee"
            ),
            job_title="Directeur",
            relationship_role=(
                "decision_maker"
            ),
            is_primary=True,
            is_active=True,
        )
    )

    db_session.add(
        relationship
    )
    db_session.commit()

    return (
        contact,
        organization,
    )


def test_internal_user_can_read_client_720(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    (
        contact,
        organization,
    ) = create_client_contact(
        db_session
    )

    response = client.get(
        (
            "/api/v1/core/contacts/"
            f"{contact.id}/720"
        ),
        headers={
            "Authorization":
                f"Bearer {token}"
        },
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert (
        payload["contact"][
            "first_name"
        ]
        == "Jean"
    )

    assert (
        payload["contact"][
            "last_name"
        ]
        == "Dupont"
    )

    assert (
        payload[
            "organization"
        ]["id"]
        == organization.id
    )

    assert (
        payload[
            "organization"
        ]["name"]
        == "Example Consulting SA"
    )

    assert (
        payload[
            "data_quality"
        ]["is_verified"]
        is True
    )

    assert (
        payload[
            "data_quality"
        ]["completeness_score"]
        == 100
    )


def test_client_720_requires_authentication(
    client,
    db_session,
):
    (
        contact,
        _,
    ) = create_client_contact(
        db_session
    )

    response = client.get(
        (
            "/api/v1/core/contacts/"
            f"{contact.id}/720"
        )
    )

    assert (
        response.status_code
        == 401
    )


def test_client_account_cannot_read_internal_720(
    client,
    db_session,
):
    (
        contact,
        _,
    ) = create_client_contact(
        db_session
    )

    account = AuthAccount(
        account_type="client",
        contact_id=contact.id,
        email=(
            "jean.dupont@example.ch"
        ),
        password_hash=hash_password(
            "KemsClient2026!"
        ),
    )

    db_session.add(
        account
    )
    db_session.commit()

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email":
                "jean.dupont@example.ch",
            "password":
                "KemsClient2026!",
        },
    )

    assert (
        login.status_code
        == 200
    )

    token = login.json()[
        "access_token"
    ]

    response = client.get(
        (
            "/api/v1/core/contacts/"
            f"{contact.id}/720"
        ),
        headers={
            "Authorization":
                f"Bearer {token}"
        },
    )

    assert (
        response.status_code
        == 403
    )


def test_unknown_contact_returns_404(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    response = client.get(
        (
            "/api/v1/core/contacts/"
            "unknown-contact/720"
        ),
        headers={
            "Authorization":
                f"Bearer {token}"
        },
    )

    assert (
        response.status_code
        == 404
    )
