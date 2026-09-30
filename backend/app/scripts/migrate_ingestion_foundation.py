from sqlalchemy import inspect

from app.core.database import Base, engine
from app.models.ingestion_record import IngestionRecord


def main():
    Base.metadata.create_all(
        bind=engine
    )

    inspector = inspect(engine)

    tables = inspector.get_table_names()

    if "ingestion_records" not in tables:
        raise RuntimeError(
            "La table ingestion_records "
            "n'a pas été créée."
        )

    print(
        "+ table ingestion_records prête"
    )

    print()
    print("Colonnes :")

    for column in inspector.get_columns(
        "ingestion_records"
    ):
        print(
            "-",
            column["name"],
            column["type"],
        )

    print()
    print(
        "Migration Ingestion Foundation terminée."
    )


if __name__ == "__main__":
    main()
