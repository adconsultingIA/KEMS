from fastapi import FastAPI

from app.core.database import Base, engine
from app.models import (
    Contact,
    Lead,
    Opportunity,
    Organization,
    OrganizationalUnit,
    Profile,
    Role,
    Team,
    UserMembership,
)
from app.api.core import router as core_router
from app.api.leads import router as leads_router
from app.api.opportunities import router as opportunities_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="KEMS API",
    version="1.0.0",
)


app.include_router(core_router)
app.include_router(leads_router)
app.include_router(opportunities_router)


@app.get("/")
def root():
    return {
        "app": "KEMS",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }
