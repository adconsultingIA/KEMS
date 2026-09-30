from sqlalchemy import inspect, text

from app.core.database import engine


COLUMNS = {
    "source_type": (
        "VARCHAR NOT NULL DEFAULT 'manual'"
    ),
    "source_reference": "VARCHAR",
    "verification_status": (
        "VARCHAR NOT NULL DEFAULT 'unverified'"
    ),
    "is_active": (
        "BOOLEAN NOT NULL DEFAULT 1"
    ),
    "notes": "TEXT",
    "collected_at": "DATETIME",
    "last_verified_at": "DATETIME",
}


def main():
    inspector = inspect(engine)

    tables = inspector.get_table_names()

    if "contacts" not in tables:
        print(
            "Table contacts absente. "
            "Elle sera créée par SQLAlchemy."
        )
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns(
            "contacts"
        )
    }

    with engine.begin() as connection:
        for name, definition in COLUMNS.items():
            if name in existing_columns:
                print(
                    f"= colonne {name} déjà présente"
                )
                continue

            sql = (
                f"ALTER TABLE contacts "
                f"ADD COLUMN {name} {definition}"
            )

            connection.execute(
                text(sql)
            )

            print(
                f"+ colonne {name}"
            )

    print(
        "Migration Contact Registry terminée."
    )


if __name__ == "__main__":
    main()
