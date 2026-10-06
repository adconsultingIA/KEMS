from app.models.action import Action
from app.models.auth_account import (
    AuthAccount,
)
from app.models.contact import Contact
from app.models.contact_organization import (
    ContactOrganization,
)
from app.models.lead import Lead
from app.models.opportunity import Opportunity
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


def test_client_720_returns_real_organization_relations(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    (
        contact,
        primary_organization,
    ) = create_client_contact(
        db_session
    )

    former_organization = Organization(
        name="Former Company SA",
        organization_type="company",
        city="Lausanne",
        country="Suisse",
        source_type="manual",
        verification_status="unverified",
        is_verified=False,
        is_active=True,
    )

    db_session.add(
        former_organization
    )
    db_session.flush()

    former_relation = ContactOrganization(
        contact_id=contact.id,
        organization_id=(
            former_organization.id
        ),
        relationship_type="employee",
        job_title="Consultant",
        relationship_role="employee",
        is_primary=False,
        is_active=False,
    )

    db_session.add(
        former_relation
    )
    db_session.commit()

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

    assert response.status_code == 200

    payload = response.json()

    assert len(
        payload["relations"]
    ) == 2

    primary = payload[
        "relations"
    ][0]

    assert (
        primary["organization"]["id"]
        == primary_organization.id
    )

    assert (
        primary["relationship"][
            "is_primary"
        ]
        is True
    )

    assert (
        primary["relationship"][
            "is_active"
        ]
        is True
    )

    former = payload[
        "relations"
    ][1]

    assert (
        former["organization"]["name"]
        == "Former Company SA"
    )

    assert (
        former["relationship"][
            "is_active"
        ]
        is False
    )


def test_client_720_exposes_quality_and_provenance(
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

    assert response.status_code == 200

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

    provenance = payload[
        "provenance"
    ]

    assert (
        provenance[
            "contact_source_type"
        ]
        == "legacy_import"
    )

    assert (
        provenance[
            "contact_source_reference"
        ]
        == "legacy-client-001"
    )

    assert (
        provenance[
            "organization_source_type"
        ]
        == organization.source_type
    )


def test_client_720_lists_missing_quality_fields(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    contact = Contact(
        first_name="Incomplete",
        last_name="Contact",
        normalized_name=(
            "incomplete contact"
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
            "/api/v1/core/contacts/"
            f"{contact.id}/720"
        ),
        headers={
            "Authorization":
                f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    quality = response.json()[
        "data_quality"
    ]

    assert (
        quality[
            "completeness_score"
        ]
        == 33
    )

    assert set(
        quality[
            "missing_fields"
        ]
    ) == {
        "email",
        "phone",
        "job_title",
        "organization",
    }


def test_client_720_affiliation_summary(
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

    second_organization = Organization(
        name="Second Company SA",
        organization_type="company",
        city="Zurich",
        country="Suisse",
        source_type="manual",
        is_active=True,
    )

    db_session.add(
        second_organization
    )
    db_session.flush()

    second_relation = ContactOrganization(
        contact_id=contact.id,
        organization_id=(
            second_organization.id
        ),
        relationship_type="advisor",
        relationship_role="advisor",
        is_primary=False,
        is_active=True,
    )

    db_session.add(
        second_relation
    )
    db_session.commit()

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

    assert response.status_code == 200

    summary = response.json()[
        "affiliation_summary"
    ]

    assert (
        summary[
            "total_relations"
        ]
        == 2
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
        == 0
    )

    assert (
        summary[
            "primary_organization_id"
        ]
        == organization.id
    )

    assert (
        summary[
            "has_multiple_active_affiliations"
        ]
        is True
    )


def test_client_720_affiliation_summary_counts_history(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    (
        contact,
        _,
    ) = create_client_contact(
        db_session
    )

    former_organization = Organization(
        name="Historic Company SA",
        organization_type="company",
        source_type="manual",
        is_active=True,
    )

    db_session.add(
        former_organization
    )
    db_session.flush()

    former_relation = ContactOrganization(
        contact_id=contact.id,
        organization_id=(
            former_organization.id
        ),
        relationship_type="employee",
        is_primary=False,
        is_active=False,
    )

    db_session.add(
        former_relation
    )
    db_session.commit()

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

    assert response.status_code == 200

    summary = response.json()[
        "affiliation_summary"
    ]

    assert (
        summary[
            "total_relations"
        ]
        == 2
    )

    assert (
        summary[
            "active_relations"
        ]
        == 1
    )

    assert (
        summary[
            "historical_relations"
        ]
        == 1
    )


def test_client_720_commercial_summary_uses_real_data(
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

    lead = Lead(
        contact_id=contact.id,
        organization_id=organization.id,
        source="manual",
        status="qualified",
        estimated_value=45000,
        currency="CHF",
        fit_score=20,
        intent_score=20,
        engagement_score=20,
        potential_score=20,
    )

    db_session.add(
        lead
    )
    db_session.flush()

    opportunity = Opportunity(
        lead_id=lead.id,
        organization_id=organization.id,
        primary_contact_id=contact.id,
        name="Assurance entreprise",
        stage="qualified",
        estimated_value=45000,
        currency="CHF",
        probability=50,
    )

    db_session.add(
        opportunity
    )
    db_session.commit()

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

    assert response.status_code == 200

    commercial = response.json()[
        "business_summary"
    ][
        "commercial"
    ]

    assert (
        commercial["leads"]
        == 1
    )

    assert (
        commercial[
            "qualified_leads"
        ]
        == 1
    )

    assert (
        commercial[
            "opportunities"
        ]
        == 1
    )

    assert (
        commercial[
            "active_opportunities"
        ]
        == 1
    )

    assert (
        commercial[
            "pipeline_by_currency"
        ]["CHF"]
        == 45000
    )


def test_client_720_business_context_summary_uses_actions(
    client,
    db_session,
):
    token = create_internal_token(
        client,
        db_session,
    )

    (
        contact,
        _,
    ) = create_client_contact(
        db_session
    )

    db_session.add_all(
        [
            Action(
                title="Action Assurance active",
                context="assurance",
                status="in_progress",
                priority="medium",
                contact_id=contact.id,
                source_type="test",
            ),
            Action(
                title="Action Assurance terminée",
                context="assurance",
                status="done",
                priority="medium",
                contact_id=contact.id,
                source_type="test",
            ),
            Action(
                title="Action Investissement",
                context="investissement",
                status="todo",
                priority="medium",
                contact_id=contact.id,
                source_type="test",
            ),
        ]
    )

    db_session.commit()

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

    assert response.status_code == 200

    summary = response.json()[
        "business_summary"
    ]

    assert (
        summary["assurance"][
            "active_actions"
        ]
        == 1
    )

    assert (
        summary["assurance"][
            "total_actions"
        ]
        == 2
    )

    assert (
        summary[
            "investissement"
        ][
            "active_actions"
        ]
        == 1
    )

    assert (
        summary[
            "fiduciaire"
        ][
            "active_actions"
        ]
        == 0
    )
