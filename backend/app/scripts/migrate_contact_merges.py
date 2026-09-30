from sqlalchemy import inspect, text

from app.core.database import Base, engine
from app.models.contact_merge import ContactMerge


def main():
    inspector = inspect(engine)

    contact_columns = {
        column["name"]
        for column in inspector.get_columns(
            "contacts"
        )
    }

    if (
        "merged_into_contact_id"
        not in contact_columns
    ):
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE contacts "
                    "ADD COLUMN "
                    "merged_into_contact_id VARCHAR"
                )
            )

        print(
            "+ contacts.merged_into_contact_id"
        )

    else:
        print(
            "= contacts.merged_into_contact_id"
        )

    Base.metadata.create_all(
        bind=engine
    )

    inspector = inspect(engine)

    if "contact_merges" in inspector.get_table_names():
        print(
            "+ table contact_merges prête"
        )
    else:
        raise RuntimeError(
            "La table contact_merges "
            "n'a pas été créée."
        )

    print(
        "Migration Contact Merge terminée."
    )


if __name__ == "__main__":
    main()
