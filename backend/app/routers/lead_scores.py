from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas
from ..audit import record_audit_event

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