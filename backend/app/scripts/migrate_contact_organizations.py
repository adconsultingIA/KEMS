from sqlalchemy import select

from app.core.database import Base, SessionLocal, engine
from app.models.contact import Contact
from app.models.contact_organization import ContactOrganization
from app.models.organization import Organization


def main():
    Base.metadata.create_all(
        bind=engine
    )

    db = SessionLocal()

    created = 0
    skipped = 0

    try:
        contacts = db.scalars(
            select(Contact).where(
                Contact.organization_id.is_not(None)
            )
        ).all()

        for contact in contacts:
            organization = db.get(
                Organization,
                contact.organization_id,
            )

            if not organization:
                print(
                    "!",
                    contact.id,
                    "organisation legacy introuvable",
                )
                continue

            existing = db.scalar(
                select(ContactOrganization).where(
                    ContactOrganization.contact_id
                    == contact.id,
                    ContactOrganization.organization_id
                    == organization.id,
                    ContactOrganization.is_active.is_(True),
                )
            )

            if existing:
                skipped += 1
                continue

            link = ContactOrganization(
                contact_id=contact.id,
                organization_id=organization.id,
                relationship_type="employee",
                job_title=contact.job_title,
                relationship_role=contact.decision_role,
                is_primary=True,
                is_active=True,
            )

            db.add(link)
            created += 1

        db.commit()

        print(
            "Migration Contact ↔ Organization terminée."
        )
        print(
            f"Relations créées : {created}"
        )
        print(
            f"Relations déjà présentes : {skipped}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
