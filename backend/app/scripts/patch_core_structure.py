from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.organizational_unit import OrganizationalUnit
from app.models.profile import Profile
from app.models.role import Role
from app.models.user_membership import UserMembership


def get_unit(db, code: str):
    return db.scalar(
        select(OrganizationalUnit).where(
            OrganizationalUnit.code == code
        )
    )


def get_role(db, code: str):
    return db.scalar(
        select(Role).where(
            Role.code == code
        )
    )


def get_profile_by_name(db, full_name: str):
    return db.scalar(
        select(Profile).where(
            Profile.full_name == full_name
        )
    )


def ensure_fiduciaire(db):
    print("\n[1/4] Fiduciaire")

    unit = get_unit(db, "FIDUCIAIRE")

    if unit:
        print("  = FIDUCIAIRE existe déjà")
        return unit

    root = get_unit(db, "KEMS")

    if not root:
        raise RuntimeError(
            "Unité racine KEMS introuvable."
        )

    unit = OrganizationalUnit(
        name="Fiduciaire",
        code="FIDUCIAIRE",
        unit_type="department",
        parent_id=root.id,
        description=(
            "Activités fiduciaires, administratives "
            "et services associés."
        ),
        is_active=True,
    )

    db.add(unit)
    db.flush()

    print("  + FIDUCIAIRE")

    return unit


def move_mael_to_assurance(db):
    print("\n[2/4] Mael → Assurance")

    mael = get_profile_by_name(
        db,
        "Mael Néglokpé-Adjevi",
    )

    if not mael:
        raise RuntimeError(
            "Profil Mael Néglokpé-Adjevi introuvable."
        )

    assurance = get_unit(
        db,
        "ASSURANCE",
    )

    investissement = get_unit(
        db,
        "INVESTISSEMENT",
    )

    collaborator = get_role(
        db,
        "collaborator",
    )

    if not assurance or not investissement or not collaborator:
        raise RuntimeError(
            "Unités ou rôle système introuvables."
        )

    old_memberships = db.scalars(
        select(UserMembership).where(
            UserMembership.user_id == mael.id,
            UserMembership.unit_id == investissement.id,
            UserMembership.is_active.is_(True),
        )
    ).all()

    for membership in old_memberships:
        membership.is_active = False
        print("  - membership INVESTISSEMENT désactivé")

    existing_assurance = db.scalar(
        select(UserMembership).where(
            UserMembership.user_id == mael.id,
            UserMembership.unit_id == assurance.id,
            UserMembership.is_active.is_(True),
        )
    )

    if existing_assurance:
        print("  = membership ASSURANCE existe déjà")
        return

    membership = UserMembership(
        user_id=mael.id,
        unit_id=assurance.id,
        team_id=None,
        role_id=collaborator.id,
        is_primary=True,
        is_active=True,
    )

    db.add(membership)

    print("  + Mael → ASSURANCE")


def ensure_david(db, fiduciaire):
    print("\n[3/4] David")

    david = get_profile_by_name(
        db,
        "David",
    )

    if not david:
        david = Profile(
            full_name="David",
            email="david@demo.kems.local",
            role="fiduciaire",
            is_active=True,
        )

        db.add(david)
        db.flush()

        print("  + profil David")
    else:
        print("  = profil David existe déjà")

    collaborator = get_role(
        db,
        "collaborator",
    )

    if not collaborator:
        raise RuntimeError(
            "Rôle collaborator introuvable."
        )

    existing = db.scalar(
        select(UserMembership).where(
            UserMembership.user_id == david.id,
            UserMembership.unit_id == fiduciaire.id,
            UserMembership.is_active.is_(True),
        )
    )

    if existing:
        print("  = David → FIDUCIAIRE existe déjà")
        return

    membership = UserMembership(
        user_id=david.id,
        unit_id=fiduciaire.id,
        team_id=None,
        role_id=collaborator.id,
        is_primary=True,
        is_active=True,
    )

    db.add(membership)

    print("  + David → FIDUCIAIRE")


def print_structure(db):
    print("\n[4/4] Structure finale")
    print("-----------------------------------")

    units = db.scalars(
        select(OrganizationalUnit).order_by(
            OrganizationalUnit.name.asc()
        )
    ).all()

    memberships = db.scalars(
        select(UserMembership).where(
            UserMembership.is_active.is_(True)
        )
    ).all()

    profiles = {
        profile.id: profile
        for profile in db.scalars(
            select(Profile)
        ).all()
    }

    unit_map = {
        unit.id: unit
        for unit in units
    }

    print("KEMS Concept")

    for unit in units:
        if unit.code == "KEMS":
            continue

        print(f"├── {unit.name}")

        unit_memberships = [
            membership
            for membership in memberships
            if membership.unit_id == unit.id
        ]

        for membership in unit_memberships:
            profile = profiles.get(
                membership.user_id
            )

            if profile:
                print(
                    f"│   └── {profile.full_name}"
                )

    print("-----------------------------------")


def main():
    db = SessionLocal()

    try:
        fiduciaire = ensure_fiduciaire(db)

        move_mael_to_assurance(db)

        ensure_david(
            db,
            fiduciaire,
        )

        db.commit()

        print_structure(db)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
