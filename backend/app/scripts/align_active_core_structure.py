from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.organizational_unit import OrganizationalUnit
from app.models.profile import Profile
from app.models.role import Role
from app.models.user_membership import UserMembership


BUSINESS_UNITS = [
    {
        "name": "Direction",
        "code": "DIRECTION",
        "description": "Direction générale et pilotage de KEMS Concept.",
    },
    {
        "name": "Commercial",
        "code": "COMMERCIAL",
        "description": "Développement commercial et Growth Engine.",
    },
    {
        "name": "Assurance",
        "code": "ASSURANCE",
        "description": "Activités et opérations du métier Assurance.",
    },
    {
        "name": "Investissement",
        "code": "INVESTISSEMENT",
        "description": "Activités et opérations du métier Investissement.",
    },
    {
        "name": "Fiduciaire",
        "code": "FIDUCIAIRE",
        "description": "Activités fiduciaires, administratives et services associés.",
    },
    {
        "name": "Technologies",
        "code": "TECHNOLOGIES",
        "description": "Technologies, architecture et développement.",
    },
]


def get_unit(db, code):
    return db.scalar(
        select(OrganizationalUnit).where(
            OrganizationalUnit.code == code
        )
    )


def get_role(db, code):
    return db.scalar(
        select(Role).where(
            Role.code == code
        )
    )


def get_profile(db, full_name):
    return db.scalar(
        select(Profile).where(
            Profile.full_name == full_name
        )
    )


def ensure_root(db):
    print("\n[1/4] Racine KEMS")

    root = get_unit(
        db,
        "KEMS",
    )

    if root:
        print("  = KEMS existe déjà")

        if root.parent_id is not None:
            root.parent_id = None

        root.is_active = True

        return root

    root = OrganizationalUnit(
        name="KEMS Concept",
        code="KEMS",
        unit_type="root",
        parent_id=None,
        description=(
            "Racine organisationnelle de KEMS Concept."
        ),
        is_active=True,
    )

    db.add(root)
    db.flush()

    print("  + KEMS Concept")

    return root


def ensure_business_units(
    db,
    root,
):
    print("\n[2/4] Unités métier")

    for item in BUSINESS_UNITS:
        unit = get_unit(
            db,
            item["code"],
        )

        if unit:
            changed = False

            if unit.parent_id != root.id:
                unit.parent_id = root.id
                changed = True

            if not unit.is_active:
                unit.is_active = True
                changed = True

            if changed:
                print(
                    f"  ~ {item['code']} rattaché à KEMS"
                )
            else:
                print(
                    f"  = {item['code']} déjà aligné"
                )

            continue

        unit = OrganizationalUnit(
            name=item["name"],
            code=item["code"],
            unit_type="business_unit",
            parent_id=root.id,
            description=item["description"],
            is_active=True,
        )

        db.add(unit)
        db.flush()

        print(
            f"  + {item['code']}"
        )


def ensure_parfait_memberships(db):
    print("\n[3/4] Parfait ADJANOR")

    parfait = get_profile(
        db,
        "Parfait ADJANOR",
    )

    if not parfait:
        raise RuntimeError(
            "Profil Parfait ADJANOR introuvable."
        )

    technologies = get_unit(
        db,
        "TECHNOLOGIES",
    )

    commercial = get_unit(
        db,
        "COMMERCIAL",
    )

    admin = get_role(
        db,
        "admin",
    )

    if (
        not technologies
        or not commercial
        or not admin
    ):
        raise RuntimeError(
            "Technologies, Commercial ou rôle admin introuvable."
        )

    memberships = db.scalars(
        select(UserMembership).where(
            UserMembership.user_id
            == parfait.id,
            UserMembership.is_active.is_(True),
        )
    ).all()

    technologies_membership = next(
        (
            membership
            for membership
            in memberships
            if membership.unit_id
            == technologies.id
        ),
        None,
    )

    if not technologies_membership:
        technologies_membership = UserMembership(
            user_id=parfait.id,
            unit_id=technologies.id,
            team_id=None,
            role_id=admin.id,
            is_primary=True,
            is_active=True,
        )

        db.add(
            technologies_membership
        )

        print(
            "  + Technologies principal"
        )
    else:
        technologies_membership.is_primary = True

        print(
            "  = Technologies principal"
        )

    commercial_membership = next(
        (
            membership
            for membership
            in memberships
            if membership.unit_id
            == commercial.id
        ),
        None,
    )

    if not commercial_membership:
        commercial_membership = UserMembership(
            user_id=parfait.id,
            unit_id=commercial.id,
            team_id=None,
            role_id=admin.id,
            is_primary=False,
            is_active=True,
        )

        db.add(
            commercial_membership
        )

        print(
            "  + Commercial secondaire"
        )
    else:
        commercial_membership.is_primary = False

        print(
            "  = Commercial secondaire"
        )

    # Une seule appartenance principale :
    # Technologies.
    for membership in memberships:
        if (
            membership.unit_id
            not in {
                technologies.id,
                commercial.id,
            }
        ):
            membership.is_primary = False


def print_structure(db):
    print("\n[4/4] Structure KEMS active")
    print("-----------------------------------")

    root = get_unit(
        db,
        "KEMS",
    )

    units = db.scalars(
        select(OrganizationalUnit)
        .where(
            OrganizationalUnit.is_active.is_(True)
        )
        .order_by(
            OrganizationalUnit.name
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

    print(
        root.name
        if root
        else "KEMS Concept"
    )

    children = [
        unit
        for unit in units
        if root
        and unit.parent_id
        == root.id
    ]

    for unit in children:
        print(
            f"├── {unit.name} [{unit.code}]"
        )

        unit_memberships = [
            membership
            for membership
            in memberships
            if membership.unit_id
            == unit.id
        ]

        for membership in unit_memberships:
            profile = profiles.get(
                membership.user_id
            )

            if not profile:
                continue

            primary = (
                "principal"
                if membership.is_primary
                else "secondaire"
            )

            print(
                "│   └── "
                f"{profile.full_name} "
                f"({primary})"
            )

    print("-----------------------------------")


def main():
    db = SessionLocal()

    try:
        root = ensure_root(
            db
        )

        ensure_business_units(
            db,
            root,
        )

        ensure_parfait_memberships(
            db
        )

        db.commit()

        print_structure(
            db
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
