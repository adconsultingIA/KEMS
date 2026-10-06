from sqlalchemy import (
    inspect,
    text,
)

from app.core.database import engine


TABLE = "leads"


COLUMNS = {
    "lead_type":
        "VARCHAR NOT NULL DEFAULT 'b2c'",

    "first_name":
        "VARCHAR",

    "last_name":
        "VARCHAR",

    "company_name":
        "VARCHAR",

    "email":
        "VARCHAR",

    "phone":
        "VARCHAR",

    "city":
        "VARCHAR",

    "country":
        "VARCHAR",
}


INDEXES = {
    "ix_leads_lead_type":
        "lead_type",

    "ix_leads_first_name":
        "first_name",

    "ix_leads_last_name":
        "last_name",

    "ix_leads_company_name":
        "company_name",

    "ix_leads_email":
        "email",

    "ix_leads_phone":
        "phone",
}


def main():
    inspector = inspect(
        engine
    )

    tables = set(
        inspector.get_table_names()
    )

    if (
        TABLE
        not in tables
    ):
        print(
            "Table leads absente : "
            "aucune migration nécessaire."
        )

        return

    existing_columns = {
        column["name"]
        for column
        in inspector.get_columns(
            TABLE
        )
    }

    with engine.begin() as connection:
        for name, sql_type in (
            COLUMNS.items()
        ):
            if (
                name
                in existing_columns
            ):
                print(
                    f"[OK] colonne {name}"
                )

                continue

            connection.execute(
                text(
                    f"ALTER TABLE {TABLE} "
                    f"ADD COLUMN {name} "
                    f"{sql_type}"
                )
            )

            print(
                f"[ADD] colonne {name}"
            )

    # Refresh inspector after ALTER TABLE.
    inspector = inspect(
        engine
    )

    existing_indexes = {
        index["name"]
        for index
        in inspector.get_indexes(
            TABLE
        )
    }

    with engine.begin() as connection:
        for index_name, column_name in (
            INDEXES.items()
        ):
            if (
                index_name
                in existing_indexes
            ):
                print(
                    f"[OK] index {index_name}"
                )

                continue

            connection.execute(
                text(
                    f"CREATE INDEX "
                    f"{index_name} "
                    f"ON {TABLE} "
                    f"({column_name})"
                )
            )

            print(
                f"[ADD] index {index_name}"
            )

    print(
        "Migration C09.1 terminée."
    )


if __name__ == "__main__":
    main()
