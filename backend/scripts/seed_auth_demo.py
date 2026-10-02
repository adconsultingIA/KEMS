from sqlalchemy import func, select

from app.core.database import SessionLocal
from app.models.auth_account import AuthAccount
from app.models.contact import Contact
from app.models.organizational_unit import OrganizationalUnit
from app.models.profile import Profile
from app.models.role import Role
from app.models.user_membership import UserMembership
from app.services.auth_service import hash_password


DEMO_PASSWORD = "KemsDemo2026!"


def get_or_create_role(
    db,
    code: str,
    name: str,
) -> Role:
    role = db.scalar(
        select(Role).where(
            func.lower(Role.code)
            == code.lower()
        )
    )

    if role:
        return role

    role = Role(
        code=code,
        name=name,
        is_system=True,
    )

    db.add(role)
    db.flush()

    return role


def get_or_create_unit(
    db,
    code: str,
    name: str,
) -> OrganizationalUnit:
    unit = db.scalar(
        select(OrganizationalUnit).where(
            func.lower(
                OrganizationalUnit.code
            )
            == code.lower()
        )
    )

    if unit:
        return unit

    unit = OrganizationalUnit(
        name=name,
        code=code,
        unit_type="business_unit",
        is_active=True,
    )

    db.add(unit)
    db.flush()

    return unit


def get_or_create_profile(
    db,
    full_name: str,
    email: str,
    legacy_role: str,
) -> Profile:
    profile = db.scalar(
        select(Profile).where(
            func.lower(Profile.full_name)
            == full_name.lower()
        )
    )

    if profile:
        return profile

    profile = db.scalar(
        select(Profile).where(
            func.lower(Profile.email)
            == email.lower()
        )
    )

    if profile:
        return profile

    profile = Profile(
        full_name=full_name,
        email=email.lower(),
        role=legacy_role,
        is_active=True,
    )

    db.add(profile)
    db.flush()

    return profile


def ensure_membership(
    db,
    profile: Profile,
    unit: OrganizationalUnit,
    role: Role,
) -> None:
    existing = db.scalar(
        select(UserMembership).where(
            UserMembership.user_id
            == profile.id,
            UserMembership.unit_id
            == unit.id,
            UserMembership.role_id
            == role.id,
            UserMembership.is_active
            .is_(True),
        )
    )

    if existing:
        existing.is_primary = True
        return

    membership = UserMembership(
        user_id=profile.id,
        unit_id=unit.id,
        role_id=role.id,
        is_primary=True,
        is_active=True,
    )

    db.add(membership)


def ensure_internal_account(
    db,
    profile: Profile,
    email: str,
) -> None:
    account = db.scalar(
        select(AuthAccount).where(
            AuthAccount.profile_id
            == profile.id
        )
    )

    if not account:
        account = db.scalar(
            select(AuthAccount).where(
                func.lower(
                    AuthAccount.email
                )
                == email.lower()
            )
        )

    if not account:
        account = AuthAccount(
            account_type="internal",
            profile_id=profile.id,
            email=email.lower(),
            password_hash=hash_password(
                DEMO_PASSWORD
            ),
            is_active=True,
        )
        db.add(account)
        return

    account.account_type = "internal"
    account.profile_id = profile.id
    account.email = email.lower()
    account.password_hash = hash_password(
        DEMO_PASSWORD
    )
    account.is_active = True


def get_or_create_contact(
    db,
) -> Contact:
    contact = db.scalar(
        select(Contact).where(
            func.lower(Contact.first_name)
            == "jean",
            func.lower(Contact.last_name)
            == "dupont",
            Contact.is_active.is_(True),
        )
    )

    if contact:
        if not contact.email:
            contact.email = (
                "jean.dupont@client.kems.test"
            )
        return contact

    contact = Contact(
        first_name="Jean",
        last_name="Dupont",
        normalized_name="jean dupont",
        email="jean.dupont@client.kems.test",
        source_type="manual",
        verification_status="verified",
        is_verified=True,
        is_active=True,
    )

    db.add(contact)
    db.flush()

    return contact


def ensure_client_account(
    db,
    contact: Contact,
) -> None:
    email = "jean.dupont@client.kems.test"

    account = db.scalar(
        select(AuthAccount).where(
            AuthAccount.contact_id
            == contact.id
        )
    )

    if not account:
        account = db.scalar(
            select(AuthAccount).where(
                func.lower(
                    AuthAccount.email
                )
                == email.lower()
            )
        )

    if not account:
        account = AuthAccount(
            account_type="client",
            contact_id=contact.id,
            email=email,
            password_hash=hash_password(
                DEMO_PASSWORD
            ),
            is_active=True,
        )
        db.add(account)
        return

    account.account_type = "client"
    account.contact_id = contact.id
    account.email = email
    account.password_hash = hash_password(
        DEMO_PASSWORD
    )
    account.is_active = True


def main() -> None:
    db = SessionLocal()

    try:
        admin = get_or_create_role(
            db,
            "admin",
            "Administrateur",
        )

        manager = get_or_create_role(
            db,
            "manager",
            "Manager",
        )

        collaborator = get_or_create_role(
            db,
            "collaborator",
            "Collaborateur",
        )

        direction = get_or_create_unit(
            db,
            "DIRECTION",
            "Direction",
        )

        assurance = get_or_create_unit(
            db,
            "ASSURANCE",
            "Assurance",
        )

        technologies = get_or_create_unit(
            db,
            "TECHNOLOGIES",
            "Technologies",
        )

        santos = get_or_create_profile(
            db,
            "Euloge Santos",
            "santos@kems.test",
            "direction",
        )

        naomie = get_or_create_profile(
            db,
            "Naomie Nassara",
            "naomie@kems.test",
            "assurance",
        )

        parfait = get_or_create_profile(
            db,
            "Parfait ADJANOR",
            "parfait@kems.test",
            "technologies",
        )

        ensure_membership(
            db,
            santos,
            direction,
            manager,
        )

        ensure_membership(
            db,
            naomie,
            assurance,
            collaborator,
        )

        ensure_membership(
            db,
            parfait,
            technologies,
            admin,
        )

        ensure_internal_account(
            db,
            santos,
            "santos@kems.test",
        )

        ensure_internal_account(
            db,
            naomie,
            "naomie@kems.test",
        )

        ensure_internal_account(
            db,
            parfait,
            "parfait@kems.test",
        )

        jean = get_or_create_contact(db)

        ensure_client_account(
            db,
            jean,
        )

        db.commit()

        print()
        print("KEMS demo auth ready")
        print("--------------------")
        print("santos@kems.test")
        print("naomie@kems.test")
        print("parfait@kems.test")
        print(
            "jean.dupont@client.kems.test"
        )
        print()
        print(
            f"Password: {DEMO_PASSWORD}"
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()
