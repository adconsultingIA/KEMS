from app.models.lead import Lead


def test_create_b2c_lead_without_core_contact(
    client,
):
    response = client.post(
        "/api/v1/leads",
        json={
            "lead_type": "b2c",
            "first_name": "Marie",
            "last_name": "Durand",
            "email":
                "MARIE.DURAND@EXAMPLE.COM",
            "phone":
                "+41 79 000 00 00",
            "city": "Genève",
            "country": "CH",
            "source": "manual",
            "need_summary":
                "Recherche une solution "
                "d'assurance.",
        },
    )

    assert (
        response.status_code
        == 201
    )

    payload = response.json()

    assert (
        payload["lead_type"]
        == "b2c"
    )

    assert (
        payload["first_name"]
        == "Marie"
    )

    assert (
        payload["last_name"]
        == "Durand"
    )

    assert (
        payload["email"]
        == "marie.durand@example.com"
    )

    assert (
        payload["contact_id"]
        is None
    )

    assert (
        payload["organization_id"]
        is None
    )

    assert (
        payload["status"]
        == "new"
    )


def test_create_b2b_lead_without_core_organization(
    client,
):
    response = client.post(
        "/api/v1/leads",
        json={
            "lead_type": "b2b",
            "company_name":
                "Example Prospect SA",
            "email":
                "contact@example-prospect.ch",
            "city":
                "Lausanne",
            "country":
                "CH",
            "source":
                "scraping",
            "source_detail":
                "Annuaire entreprises",
            "estimated_value":
                45000,
            "currency":
                "chf",
        },
    )

    assert (
        response.status_code
        == 201
    )

    payload = response.json()

    assert (
        payload["lead_type"]
        == "b2b"
    )

    assert (
        payload["company_name"]
        == "Example Prospect SA"
    )

    assert (
        payload["currency"]
        == "CHF"
    )

    assert (
        payload["organization_id"]
        is None
    )


def test_b2c_requires_minimum_identity(
    client,
):
    response = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "b2c",
            "source":
                "manual",
        },
    )

    assert (
        response.status_code
        == 422
    )


def test_b2b_requires_minimum_identity(
    client,
):
    response = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "b2b",
            "source":
                "manual",
        },
    )

    assert (
        response.status_code
        == 422
    )


def test_invalid_lead_type_is_rejected(
    client,
):
    response = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "partner",
            "company_name":
                "Invalid Type SA",
        },
    )

    assert (
        response.status_code
        == 422
    )


def test_growth_score_remains_sum_of_four_scores(
    db_session,
):
    lead = Lead(
        lead_type="b2c",
        first_name="Score",
        last_name="Test",
        fit_score=20,
        intent_score=15,
        engagement_score=10,
        potential_score=25,
    )

    db_session.add(
        lead
    )

    db_session.commit()
    db_session.refresh(
        lead
    )

    assert (
        lead.growth_score
        == 70
    )


def test_list_leads_returns_autonomous_identity(
    client,
):
    created = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "b2b",
            "company_name":
                "Growth Test SA",
            "email":
                "hello@growth-test.ch",
            "source":
                "csv",
        },
    )

    assert (
        created.status_code
        == 201
    )

    response = client.get(
        "/api/v1/leads"
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert len(
        payload
    ) >= 1

    assert any(
        item[
            "company_name"
        ]
        == "Growth Test SA"
        for item
        in payload
    )
