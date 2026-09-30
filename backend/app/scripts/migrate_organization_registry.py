from sqlalchemy import inspect, text

from app.core.database import engine


COLUMNS = {
    "domain": "VARCHAR",
    "source_type": (
        "VARCHAR NOT NULL DEFAULT 'manual'"
    ),
    "source_reference": "VARCHAR",
    "verification_status": (
        "VARCHAR NOT NULL DEFAULT 'unverified'"
    ),
    "is_verified": (
        "BOOLEAN NOT NULL DEFAULT 0"
    ),
    "is_active": (
        "BOOLEAN NOT NULL DEFAULT 1"
    ),
    "collected_at": "DATETIME",
    "last_verified_at": "DATETIME",
}


def main():
    inspector = inspect(engine)

    tables = inspector.get_table_names()

    if "organizations" not in tables:
        print(
            "Table organizations absente. "
            "Elle sera créée par SQLAlchemy."
        )
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns(
            "organizations"
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
                f"ALTER TABLE organizations "
                f"ADD COLUMN {name} {definition}"
            )

            connection.execute(
                text(sql)
            )

            print(
                f"+ colonne {name}"
            )

    print(
        "Migration Organization Registry terminée."
    )


if __name__ == "__main__":
    main()
