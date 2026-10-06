from sqlalchemy import (
    inspect,
    text,
)

from app.core.database import engine


TABLE = "leads"


COLUMNS = {
    "contacted_at":
        "DATETIME",

    "qualification_started_at":
        "DATETIME",

    "disqualified_at":
        "DATETIME",
}


def main():
    inspector = inspect(
        engine
    )

    if (
        TABLE
        not in inspector.get_table_names()
    ):
        print(
            "Table leads absente."
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

    print(
        "Migration C09.2 terminée."
    )


if __name__ == "__main__":
    main()
