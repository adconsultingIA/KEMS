def create_core_converted_lead(
    client,
):
    created = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "b2c",
            "first_name":
                "Pipeline",
            "last_name":
                "Test",
            "email":
                "pipeline.test@example.com",
            "estimated_value":
                25000,
            "currency":
                "CHF",
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

    converted = client.post(
        (
            "/api/v1/leads/"
            f"{lead_id}"
            "/convert-to-core"
        )
    )

    assert (
        converted.status_code
        == 200
    )

    return (
        converted.json()[
            "lead"
        ]
    )


def create_opportunity(
    client,
):
    lead = (
        create_core_converted_lead(
            client
        )
    )

    response = client.post(
        "/api/v1/opportunities",
        json={
            "lead_id":
                lead["id"],
            "name":
                "Assurance entreprise",
            "description":
                "Opportunité issue "
                "du Growth Engine.",
            "expected_close_date":
                "2026-12-15",
        },
    )

    assert (
        response.status_code
        == 201
    )

    return response.json()


def test_create_opportunity_from_core_converted_lead(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    assert (
        opportunity["stage"]
        == "qualified"
    )

    assert (
        opportunity[
            "estimated_value"
        ]
        == 25000
    )

    assert (
        opportunity[
            "primary_contact_id"
        ]
        is not None
    )


def test_lead_becomes_converted_to_opportunity(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    response = client.get(
        (
            "/api/v1/leads/"
            f"{opportunity['lead_id']}"
        )
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()[
            "status"
        ]
        == "converted_to_opportunity"
    )


def test_unconverted_core_lead_cannot_create_opportunity(
    client,
):
    created = client.post(
        "/api/v1/leads",
        json={
            "lead_type":
                "b2c",
            "first_name":
                "No",
            "last_name":
                "Core",
            "email":
                "nocore@example.com",
        },
    )

    lead_id = (
        created.json()["id"]
    )

    client.post(
        (
            "/api/v1/leads/"
            f"{lead_id}/qualify"
        ),
        json={},
    )

    response = client.post(
        "/api/v1/opportunities",
        json={
            "lead_id":
                lead_id,
            "name":
                "Should fail",
        },
    )

    assert (
        response.status_code
        == 409
    )


def test_duplicate_opportunity_for_same_lead_is_rejected(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    response = client.post(
        "/api/v1/opportunities",
        json={
            "lead_id":
                opportunity[
                    "lead_id"
                ],
            "name":
                "Duplicate",
        },
    )

    assert (
        response.status_code
        == 409
    )


def test_pipeline_qualified_to_proposal(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    response = client.post(
        (
            "/api/v1/opportunities/"
            f"{opportunity['id']}"
            "/stage"
        ),
        json={
            "stage":
                "proposal",
        },
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert (
        payload["stage"]
        == "proposal"
    )

    assert (
        payload["probability"]
        == 50
    )


def test_pipeline_proposal_to_negotiation_to_won(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    client.post(
        (
            "/api/v1/opportunities/"
            f"{opportunity['id']}"
            "/stage"
        ),
        json={
            "stage":
                "proposal",
        },
    )

    negotiation = client.post(
        (
            "/api/v1/opportunities/"
            f"{opportunity['id']}"
            "/stage"
        ),
        json={
            "stage":
                "negotiation",
        },
    )

    assert (
        negotiation.status_code
        == 200
    )

    assert (
        negotiation.json()[
            "probability"
        ]
        == 75
    )

    won = client.post(
        (
            "/api/v1/opportunities/"
            f"{opportunity['id']}"
            "/stage"
        ),
        json={
            "stage":
                "won",
        },
    )

    assert (
        won.status_code
        == 200
    )

    payload = won.json()

    assert (
        payload["stage"]
        == "won"
    )

    assert (
        payload["probability"]
        == 100
    )

    assert (
        payload["won_at"]
        is not None
    )


def test_lost_requires_reason(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    response = client.post(
        (
            "/api/v1/opportunities/"
            f"{opportunity['id']}"
            "/stage"
        ),
        json={
            "stage":
                "lost",
        },
    )

    assert (
        response.status_code
        == 422
    )


def test_pipeline_can_close_as_lost(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    response = client.post(
        (
            "/api/v1/opportunities/"
            f"{opportunity['id']}"
            "/stage"
        ),
        json={
            "stage":
                "lost",
            "lost_reason":
                "Budget insuffisant.",
        },
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert (
        payload["stage"]
        == "lost"
    )

    assert (
        payload["probability"]
        == 0
    )

    assert (
        payload["lost_reason"]
        == "Budget insuffisant."
    )

    assert (
        payload["lost_at"]
        is not None
    )


def test_invalid_transition_is_rejected(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    response = client.post(
        (
            "/api/v1/opportunities/"
            f"{opportunity['id']}"
            "/stage"
        ),
        json={
            "stage":
                "won",
        },
    )

    assert (
        response.status_code
        == 409
    )


def test_closed_opportunity_cannot_be_modified(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    client.post(
        (
            "/api/v1/opportunities/"
            f"{opportunity['id']}"
            "/stage"
        ),
        json={
            "stage":
                "lost",
            "lost_reason":
                "Pas de budget.",
        },
    )

    response = client.patch(
        (
            "/api/v1/opportunities/"
            f"{opportunity['id']}"
        ),
        json={
            "estimated_value":
                999999,
        },
    )

    assert (
        response.status_code
        == 409
    )


def test_update_open_opportunity(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    response = client.patch(
        (
            "/api/v1/opportunities/"
            f"{opportunity['id']}"
        ),
        json={
            "estimated_value":
                30000,
            "probability":
                35,
        },
    )

    assert (
        response.status_code
        == 200
    )

    payload = response.json()

    assert (
        payload[
            "estimated_value"
        ]
        == 30000
    )

    assert (
        payload["probability"]
        == 35
    )


def test_list_opportunities_by_stage(
    client,
):
    opportunity = (
        create_opportunity(
            client
        )
    )

    response = client.get(
        (
            "/api/v1/opportunities"
            "?stage=qualified"
        )
    )

    assert (
        response.status_code
        == 200
    )

    assert any(
        item["id"]
        == opportunity["id"]
        for item
        in response.json()
    )
