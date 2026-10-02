from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.models import (
    Action,
    AuthAccount,
    AuthSession,
    Contact,
    ContactOrganization,
    IngestionRecord,
    Lead,
    Opportunity,
    Organization,
    OrganizationalUnit,
    Profile,
    Role,
    Team,
    UserMembership,
)
from app.api.actions import router as actions_router
from app.api.auth import router as auth_router
from app.api.client_actions import router as client_actions_router
from app.api.contact_organizations import (
    router as contact_organizations_router,
)
from app.api.contacts import router as contacts_router
from app.api.deduplication import router as deduplication_router
from app.api.core import router as core_router
from app.api.ingestion import router as ingestion_router
from app.api.leads import router as leads_router
from app.api.opportunities import router as opportunities_router
from app.api.organizations import router as organizations_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="KEMS API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5179",
        "http://127.0.0.1:5179",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(actions_router)
app.include_router(core_router)
app.include_router(contacts_router)
app.include_router(deduplication_router)
app.include_router(ingestion_router)
app.include_router(organizations_router)
app.include_router(contact_organizations_router)
app.include_router(client_actions_router)
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
