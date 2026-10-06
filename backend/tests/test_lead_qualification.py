from app.models.lead import Lead


def create_lead(
    client,
):
    response = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "b2c",
            "first_name":
                "Marie",
            "last_name":
                "Qualification",
            "email":
                "marie.qualif@example.com",
            "source":
                "manual",
        },
    )

    assert (
        response.status_code
        == 201
    )

    return response.json()


def test_mark_lead_contacted(
    client,
):
    lead = create_lead(
        client
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}/contacted"
        )
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert (
        payload["status"]
        == "contacted"
    )

    assert (
        payload["contacted_at"]
        is not None
    )


def test_start_qualification(
    client,
):
    lead = create_lead(
        client
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/qualification/start"
        )
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert (
        payload["status"]
        == "qualifying"
    )

    assert (
        payload[
            "qualification_started_at"
        ]
        is not None
    )


def test_update_scores_enters_qualification(
    client,
):
    lead = create_lead(
        client
    )

    response = client.patch(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/qualification"
        ),
        json={
            "fit_score": 20,
            "intent_score": 18,
            "engagement_score": 15,
            "potential_score": 22,
            "need_summary":
                "Besoin confirmé.",
            "estimated_value":
                12000,
        },
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert (
        payload["status"]
        == "qualifying"
    )

    assert (
        payload["growth_score"]
        == 75
    )

    assert (
        payload["need_summary"]
        == "Besoin confirmé."
    )


def test_explicit_qualification(
    client,
):
    lead = create_lead(
        client
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/qualify"
        ),
        json={
            "fit_score": 20,
            "intent_score": 20,
            "engagement_score": 15,
            "potential_score": 20,
            "qualification_notes":
                "Lead validé commercialement.",
        },
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert (
        payload["status"]
        == "qualified"
    )

    assert (
        payload["growth_score"]
        == 75
    )

    assert (
        payload["qualified_at"]
        is not None
    )

    assert (
        payload[
            "qualification_started_at"
        ]
        is not None
    )


def test_low_score_can_still_be_qualified_by_human_decision(
    client,
):
    lead = create_lead(
        client
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/qualify"
        ),
        json={
            "fit_score": 5,
            "intent_score": 5,
            "engagement_score": 5,
            "potential_score": 5,
            "qualification_notes":
                "Décision commerciale explicite.",
        },
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()[
            "growth_score"
        ]
        == 20
    )

    assert (
        response.json()[
            "status"
        ]
        == "qualified"
    )


def test_disqualify_lead_requires_reason(
    client,
):
    lead = create_lead(
        client
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/disqualify"
        ),
        json={
            "reason": "",
        },
    )

    assert (
        response.status_code
        == 422
    )


def test_disqualify_and_reopen(
    client,
):
    lead = create_lead(
        client
    )

    disqualified = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/disqualify"
        ),
        json={
            "reason":
                "Besoin hors périmètre KEMS.",
        },
    )

    assert (
        disqualified.status_code
        == 200
    )

    payload = (
        disqualified.json()
    )

    assert (
        payload["status"]
        == "disqualified"
    )

    assert (
        payload[
            "disqualified_reason"
        ]
        == "Besoin hors périmètre KEMS."
    )

    assert (
        payload[
            "disqualified_at"
        ]
        is not None
    )

    reopen = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/reopen"
        )
    )

    assert (
        reopen.status_code
        == 200
    )

    reopened = (
        reopen.json()
    )

    assert (
        reopened["status"]
        == "qualifying"
    )

    assert (
        reopened[
            "disqualified_reason"
        ]
        is None
    )

    assert (
        reopened[
            "disqualified_at"
        ]
        is None
    )


def test_disqualified_lead_cannot_be_qualified_without_reopen(
    client,
):
    lead = create_lead(
        client
    )

    client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/disqualify"
        ),
        json={
            "reason":
                "Non pertinent.",
        },
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/qualify"
        ),
        json={},
    )

    assert (
        response.status_code
        == 409
    )


def test_qualified_lead_is_frozen_for_qualification_updates(
    client,
):
    lead = create_lead(
        client
    )

    qualified = client.post(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/qualify"
        ),
        json={
            "fit_score": 18,
        },
    )

    assert (
        qualified.status_code
        == 200
    )

    response = client.patch(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/qualification"
        ),
        json={
            "fit_score": 25,
        },
    )

    assert (
        response.status_code
        == 409
    )


def test_converted_lead_cannot_reenter_qualification(
    client,
    db_session,
):
    lead = Lead(
        lead_type="b2b",
        company_name=
            "Converted Prospect SA",
        source="manual",
        status=
            "converted_to_opportunity",
    )

    db_session.add(
        lead
    )

    db_session.commit()
    db_session.refresh(
        lead
    )

    response = client.post(
        (
            "/api/v1/leads/"
            f"{lead.id}"
            "/qualification/start"
        )
    )

    assert (
        response.status_code
        == 409
    )


def test_invalid_score_is_rejected(
    client,
):
    lead = create_lead(
        client
    )

    response = client.patch(
        (
            "/api/v1/leads/"
            f"{lead['id']}"
            "/qualification"
        ),
        json={
            "fit_score": 30,
        },
    )

    assert (
        response.status_code
        == 422
    )


def test_qualified_lead_can_return_to_qualification(
    client,
):
    create_response = client.post(
        "/api/v1/leads",
        json={
            "lead_type": "b2c",
            "first_name": "Undo",
            "last_name": "Qualification",
            "email": "undo.qualification@test.ch",
            "source": "manual",
        },
    )

    assert create_response.status_code == 201

    lead_id = create_response.json()["id"]

    assert client.post(
        f"/api/v1/leads/{lead_id}/contacted"
    ).status_code == 200

    assert client.post(
        f"/api/v1/leads/{lead_id}/qualification/start"
    ).status_code == 200

    qualified_response = client.post(
        f"/api/v1/leads/{lead_id}/qualify",
        json={
            "fit_score": 15,
            "intent_score": 15,
            "engagement_score": 15,
            "potential_score": 15,
            "qualification_notes": "Test retour",
        },
    )

    assert qualified_response.status_code == 200
    assert (
        qualified_response.json()["status"]
        == "qualified"
    )

    response = client.post(
        f"/api/v1/leads/{lead_id}/return-to-qualification"
    )

    assert response.status_code == 200

    payload = response.json()

    assert payload["status"] == "qualifying"
    assert payload["qualified_at"] is None

    # Scoring and notes are deliberately preserved.
    assert payload["growth_score"] == 60
    assert (
        payload["qualification_notes"]
        == "Test retour"
    )
