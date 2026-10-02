from app.models.auth_account import (
    AuthAccount,
)
from app.models.contact import Contact
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


def test_internal_login_projection_and_logout(
    client,
    db_session,
):
    direction = OrganizationalUnit(
        name="Direction",
        code="DIRECTION",
        unit_type="business_unit",
    )

    manager = Role(
        code="manager",
        name="Manager",
        is_system=True,
    )

    profile = Profile(
        full_name="Euloge Santos",
        email="santos@kems.test",
        role="direction",
    )

    db_session.add_all(
        [
            direction,
            manager,
            profile,
        ]
    )
    db_session.flush()

    membership = UserMembership(
        user_id=profile.id,
        unit_id=direction.id,
        role_id=manager.id,
        is_primary=True,
    )

    account = AuthAccount(
        account_type="internal",
        profile_id=profile.id,
        email="santos@kems.test",
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

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "SANTOS@KEMS.TEST",
            "password": "KemsDemo2026!",
        },
    )

    assert login_response.status_code == 200

    payload = login_response.json()

    assert (
        payload["context"][
            "account_type"
        ]
        == "internal"
    )

    assert (
        payload["context"][
            "projection"
        ]
        == "direction"
    )

    assert (
        payload["context"][
            "primary_unit"
        ]["code"]
        == "DIRECTION"
    )

    token = payload["access_token"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": (
                f"Bearer {token}"
            )
        },
    )

    assert me_response.status_code == 200

    assert (
        me_response.json()[
            "profile"
        ]["full_name"]
        == "Euloge Santos"
    )

    logout_response = client.post(
        "/api/v1/auth/logout",
        headers={
            "Authorization": (
                f"Bearer {token}"
            )
        },
    )

    assert logout_response.status_code == 204

    expired_response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": (
                f"Bearer {token}"
            )
        },
    )

    assert expired_response.status_code == 401


def test_client_login_projection(
    client,
    db_session,
):
    contact = Contact(
        first_name="Jean",
        last_name="Dupont",
        email="jean@client.test",
        normalized_name="jean dupont",
    )

    db_session.add(contact)
    db_session.flush()

    account = AuthAccount(
        account_type="client",
        contact_id=contact.id,
        email="jean@client.test",
        password_hash=hash_password(
            "KemsClient2026!"
        ),
    )

    db_session.add(account)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "jean@client.test",
            "password": "KemsClient2026!",
        },
    )

    assert response.status_code == 200

    payload = response.json()

    assert (
        payload["context"][
            "account_type"
        ]
        == "client"
    )

    assert (
        payload["context"][
            "projection"
        ]
        == "client"
    )

    assert (
        payload["context"][
            "contact"
        ]["first_name"]
        == "Jean"
    )


def test_invalid_password_is_rejected(
    client,
    db_session,
):
    profile = Profile(
        full_name="Parfait ADJANOR",
        email="parfait@kems.test",
        role="technologies",
    )

    db_session.add(profile)
    db_session.flush()

    account = AuthAccount(
        account_type="internal",
        profile_id=profile.id,
        email="parfait@kems.test",
        password_hash=hash_password(
            "KemsTech2026!"
        ),
    )

    db_session.add(account)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "parfait@kems.test",
            "password": "mauvais-mot-de-passe",
        },
    )

    assert response.status_code == 401
