from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from .database import Base, engine, SessionLocal
from . import models
from .routers import contacts, deals, organizations, stages

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed de etapas padrão (apenas se não houver nenhuma)
        if db.query(models.Stage).count() == 0:
            for name, order in [("Novo", 1), ("Qualificação", 2), ("Proposta", 3), ("Fechamento", 4)]:
                db.add(models.Stage(name=name, order=order))
            db.commit()
    finally:
        db.close()

app = FastAPI(title="Consultoria Jurídica - CRM")

init_db()

app.include_router(contacts.router)
app.include_router(deals.router)
app.include_router(organizations.router)
app.include_router(stages.router)

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {"status": "ok"}