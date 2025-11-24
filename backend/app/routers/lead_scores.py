# módulo routers/lead_scores.py — adicionar endpoint de compute

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas
from ..audit import record_audit_event

# função compute_lead_score no módulo routers/lead_scores.py
router = APIRouter(prefix="/lead-scores", tags=["lead-scores"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_tenant_id(x_tenant_id: int = Header(..., alias="X-Tenant-ID")) -> int:
    return x_tenant_id

@router.post("/", response_model=schemas.LeadScoreRead, status_code=201)
def create_lead_score(
    payload: schemas.LeadScoreCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    if not payload.contact_id and not payload.deal_id:
        raise HTTPException(status_code=400, detail="Either contact_id or deal_id is required")

    if payload.contact_id:
        contact = (
            db.query(models.Contact)
            .filter(models.Contact.id == payload.contact_id, models.Contact.tenant_id == tenant_id)
            .first()
        )
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found or tenant mismatch")
    if payload.deal_id:
        deal = (
            db.query(models.Deal)
            .filter(models.Deal.id == payload.deal_id, models.Deal.tenant_id == tenant_id)
            .first()
        )
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found or tenant mismatch")

    entry = models.LeadScore(
        tenant_id=tenant_id,
        contact_id=payload.contact_id,
        deal_id=payload.deal_id,
        score=payload.score,
        model_version=payload.model_version,
        factors=payload.factors,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="SCORE",
        entity_name="LeadScore",
        entity_id=entry.id,
        before=None,
        after={
            "score": entry.score,
            "model_version": entry.model_version,
            "contact_id": entry.contact_id,
            "deal_id": entry.deal_id,
        },
        details={"factors": entry.factors} if entry.factors else None,
    )
    return entry

@router.get("/", response_model=list[schemas.LeadScoreRead])
def list_lead_scores(
    contact_id: int | None = Query(default=None),
    deal_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
):
    q = db.query(models.LeadScore).filter(models.LeadScore.tenant_id == tenant_id)
    if contact_id is not None:
        q = q.filter(models.LeadScore.contact_id == contact_id)
    if deal_id is not None:
        q = q.filter(models.LeadScore.deal_id == deal_id)
    return q.order_by(models.LeadScore.created_at.desc()).all()

@router.post("/compute", response_model=schemas.LeadScoreRead, status_code=201)
def compute_lead_score(
    contact_id: int | None = Query(default=None),
    deal_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    # Seleção de contexto: prioriza o deal_id; fallback para último deal do contato
    deal = None
    if deal_id is not None:
        deal = (
            db.query(models.Deal)
            .filter(models.Deal.id == deal_id, models.Deal.tenant_id == tenant_id)
            .first()
        )
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found or tenant mismatch")
        contact_id = deal.contact_id
    elif contact_id is not None:
        deal = (
            db.query(models.Deal)
            .filter(models.Deal.contact_id == contact_id, models.Deal.tenant_id == tenant_id)
            .order_by(models.Deal.opened_at.desc())
            .first()
        )
        # Se não houver deal, computa um score base muito baixo
    else:
        raise HTTPException(status_code=400, detail="Either deal_id or contact_id is required")

    # Normalização simples e pesos (simple_v1)
    weights = {
        "estimated_value": 0.4,
        "email_open_rate": 0.2,
        "interactions_total": 0.2,
        "docs_shared": 0.2,
    }

    def norm_estimated_value(v: float | None) -> float:
        if v is None:
            return 0.0
        # Cap em 100k para normalizar 0–1
        return min(max(v / 100_000.0, 0.0), 1.0)

    def norm_email_open_rate(r: float | None) -> float:
        if r is None:
            return 0.0
        # Assume 0–1 já; clampa
        return min(max(r, 0.0), 1.0)

    def norm_interactions_total(i: int | None) -> float:
        if i is None:
            return 0.0
        # Cap em 20 interações
        return min(max(i / 20.0, 0.0), 1.0)

    def norm_docs_shared(d: bool | None) -> float:
        return 1.0 if d else 0.0

    if deal is None:
        # Sem deal para o contato: score base
        normalized = {
            "estimated_value": 0.0,
            "email_open_rate": 0.0,
            "interactions_total": 0.0,
            "docs_shared": 0.0,
        }
    else:
        normalized = {
            "estimated_value": norm_estimated_value(deal.estimated_value),
            "email_open_rate": norm_email_open_rate(deal.email_open_rate),
            "interactions_total": norm_interactions_total(deal.interactions_total),
            "docs_shared": norm_docs_shared(deal.docs_shared),
        }

    score_float = sum(normalized[k] * weights[k] for k in weights.keys())
    score = int(round(score_float * 100))

    factors = {
        "normalized": normalized,
        "weights": weights,
        "raw": (
            {} if deal is None else {
                "estimated_value": deal.estimated_value,
                "email_open_rate": deal.email_open_rate,
                "interactions_total": deal.interactions_total,
                "docs_shared": deal.docs_shared,
                "deal_id": deal.id,
                "contact_id": deal.contact_id,
                "status": deal.status,
                "stage_id": deal.stage_id,
            }
        ),
    }

    entry = models.LeadScore(
        tenant_id=tenant_id,
        contact_id=contact_id,
        deal_id=(None if deal is None else deal.id),
        score=score,
        model_version="simple_v1",
        factors=factors,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="SCORE",
        entity_name="LeadScore",
        entity_id=entry.id,
        before=None,
        after={"score": entry.score, "model_version": entry.model_version, "contact_id": entry.contact_id, "deal_id": entry.deal_id},
        details={"factors": entry.factors},
    )
    return entry