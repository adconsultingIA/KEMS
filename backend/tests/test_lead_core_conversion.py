from sqlalchemy import (
    func,
    select,
)

from app.models.contact import Contact
from app.models.organization import (
    Organization,
)


def create_qualified_b2c(
    client,
    *,
    email: str = (
        "marie.core@example.com"
    ),
):
    created = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "b2c",
            "first_name":
                "Marie",
            "last_name":
                "Core",
            "email":
                email,
            "phone":
                "+41 79 111 22 33",
            "source":
                "manual",
        },
    )

    assert (
        created.status_code
        == 201
    )

    lead_id = (
        created.json()["id"]
    )

    qualified = client.post(
        (
            "/api/v1/leads/"
            f"{lead_id}/qualify"
        ),
        json={
            "fit_score": 20,
            "intent_score": 20,
            "engagement_score": 20,
            "potential_score": 20,
        },
    )

    assert (
        qualified.status_code
        == 200
    )

    return (
        qualified.json()
    )


def create_qualified_b2b(
    client,
    *,
    company_name:
        str = "Growth Core SA",
    email:
        str = "hello@growth-core.ch",
    first_name:
        str | None = None,
    last_name:
        str | None = None,
):
    payload = {
        "lead_type":
            "b2b",
        "company_name":
            company_name,
        "email":
            email,
        "source":
            "scraping",
        "city":
            "Genève",
        "country":
            "CH",
    }

    if first_name:
        payload[
            "first_name"
        ] = first_name

    if last_name:
        payload[
            "last_name"
        ] = last_name

    created = client.post(
        "/api/v1/leads",
        json=payload,
    )

    assert (
        created.status_code
        == 201
    )

    lead_id = (
        created.json()["id"]
    )

    qualified = client.post(
        (
            "/api/v1/leads/"
            f"{lead_id}/qualify"
        ),
        json={},
    )

    assert (
        qualified.status_code
        == 200
    )

    return (
        qualified.json()
    )


def test_b2c_conversion_creates_contact(
    client,
    db_session,
):
    lead = create_qualified_b2c(
        client
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/convert-to-core"
        )
    )

    assert (
        response.status_code
        == 200
    )

    payload = (
        response.json()
    )

    assert (
        payload[
            "contact_created"
        ]
        is True
    )

    assert (
        payload[
            "organization_created"
        ]
        is False
    )

    assert (
        payload["contact"]
        is not None
    )

    assert (
        payload["organization"]
        is None
    )

    converted = (
        payload["lead"]
    )

    assert (
        converted["contact_id"]
        is not None
    )

    assert (
        converted[
            "core_converted_at"
        ]
        is not None
    )

    assert (
        converted["status"]
        == "qualified"
    )

    contact = db_session.get(
        Contact,
        converted[
            "contact_id"
        ],
    )

    assert (
        contact.source_type
        == "growth_engine"
    )

    assert (
        contact.source_reference
        == lead["id"]
    )


def test_b2b_conversion_creates_organization(
    client,
    db_session,
):
    lead = create_qualified_b2b(
        client
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/convert-to-core"
        )
    )

    assert (
        response.status_code
        == 200
    )

    payload = (
        response.json()
    )

    assert (
        payload[
            "organization_created"
        ]
        is True
    )

    assert (
        payload["organization"]
        is not None
    )

    assert (
        payload["contact"]
        is None
    )

    organization_id = (
        payload["lead"][
            "organization_id"
        ]
    )

    organization = (
        db_session.get(
            Organization,
            organization_id,
        )
    )

    assert (
        organization.name
        == "Growth Core SA"
    )

    assert (
        organization.source_type
        == "growth_engine"
    )


def test_b2b_with_person_creates_org_and_contact(
    client,
    db_session,
):
    lead = create_qualified_b2b(
        client,
        company_name=(
            "Decision Maker SA"
        ),
        email=(
            "paul@decision-maker.ch"
        ),
        first_name="Paul",
        last_name="Martin",
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/convert-to-core"
        )
    )

    assert (
        response.status_code
        == 200
    )

    payload = (
        response.json()
    )

    assert (
        payload[
            "organization_created"
        ]
        is True
    )

    assert (
        payload[
            "contact_created"
        ]
        is True
    )

    contact = db_session.get(
        Contact,
        payload["lead"][
            "contact_id"
        ],
    )

    assert (
        contact.organization_id
        == payload["lead"][
            "organization_id"
        ]
    )


def test_existing_contact_is_reused(
    client,
    db_session,
):
    existing = Contact(
        first_name="Marie",
        last_name="Existing",
        normalized_name=(
            "marie existing"
        ),
        email=(
            "existing@example.com"
        ),
        phone=None,
        source_type="manual",
        verification_status=(
            "unverified"
        ),
        is_verified=False,
        is_active=True,
    )

    db_session.add(
        existing
    )

    db_session.commit()
    db_session.refresh(
        existing
    )

    lead = create_qualified_b2c(
        client,
        email=(
            "existing@example.com"
        ),
    )

    before_count = (
        db_session.scalar(
            select(
                func.count(
                    Contact.id
                )
            )
        )
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/convert-to-core"
        )
    )

    assert (
        response.status_code
        == 200
    )

    payload = (
        response.json()
    )

    assert (
        payload[
            "contact_created"
        ]
        is False
    )

    assert (
        payload["lead"][
            "contact_id"
        ]
        == existing.id
    )

    after_count = (
        db_session.scalar(
            select(
                func.count(
                    Contact.id
                )
            )
        )
    )

    assert (
        after_count
        == before_count
    )


def test_existing_organization_is_reused(
    client,
    db_session,
):
    existing = Organization(
        name="Existing Core SA",
        normalized_name=(
            "existing core sa"
        ),
        organization_type="company",
        email=(
            "hello@existing-core.ch"
        ),
        source_type="manual",
        verification_status=(
            "unverified"
        ),
        is_verified=False,
        is_active=True,
    )

    db_session.add(
        existing
    )

    db_session.commit()
    db_session.refresh(
        existing
    )

    lead = create_qualified_b2b(
        client,
        company_name=(
            "Existing Core SA"
        ),
        email=(
            "hello@existing-core.ch"
        ),
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/convert-to-core"
        )
    )

    assert (
        response.status_code
        == 200
    )

    payload = (
        response.json()
    )

    assert (
        payload[
            "organization_created"
        ]
        is False
    )

    assert (
        payload["lead"][
            "organization_id"
        ]
        == existing.id
    )


def test_conversion_is_idempotent(
    client,
):
    lead = create_qualified_b2c(
        client
    )

    first = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/convert-to-core"
        )
    )

    assert (
        first.status_code
        == 200
    )

    first_payload = (
        first.json()
    )

    second = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/convert-to-core"
        )
    )

    assert (
        second.status_code
        == 200
    )

    second_payload = (
        second.json()
    )

    assert (
        second_payload[
            "contact_created"
        ]
        is False
    )

    assert (
        second_payload["lead"][
            "contact_id"
        ]
        == first_payload["lead"][
            "contact_id"
        ]
    )


def test_unqualified_lead_cannot_convert(
    client,
):
    created = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "b2c",
            "first_name":
                "Not",
            "last_name":
                "Qualified",
            "email":
                "not-qualified@example.com",
        },
    )

    assert (
        created.status_code
        == 201
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{created.json()['id']}"
            "/convert-to-core"
        )
    )

    assert (
        response.status_code
        == 409
    )


def test_b2c_without_full_name_cannot_create_core_contact(
    client,
):
    created = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "b2c",
            "email":
                "anonymous@example.com",
        },
    )

    assert (
        created.status_code
        == 201
    )

    lead_id = (
        created.json()["id"]
    )

    qualified = client.post(
        (
            "/api/v1/leads/"
            f"{lead_id}/qualify"
        ),
        json={},
    )

    assert (
        qualified.status_code
        == 200
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead_id}"
            "/convert-to-core"
        )
    )

    assert (
        response.status_code
        == 422
    )


def test_b2b_without_company_name_cannot_convert(
    client,
):
    created = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "b2b",
            "email":
                "generic@example.com",
        },
    )

    assert (
        created.status_code
        == 201
    )

    lead_id = (
        created.json()["id"]
    )

    qualified = client.post(
        (
            "/api/v1/leads/"
            f"{lead_id}/qualify"
        ),
        json={},
    )

    assert (
        qualified.status_code
        == 200
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead_id}"
            "/convert-to-core"
        )
    )

    assert (
        response.status_code
        == 422
    )
