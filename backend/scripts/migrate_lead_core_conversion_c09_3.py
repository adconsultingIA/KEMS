from sqlalchemy import (
    inspect,
    text,
)

from app.core.database import engine


TABLE = "leads"


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

    if (
        "core_converted_at"
        in existing_columns
    ):
        print(
            "[OK] colonne core_converted_at"
        )

        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE leads "
                "ADD COLUMN core_converted_at "
                "DATETIME"
            )
        )

    print(
        "[ADD] colonne core_converted_at"
    )

    print(
        "Migration C09.3 terminée."
    )


if __name__ == "__main__":
    main()
