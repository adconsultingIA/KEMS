from sqlalchemy import inspect

from app.core.database import engine
from app.models.opportunity_handoff import (
    OpportunityHandoff,
)


def main():
    inspector = inspect(
        engine
    )

    tables = set(
        inspector.get_table_names()
    )

    if (
        "opportunity_handoffs"
        in tables
    ):
        print(
            "opportunity_handoffs existe déjà."
        )

        return

    OpportunityHandoff.__table__.create(
        bind=engine,
        checkfirst=True,
    )

    print(
        "opportunity_handoffs créée."
    )


if __name__ == "__main__":
    main()
