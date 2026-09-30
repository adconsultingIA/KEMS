from sqlalchemy import select

from app.core.database import Base, SessionLocal, engine
from app.models.organizational_unit import OrganizationalUnit
from app.models.profile import Profile
from app.models.role import Role
from app.models.user_membership import UserMembership


UNITS = [
    {
        "name": "KEMS Concept",
        "code": "KEMS",
        "unit_type": "root",
        "description": "Racine organisationnelle de KEMS Concept.",
        "parent_code": None,
    },
    {
        "name": "Direction",
        "code": "DIRECTION",
        "unit_type": "department",
        "description": "Direction générale et pilotage de KEMS Concept.",
        "parent_code": "KEMS",
    },
    {
        "name": "Commercial",
        "code": "COMMERCIAL",
        "unit_type": "department",
        "description": "Développement commercial et Growth Engine.",
        "parent_code": "KEMS",
    },
    {
        "name": "Assurance",
        "code": "ASSURANCE",
        "unit_type": "department",
        "description": "Activités et opérations du métier Assurance.",
        "parent_code": "KEMS",
    },
    {
        "name": "Investissement",
        "code": "INVESTISSEMENT",
        "unit_type": "department",
        "description": "Activités et opérations du métier Investissement.",
        "parent_code": "KEMS",
    },
    {
        "name": "Technologies",
        "code": "TECHNOLOGIES",
        "unit_type": "department",
        "description": "Technologies, architecture et développement.",
        "parent_code": "KEMS",
    },
]


ROLES = [
    {
        "code": "admin",
        "name": "Administrateur",
        "description": (
            "Administration générale du socle KEMS. "
            "Les permissions fines seront ajoutées en C03."
        ),
        "is_system": True,
    },
    {
        "code": "manager",
        "name": "Responsable",
        "description": "Responsable d'une unité organisationnelle.",
        "is_system": True,
    },
    {
        "code": "collaborator",
        "name": "Collaborateur",
        "description": "Collaborateur standard de KEMS Concept.",
        "is_system": True,
    },
]


PROFILES = [
    {
        "full_name": "Euloge Santos",
        "email": "euloge.santos@demo.kems.local",
        "legacy_role": "direction",
        "unit_code": "DIRECTION",
        "role_code": "manager",
    },
    {
        "full_name": "Naomie Nassara",
        "email": "naomie.nassara@demo.kems.local",
        "legacy_role": "assurance",
        "unit_code": "ASSURANCE",
        "role_code": "collaborator",
    },
    {
        "full_name": "Mael Néglokpé-Adjevi",
        "email": "mael.neglokpe-adjevi@demo.kems.local",
        "legacy_role": "investissement",
        "unit_code": "INVESTISSEMENT",
        "role_code": "collaborator",
    },
    {
        "full_name": "Parfait ADJANOR",
        "email": "parfait.adjanor@demo.kems.local",
        "legacy_role": "technologies",
        "unit_code": "TECHNOLOGIES",
        "role_code": "admin",
    },
]


def get_unit_by_code(db, code: str) -> OrganizationalUnit | None:
    return db.scalar(
        select(OrganizationalUnit).where(
            OrganizationalUnit.code == code
        )
    )


def get_role_by_code(db, code: str) -> Role | None:
    return db.scalar(
        select(Role).where(
            Role.code == code
        )
    )


def get_profile_by_email(db, email: str) -> Profile | None:
    return db.scalar(
        select(Profile).where(
            Profile.email == email
        )
    )


def ensure_units(db):
    print("\n[1/4] Unités organisationnelles")

    unit_map: dict[str, OrganizationalUnit] = {}

    for item in UNITS:
        unit = get_unit_by_code(db, item["code"])

        if unit:
            unit_map[item["code"]] = unit
            print(f"  = {item['code']} existe déjà")
            continue

        parent_id = None

        if item["parent_code"]:
            parent = unit_map.get(
                item["parent_code"]
            ) or get_unit_by_code(
                db,
                item["parent_code"],
            )

            if not parent:
                raise RuntimeError(
                    "Unité parente introuvable : "
                    f"{item['parent_code']}"
                )

            parent_id = parent.id

        unit = OrganizationalUnit(
            name=item["name"],
            code=item["code"],
            unit_type=item["unit_type"],
            parent_id=parent_id,
            description=item["description"],
            is_active=True,
        )

        db.add(unit)
        db.flush()

        unit_map[item["code"]] = unit
        print(f"  + {item['code']}")

    return unit_map


def ensure_roles(db):
    print("\n[2/4] Rôles système")

    role_map: dict[str, Role] = {}

    for item in ROLES:
        role = get_role_by_code(
            db,
            item["code"],
        )

        if role:
            role_map[item["code"]] = role
            print(f"  = {item['code']} existe déjà")
            continue

        role = Role(
            code=item["code"],
            name=item["name"],
            description=item["description"],
            is_system=item["is_system"],
        )

        db.add(role)
        db.flush()

        role_map[item["code"]] = role
        print(f"  + {item['code']}")

    return role_map


def ensure_profiles(db):
    print("\n[3/4] Profils de démonstration")

    profile_map: dict[str, Profile] = {}

    for item in PROFILES:
        profile = get_profile_by_email(
            db,
            item["email"],
        )

        if profile:
            profile_map[item["email"]] = profile
            print(f"  = {item['full_name']} existe déjà")
            continue

        profile = Profile(
            full_name=item["full_name"],
            email=item["email"],
            role=item["legacy_role"],
            is_active=True,
        )

        db.add(profile)
        db.flush()

        profile_map[item["email"]] = profile
        print(f"  + {item['full_name']}")

    return profile_map


def ensure_memberships(
    db,
    unit_map,
    role_map,
    profile_map,
):
    print("\n[4/4] Memberships")

    for item in PROFILES:
        profile = profile_map[item["email"]]
        unit = unit_map[item["unit_code"]]
        role = role_map[item["role_code"]]

        existing = db.scalar(
            select(UserMembership).where(
                UserMembership.user_id == profile.id,
                UserMembership.unit_id == unit.id,
                UserMembership.role_id == role.id,
                UserMembership.is_active.is_(True),
            )
        )

        if existing:
            print(
                "  = "
                f"{item['full_name']} "
                f"→ {item['unit_code']} "
                "existe déjà"
            )
            continue

        membership = UserMembership(
            user_id=profile.id,
            unit_id=unit.id,
            team_id=None,
            role_id=role.id,
            is_primary=True,
            is_active=True,
        )

        db.add(membership)

        print(
            "  + "
            f"{item['full_name']} "
            f"→ {item['unit_code']} "
            f"({item['role_code']})"
        )


def print_summary(db):
    print("\n-----------------------------------")
    print("KEMS CORE — Bootstrap terminé")
    print("-----------------------------------")

    units = db.scalars(
        select(OrganizationalUnit).order_by(
            OrganizationalUnit.code.asc()
        )
    ).all()

    roles = db.scalars(
        select(Role).order_by(
            Role.code.asc()
        )
    ).all()

    profiles = db.scalars(
        select(Profile).order_by(
            Profile.full_name.asc()
        )
    ).all()

    memberships = db.scalars(
        select(UserMembership).where(
            UserMembership.is_active.is_(True)
        )
    ).all()

    print(f"Unités       : {len(units)}")
    print(f"Rôles        : {len(roles)}")
    print(f"Profils      : {len(profiles)}")
    print(f"Memberships  : {len(memberships)}")


def main():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        unit_map = ensure_units(db)
        role_map = ensure_roles(db)
        profile_map = ensure_profiles(db)

        ensure_memberships(
            db,
            unit_map,
            role_map,
            profile_map,
        )

        db.commit()

        print_summary(db)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
