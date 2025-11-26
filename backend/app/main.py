import os
# Startup sequence
from .logging_config import configure_logging
configure_logging()
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from .database import Base, engine, log_engine_info, apply_minimal_schema_patch
from .routers import contacts, deals, organizations, stages, tenants
from .middleware import RequestContextMiddleware
from .routers import lead_scores
from .routers import documents
from fastapi.middleware.cors import CORSMiddleware

def init_db():
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Consultoria Jurídica - CRM")
app.middleware("http")(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
# NOVO: aplicar patch de schema para colunas novas (PostgreSQL)
apply_minimal_schema_patch(engine)
log_engine_info()

app.include_router(tenants.router)
app.include_router(contacts.router)
app.include_router(deals.router)
app.include_router(organizations.router)
app.include_router(stages.router)
app.include_router(lead_scores.router)
app.include_router(documents.router)

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {"status": "ok"}
