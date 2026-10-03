from app.models.auth_account import (
    AuthAccount,
)
from app.models.contact import (
    Contact,
)
from app.models.contact_organization import (
    ContactOrganization,
)
from app.models.organization import (
    Organization,
)
from app.models.organizational_unit import (
    OrganizationalUnit,
)
from app.models.profile import (
    Profile,
)
from app.models.role import (
    Role,
)
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


def create_organization_graph(
    db_session,
):
    organization = Organization(
        name="Example Consulting SA",
        legal_name=(
            "Example Consulting SA"
        ),
        organization_type="company",
        industry="Consulting",
        website=(
            "https://example-consulting.ch"
        ),
        domain="example-consulting.ch",
        email="hello@example-consulting.ch",
        phone="+41225550101",
        country="Suisse",
        city="Genève",
        address="Rue Exemple 1",
        source_type="manual",
        source_reference=(
            "organization-test"
        ),
        verification_status=(
            "unverified"
        ),
        is_verified=False,
        is_active=True,
    )

    db_session.add(
        organization
    )
    db_session.flush()

    jean = Contact(
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
        decision_role=(
            "decision_maker"
        ),
        source_type="manual",
        is_active=True,
    )

    sophie = Contact(
        first_name="Sophie",
        last_name="Martin",
        normalized_name=(
            "sophie martin"
        ),
        job_title="Finance Manager",
        email=(
            "sophie@example.ch"
        ),
        decision_role="influencer",
        source_type="manual",
        is_active=True,
    )

    former = Contact(
        first_name="Marc",
        last_name="Ancien",
        normalized_name=(
            "marc ancien"
        ),
        job_title="Consultant",
        email="marc@example.ch",
        decision_role="user",
        source_type="manual",
        is_active=True,
    )

    db_session.add_all(
        [
            jean,
            sophie,
            former,
        ]
    )
    db_session.flush()

    db_session.add_all(
        [
            ContactOrganization(
                contact_id=jean.id,
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
            ),
            ContactOrganization(
                contact_id=sophie.id,
                organization_id=(
                    organization.id
                ),
                relationship_type=(
                    "employee"
                ),
                job_title=(
                    "Finance Manager"
                ),
                relationship_role=(
                    "influencer"
                ),
                is_primary=False,
                is_active=True,
            ),
            ContactOrganization(
                contact_id=former.id,
                organization_id=(
                    organization.id
                ),
                relationship_type=(
                    "employee"
                ),
                job_title="Consultant",
                relationship_role="user",
                is_primary=False,
                is_active=False,
            ),
        ]
    )

    db_session.commit()

    return (
        organization,
        jean,
        sophie,
        former,
    )


def test_internal_user_can_read_organization_720(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    (
        organization,
        _,
        _,
        _,
    ) = create_organization_graph(
        db_session
    )

    response = client.get(
        (
            "/api/v1/core/organizations/"
            f"{organization.id}/720"
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
        len(
            payload[
                "contacts"
            ]
        )
        == 3
    )


def test_organization_720_contact_summary(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    (
        organization,
        _,
        _,
        _,
    ) = create_organization_graph(
        db_session
    )

    response = client.get(
        (
            "/api/v1/core/organizations/"
            f"{organization.id}/720"
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

    summary = response.json()[
        "contact_summary"
    ]

    assert (
        summary[
            "total_contacts"
        ]
        == 3
    )

    assert (
        summary[
            "active_relations"
        ]
        == 2
    )

    assert (
        summary[
            "historical_relations"
        ]
        == 1
    )

    assert (
        summary[
            "decision_makers"
        ]
        == 1
    )

    assert (
        summary[
            "has_multiple_active_contacts"
        ]
        is True
    )


def test_organization_720_quality_and_provenance(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    (
        organization,
        _,
        _,
        _,
    ) = create_organization_graph(
        db_session
    )

    response = client.get(
        (
            "/api/v1/core/organizations/"
            f"{organization.id}/720"
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

    quality = payload[
        "data_quality"
    ]

    assert (
        quality[
            "completeness_score"
        ]
        == 100
    )

    assert (
        quality[
            "missing_fields"
        ]
        == []
    )

    assert (
        quality[
            "is_verified"
        ]
        is False
    )

    provenance = payload[
        "provenance"
    ]

    assert (
        provenance[
            "source_type"
        ]
        == "manual"
    )

    assert (
        provenance[
            "source_reference"
        ]
        == "organization-test"
    )


def test_organization_720_supports_legacy_contact_link(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    organization = Organization(
        name="Legacy Company SA",
        organization_type="company",
        source_type="manual",
        is_active=True,
    )

    db_session.add(
        organization
    )
    db_session.flush()

    contact = Contact(
        organization_id=(
            organization.id
        ),
        first_name="Legacy",
        last_name="Contact",
        normalized_name=(
            "legacy contact"
        ),
        source_type="manual",
        is_active=True,
    )

    db_session.add(
        contact
    )
    db_session.commit()

    response = client.get(
        (
            "/api/v1/core/organizations/"
            f"{organization.id}/720"
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
        payload[
            "contact_summary"
        ][
            "total_contacts"
        ]
        == 1
    )

    assert (
        payload[
            "contacts"
        ][0][
            "contact"
        ][
            "first_name"
        ]
        == "Legacy"
    )

    assert (
        payload[
            "contacts"
        ][0][
            "relationship"
        ]
        is None
    )


def test_organization_720_requires_authentication(
    client,
    db_session,
):
    organization = Organization(
        name="Private Organization",
        organization_type="company",
        source_type="manual",
        is_active=True,
    )

    db_session.add(
        organization
    )
    db_session.commit()

    response = client.get(
        (
            "/api/v1/core/organizations/"
            f"{organization.id}/720"
        )
    )

    assert (
        response.status_code
        == 401
    )


def test_client_account_cannot_read_organization_720(
    client,
    db_session,
):
    organization = Organization(
        name="Private Organization",
        organization_type="company",
        source_type="manual",
        is_active=True,
    )

    contact = Contact(
        first_name="Jean",
        last_name="Client",
        normalized_name=(
            "jean client"
        ),
        email="client@kems.test",
        source_type="manual",
        is_active=True,
    )

    db_session.add_all(
        [
            organization,
            contact,
        ]
    )
    db_session.flush()

    account = AuthAccount(
        account_type="client",
        contact_id=contact.id,
        email="client@kems.test",
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
                "client@kems.test",
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
            "/api/v1/core/organizations/"
            f"{organization.id}/720"
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


def test_unknown_organization_returns_404(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    response = client.get(
        (
            "/api/v1/core/organizations/"
            "unknown-organization/720"
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
