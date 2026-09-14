from fastapi import FastAPI

from app.core.database import Base, engine
from app.models import Contact, Lead, Organization, Profile
from app.api.leads import router as leads_router


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KEMS Growth Engine API",
    version="1.0.0",
)

app.include_router(leads_router)


@app.get("/")
def root():
    return {
"app": "KEMS Growth Engine",
"status": "running",
}


@app.get("/health")
def health():
    return {
"status": "ok",
}