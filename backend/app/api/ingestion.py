from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.ingestion_record import IngestionRecord
from app.schemas.ingestion import (
    ContactIngestionCreate,
    IngestionRecordResponse,
    IngestionResult,
    OrganizationIngestionCreate,
)
from app.services.ingestion import (
    ingest_contact,
    ingest_organization,
)


router = APIRouter(
    prefix="/api/v1/core/ingestion",
    tags=["KEMS Core - Ingestion"],
)


def serialize_result(
    record: IngestionRecord,
) -> IngestionResult:
    return IngestionResult(
        ingestion_id=record.id,
        entity_type=record.entity_type,
        status=record.status,
        entity_id=record.entity_id,
        candidate_entity_id=(
            record.candidate_entity_id
        ),
        match_score=record.match_score,
        match_reason=record.match_reason,
    )


@router.post(
    "/contacts",
    response_model=IngestionResult,
    status_code=201,
)
def ingest_contact_endpoint(
    payload: ContactIngestionCreate,
    db: Session = Depends(get_db),
):
    record = ingest_contact(
        db,
        payload,
    )

    db.commit()
    db.refresh(record)

    return serialize_result(
        record
    )


@router.post(
    "/organizations",
    response_model=IngestionResult,
    status_code=201,
)
def ingest_organization_endpoint(
    payload: OrganizationIngestionCreate,
    db: Session = Depends(get_db),
):
    record = ingest_organization(
        db,
        payload,
    )

    db.commit()
    db.refresh(record)

    return serialize_result(
        record
    )


@router.get(
    "/records",
    response_model=list[
        IngestionRecordResponse
    ],
)
def list_ingestion_records(
    entity_type: str | None = Query(
        default=None
    ),
    status: str | None = Query(
        default=None
    ),
    source_type: str | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
):
    statement = select(
        IngestionRecord
    )

    if entity_type:
        statement = statement.where(
            IngestionRecord.entity_type
            == entity_type
        )

    if status:
        statement = statement.where(
            IngestionRecord.status
            == status
        )

    if source_type:
        statement = statement.where(
            IngestionRecord.source_type
            == source_type
        )

    statement = statement.order_by(
        IngestionRecord.created_at.desc()
    )

    return db.scalars(
        statement
    ).all()


@router.get(
    "/records/{ingestion_id}",
    response_model=IngestionRecordResponse,
)
def get_ingestion_record(
    ingestion_id: str,
    db: Session = Depends(get_db),
):
    record = db.get(
        IngestionRecord,
        ingestion_id,
    )

    if not record:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=(
                "Enregistrement "
                "d'ingestion introuvable."
            ),
        )

    return record
