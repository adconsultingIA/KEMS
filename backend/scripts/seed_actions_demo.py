from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select

from app.core.database import Base, SessionLocal, engine
from app.models.action import Action
from app.models.contact import Contact
from app.models.organizational_unit import OrganizationalUnit
from app.models.profile import Profile


DEMO_SOURCE = "demo_seed"


def utcnow():
    return datetime.now(
        UTC
    ).replace(
        tzinfo=None
    )


def get_profile(
    db,
    email: str,
) -> Profile:
    profile = db.scalar(
        select(Profile).where(
            func.lower(Profile.email)
            == email.lower()
        )
    )

    if not profile:
        raise RuntimeError(
            f"Profil introuvable : {email}"
        )

    return profile


def get_unit(
    db,
    code: str,
) -> OrganizationalUnit:
    unit = db.scalar(
        select(OrganizationalUnit).where(
            func.lower(
                OrganizationalUnit.code
            )
            == code.lower()
        )
    )

    if not unit:
        raise RuntimeError(
            f"Unité introuvable : {code}"
        )

    return unit


def get_demo_contact(
    db,
) -> Contact | None:
    return db.scalar(
        select(Contact).where(
            func.lower(Contact.first_name)
            == "jean",
            func.lower(Contact.last_name)
            == "dupont",
            Contact.is_active.is_(True),
        )
    )


def main():
    Base.metadata.create_all(
        bind=engine
    )

    db = SessionLocal()

    try:
        santos = get_profile(
            db,
            "santos@kems.test",
        )

        naomie = get_profile(
            db,
            "naomie@kems.test",
        )

        parfait = get_profile(
            db,
            "parfait@kems.test",
        )

        direction = get_unit(
            db,
            "DIRECTION",
        )

        assurance = get_unit(
            db,
            "ASSURANCE",
        )

        technologies = get_unit(
            db,
            "TECHNOLOGIES",
        )

        jean = get_demo_contact(
            db
        )

        # Seed idempotent :
        # on remplace uniquement nos actions de démonstration.
        db.execute(
            delete(Action).where(
                Action.source_type
                == DEMO_SOURCE
            )
        )

        now = utcnow()

        actions = [
            Action(
                title="Ticket critique client",
                description=(
                    "Incident prioritaire à "
                    "prendre en charge côté "
                    "Technologies."
                ),
                status="todo",
                priority="critical",
                context="technologies",
                owner_profile_id=parfait.id,
                unit_id=technologies.id,
                contact_id=(
                    jean.id
                    if jean
                    else None
                ),
                source_type=DEMO_SOURCE,
                source_entity_type="ticket",
                source_entity_id="TECH-TICKET-001",
                created_by_profile_id=santos.id,
                due_at=now,
            ),
            Action(
                title="Relancer le devis Technologies",
                description=(
                    "Le devis est ouvert et "
                    "attend une relance client."
                ),
                status="todo",
                priority="high",
                context="technologies",
                owner_profile_id=parfait.id,
                unit_id=technologies.id,
                source_type=DEMO_SOURCE,
                source_entity_type="quote",
                source_entity_id="TECH-QUOTE-001",
                created_by_profile_id=santos.id,
                due_at=(
                    now
                    + timedelta(days=1)
                ),
            ),
            Action(
                title="Valider le livrable projet",
                description=(
                    "Validation finale avant "
                    "transmission au client."
                ),
                status="in_progress",
                priority="medium",
                context="technologies",
                owner_profile_id=parfait.id,
                unit_id=technologies.id,
                source_type=DEMO_SOURCE,
                source_entity_type="deliverable",
                source_entity_id="TECH-DELIVERY-001",
                created_by_profile_id=parfait.id,
                due_at=(
                    now
                    + timedelta(days=2)
                ),
            ),
            Action(
                title="Préparer renouvellement Assurance",
                description=(
                    "Vérifier le dossier et "
                    "préparer le renouvellement."
                ),
                status="todo",
                priority="high",
                context="assurance",
                owner_profile_id=naomie.id,
                unit_id=assurance.id,
                contact_id=(
                    jean.id
                    if jean
                    else None
                ),
                source_type=DEMO_SOURCE,
                source_entity_type="renewal",
                source_entity_id="ASSURANCE-REN-001",
                created_by_profile_id=santos.id,
                due_at=(
                    now
                    + timedelta(days=3)
                ),
            ),
            Action(
                title="Vérifier pièces du dossier",
                description=(
                    "Contrôler les documents "
                    "manquants du dossier Assurance."
                ),
                status="todo",
                priority="medium",
                context="assurance",
                owner_profile_id=naomie.id,
                unit_id=assurance.id,
                source_type=DEMO_SOURCE,
                source_entity_type="case",
                source_entity_id="ASSURANCE-CASE-001",
                created_by_profile_id=naomie.id,
                due_at=(
                    now
                    + timedelta(days=4)
                ),
            ),
            Action(
                title="Qualifier nouvelle opportunité",
                description=(
                    "Nouvelle opportunité issue "
                    "du Growth Engine."
                ),
                status="todo",
                priority="medium",
                context="commercial",
                owner_profile_id=None,
                unit_id=None,
                source_type=DEMO_SOURCE,
                source_entity_type="opportunity",
                source_entity_id="COMM-OPP-001",
                created_by_profile_id=santos.id,
                due_at=(
                    now
                    + timedelta(days=1)
                ),
            ),
            Action(
                title="Revoir profil investisseur",
                description=(
                    "Actualiser le profil avant "
                    "la prochaine recommandation."
                ),
                status="todo",
                priority="medium",
                context="investissement",
                owner_profile_id=None,
                source_type=DEMO_SOURCE,
                source_entity_type="investment_profile",
                source_entity_id="INV-PROFILE-001",
                created_by_profile_id=santos.id,
                due_at=(
                    now
                    + timedelta(days=5)
                ),
            ),
            Action(
                title="Échéance mandat Fiduciaire",
                description=(
                    "Préparer les éléments "
                    "nécessaires avant échéance."
                ),
                status="todo",
                priority="high",
                context="fiduciaire",
                owner_profile_id=None,
                source_type=DEMO_SOURCE,
                source_entity_type="mandate",
                source_entity_id="FID-MANDATE-001",
                created_by_profile_id=santos.id,
                due_at=(
                    now
                    + timedelta(days=6)
                ),
            ),
            Action(
                title="Contrôler un doublon potentiel",
                description=(
                    "Le moteur Core a identifié "
                    "une identité à vérifier."
                ),
                status="todo",
                priority="medium",
                context="core",
                owner_profile_id=santos.id,
                unit_id=direction.id,
                source_type=DEMO_SOURCE,
                source_entity_type="duplicate_candidate",
                source_entity_id="CORE-DUP-001",
                created_by_profile_id=santos.id,
                due_at=(
                    now
                    + timedelta(days=2)
                ),
            ),
        ]

        db.add_all(actions)

        db.commit()

        print()
        print("KEMS Action Center demo ready")
        print("-----------------------------")
        print(
            f"{len(actions)} actions créées"
        )
        print()
        print(
            "Technologies : 3"
        )
        print(
            "Assurance    : 2"
        )
        print(
            "Commercial   : 1"
        )
        print(
            "Investissement : 1"
        )
        print(
            "Fiduciaire   : 1"
        )
        print(
            "Core         : 1"
        )
        print()

    finally:
        db.close()


if __name__ == "__main__":
    main()
