import hashlib
import hmac
import os
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.auth_account import AuthAccount
from app.models.auth_session import AuthSession
from app.models.contact import Contact
from app.models.organizational_unit import OrganizationalUnit
from app.models.profile import Profile
from app.models.role import Role
from app.models.user_membership import UserMembership
from app.schemas.auth import (
    AuthContactResponse,
    AuthContextResponse,
    AuthMembershipResponse,
    AuthProfileResponse,
    AuthRoleResponse,
    AuthUnitResponse,
)


PASSWORD_ITERATIONS = 310_000


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    if len(password) < 8:
        raise ValueError(
            "Le mot de passe doit contenir au moins 8 caractères."
        )

    salt = secrets.token_bytes(16)

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )

    return (
        f"pbkdf2_sha256$"
        f"{PASSWORD_ITERATIONS}$"
        f"{salt.hex()}$"
        f"{digest.hex()}"
    )


def verify_password(
    password: str,
    encoded_hash: str,
) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = (
            encoded_hash.split("$", 3)
        )

        if algorithm != "pbkdf2_sha256":
            return False

        expected = bytes.fromhex(digest_hex)
        salt = bytes.fromhex(salt_hex)

        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            int(iterations),
        )

        return hmac.compare_digest(
            actual,
            expected,
        )

    except (
        ValueError,
        TypeError,
    ):
        return False


def hash_session_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def utcnow() -> datetime:
    return datetime.now(
        UTC
    ).replace(
        tzinfo=None
    )


def session_duration() -> timedelta:
    raw_hours = os.getenv(
        "KEMS_AUTH_SESSION_HOURS",
        "12",
    )

    try:
        hours = int(raw_hours)
    except ValueError:
        hours = 12

    return timedelta(
        hours=max(1, hours)
    )


def create_session(
    db: Session,
    account: AuthAccount,
) -> tuple[str, AuthSession]:
    raw_token = secrets.token_urlsafe(48)

    auth_session = AuthSession(
        account_id=account.id,
        token_hash=hash_session_token(
            raw_token
        ),
        expires_at=(
            utcnow()
            + session_duration()
        ),
    )

    db.add(auth_session)
    db.commit()
    db.refresh(auth_session)

    return raw_token, auth_session


def get_session_account(
    db: Session,
    raw_token: str,
) -> tuple[AuthSession, AuthAccount]:
    token_hash = hash_session_token(
        raw_token
    )

    auth_session = db.scalar(
        select(AuthSession).where(
            AuthSession.token_hash
            == token_hash
        )
    )

    if not auth_session:
        raise HTTPException(
            status_code=401,
            detail="Session invalide.",
        )

    if auth_session.expires_at <= utcnow():
        db.delete(auth_session)
        db.commit()

        raise HTTPException(
            status_code=401,
            detail="Session expirée.",
        )

    account = db.get(
        AuthAccount,
        auth_session.account_id,
    )

    if (
        not account
        or not account.is_active
    ):
        raise HTTPException(
            status_code=401,
            detail="Compte inactif ou introuvable.",
        )

    return auth_session, account


def projection_from_unit(
    unit: OrganizationalUnit | None,
) -> str:
    if not unit:
        return "internal"

    normalized_code = (
        unit.code
        .strip()
        .lower()
        .replace("_", "-")
    )

    mapping = {
        "direction": "direction",
        "commercial": "commercial",
        "assurance": "assurance",
        "investissement": "investissement",
        "fiduciaire": "fiduciaire",
        "technologies": "technologies",
        "technology": "technologies",
        "tech": "technologies",
    }

    return mapping.get(
        normalized_code,
        normalized_code,
    )


def build_auth_context(
    db: Session,
    account: AuthAccount,
) -> AuthContextResponse:
    if account.account_type == "client":
        if not account.contact_id:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Compte client non relié "
                    "à un contact."
                ),
            )

        contact = db.get(
            Contact,
            account.contact_id,
        )

        if (
            not contact
            or not contact.is_active
            or contact.merged_into_contact_id
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Contact client indisponible."
                ),
            )

        return AuthContextResponse(
            account_id=account.id,
            account_type="client",
            email=account.email,
            projection="client",
            contact=AuthContactResponse(
                id=contact.id,
                first_name=contact.first_name,
                last_name=contact.last_name,
                email=contact.email,
            ),
        )

    if account.account_type != "internal":
        raise HTTPException(
            status_code=409,
            detail="Type de compte non supporté.",
        )

    if not account.profile_id:
        raise HTTPException(
            status_code=409,
            detail=(
                "Compte interne non relié "
                "à un profil."
            ),
        )

    profile = db.get(
        Profile,
        account.profile_id,
    )

    if (
        not profile
        or not profile.is_active
    ):
        raise HTTPException(
            status_code=409,
            detail="Profil interne indisponible.",
        )

    memberships = db.scalars(
        select(UserMembership)
        .where(
            UserMembership.user_id
            == profile.id,
            UserMembership.is_active
            .is_(True),
        )
        .order_by(
            UserMembership.is_primary
            .desc(),
            UserMembership.created_at
            .asc(),
        )
    ).all()

    membership_payloads: list[
        AuthMembershipResponse
    ] = []

    primary_role = None
    primary_unit = None

    for membership in memberships:
        role = db.get(
            Role,
            membership.role_id,
        )

        unit = db.get(
            OrganizationalUnit,
            membership.unit_id,
        )

        if (
            not role
            or not unit
            or not unit.is_active
        ):
            continue

        role_payload = AuthRoleResponse(
            id=role.id,
            code=role.code,
            name=role.name,
        )

        unit_payload = AuthUnitResponse(
            id=unit.id,
            code=unit.code,
            name=unit.name,
        )

        membership_payloads.append(
            AuthMembershipResponse(
                id=membership.id,
                role=role_payload,
                unit=unit_payload,
                is_primary=(
                    membership.is_primary
                ),
            )
        )

        if primary_unit is None:
            primary_role = role_payload
            primary_unit = unit_payload

    unit_model = None

    if primary_unit:
        unit_model = db.get(
            OrganizationalUnit,
            primary_unit.id,
        )

    return AuthContextResponse(
        account_id=account.id,
        account_type="internal",
        email=account.email,
        projection=projection_from_unit(
            unit_model
        ),
        profile=AuthProfileResponse(
            id=profile.id,
            full_name=profile.full_name,
            email=profile.email,
        ),
        role=primary_role,
        primary_unit=primary_unit,
        memberships=membership_payloads,
    )
