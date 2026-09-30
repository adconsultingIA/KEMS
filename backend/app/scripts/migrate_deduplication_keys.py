from sqlalchemy import inspect, select, text

from app.core.database import SessionLocal, engine
from app.models.contact import Contact
from app.models.organization import Organization
from app.services.identity_normalization import (
    build_contact_name_key,
    build_organization_name_key,
)


def ensure_columns():
    inspector = inspect(engine)

    with engine.begin() as connection:
        contact_columns = {
            column["name"]
            for column in inspector.get_columns(
                "contacts"
            )
        }

        if "normalized_name" not in contact_columns:
            connection.execute(
                text(
                    "ALTER TABLE contacts "
                    "ADD COLUMN normalized_name VARCHAR"
                )
            )

            print(
                "+ contacts.normalized_name"
            )
        else:
            print(
                "= contacts.normalized_name"
            )

        organization_columns = {
            column["name"]
            for column in inspector.get_columns(
                "organizations"
            )
        }

        if (
            "normalized_name"
            not in organization_columns
        ):
            connection.execute(
                text(
                    "ALTER TABLE organizations "
                    "ADD COLUMN normalized_name VARCHAR"
                )
            )

            print(
                "+ organizations.normalized_name"
            )
        else:
            print(
                "= organizations.normalized_name"
            )


def backfill_keys():
    db = SessionLocal()

    try:
        contacts = db.scalars(
            select(Contact)
        ).all()

        for contact in contacts:
            contact.normalized_name = (
                build_contact_name_key(
                    contact.first_name,
                    contact.last_name,
                )
            )

        organizations = db.scalars(
            select(Organization)
        ).all()

        for organization in organizations:
            organization.normalized_name = (
                build_organization_name_key(
                    organization.name
                )
            )

        db.commit()

        print(
            f"Contacts normalisés : "
            f"{len(contacts)}"
        )

        print(
            f"Organizations normalisées : "
            f"{len(organizations)}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def main():
    ensure_columns()
    backfill_keys()

    print(
        "Migration clés de déduplication terminée."
    )


if __name__ == "__main__":
    main()
