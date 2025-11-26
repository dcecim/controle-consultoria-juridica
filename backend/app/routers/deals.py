# módulo routers/deals.py — adicionar endpoint de métricas

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas
from ..audit import record_audit_event

# função deal_metrics no módulo routers/deals.py
# routers/deals.py — mover metrics acima de get_deal

router = APIRouter(prefix="/deals", tags=["deals"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_tenant_id(x_tenant_id: int = Header(..., alias="X-Tenant-ID")) -> int:
    return x_tenant_id

def to_dict(obj: models.Deal) -> dict:
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

@router.get("/", response_model=list[schemas.Deal])
def list_deals(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    stage_id: int | None = None,
    contact_id: int | None = None,
    organization_id: int | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    sort_by: str | None = None,
    sort_dir: str = "asc",
):
    q = db.query(models.Deal).filter(models.Deal.tenant_id == tenant_id)
    if stage_id is not None:
        q = q.filter(models.Deal.stage_id == stage_id)
    if contact_id is not None:
        q = q.filter(models.Deal.contact_id == contact_id)
    if organization_id is not None:
        q = q.filter(models.Deal.organization_id == organization_id)
    if status is not None:
        q = q.filter(models.Deal.status == status)

    # Ordenação segura por whitelist
    allowed = {
        "id": models.Deal.id,
        "opened_at": models.Deal.opened_at,
        "closed_at": models.Deal.closed_at,
        "value": models.Deal.value,
        "estimated_value": models.Deal.estimated_value,
        "interactions_total": models.Deal.interactions_total,
        "email_open_rate": models.Deal.email_open_rate,
        "status": models.Deal.status,
        "stage_id": models.Deal.stage_id,
        "contact_id": models.Deal.contact_id,
        "organization_id": models.Deal.organization_id,
        "title": models.Deal.title,
    }
    if sort_by in allowed:
        col = allowed[sort_by]
        if sort_dir.lower() == "desc":
            q = q.order_by(col.desc())
        else:
            q = q.order_by(col.asc())
    else:
        q = q.order_by(models.Deal.opened_at.desc())

    return q.offset(offset).limit(limit).all()

@router.get("/metrics")
def deal_metrics(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
):
    # Contagem por estágio (com nome)
    stages = (
        db.query(models.Stage)
        .filter(models.Stage.tenant_id == tenant_id)
        .order_by(models.Stage.order.asc())
        .all()
    )
    by_stage = []
    for st in stages:
        count = (
            db.query(models.Deal)
            .filter(models.Deal.tenant_id == tenant_id, models.Deal.stage_id == st.id)
            .count()
        )
        by_stage.append({"stage_id": st.id, "name": st.name, "count": count})

    # Contagem por status
    from sqlalchemy import func
    status_rows = (
        db.query(models.Deal.status, func.count(models.Deal.id))
        .filter(models.Deal.tenant_id == tenant_id)
        .group_by(models.Deal.status)
        .all()
    )
    by_status = [{"status": s or "-", "count": c} for (s, c) in status_rows]

    # Taxa de conversão (Ganho vs Perdido)
    won = (
        db.query(models.Deal)
        .filter(models.Deal.tenant_id == tenant_id, models.Deal.status == "Ganho")
        .count()
    )
    lost = (
        db.query(models.Deal)
        .filter(models.Deal.tenant_id == tenant_id, models.Deal.status == "Perdido")
        .count()
    )
    denom = won + lost
    win_rate = (won / denom) if denom > 0 else 0.0

    return {
        "by_stage": by_stage,
        "by_status": by_status,
        "conversion_rate": {"won": won, "lost": lost, "win_rate": round(win_rate, 4)},
    }

@router.post("/example-usage", status_code=201)
def log_example_usage(
    payload: schemas.DealFormExampleUsage,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="EXAMPLE_APPLIED",
        entity_name="DealFormExample",
        entity_id=payload.example_type,
        before=None,
        after=None,
        details={"context": payload.context} if payload.context is not None else None,
    )
    return {"ok": True}

@router.get("/{deal_id}", response_model=schemas.Deal)
def get_deal(deal_id: int, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = (
        db.query(models.Deal)
        .filter(models.Deal.id == deal_id, models.Deal.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Deal not found")
    return obj

@router.post("/", response_model=schemas.Deal, status_code=201)
def create_deal(
    payload: schemas.DealCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    # Excluir None para respeitar server_default (ex.: opened_at)
    data = payload.dict(exclude_none=True)

    # Validação de stage_id
    if data.get("stage_id") is not None:
        st = (
            db.query(models.Stage)
            .filter(models.Stage.id == data["stage_id"], models.Stage.tenant_id == tenant_id)
            .first()
        )
        if not st:
            raise HTTPException(status_code=400, detail="Invalid stage_id for tenant")

    # Validação de contact_id
    if data.get("contact_id") is not None:
        ct = (
            db.query(models.Contact)
            .filter(models.Contact.id == data["contact_id"], models.Contact.tenant_id == tenant_id)
            .first()
        )
        if not ct:
            raise HTTPException(status_code=400, detail="Invalid contact_id for tenant")

    # Validação de organization_id
    if data.get("organization_id") is not None:
        org = (
            db.query(models.Organization)
            .filter(models.Organization.id == data["organization_id"], models.Organization.tenant_id == tenant_id)
            .first()
        )
        if not org:
            raise HTTPException(status_code=400, detail="Invalid organization_id for tenant")

    obj = models.Deal(**data)
    obj.tenant_id = tenant_id
    db.add(obj)
    db.commit()
    db.refresh(obj)
    # Prefill: copiar obrigatórios do template da organização
    if obj.organization_id:
        org_rows = (
            db.query(models.OrganizationRequiredDocument)
            .filter(models.OrganizationRequiredDocument.organization_id == obj.organization_id, models.OrganizationRequiredDocument.tenant_id == tenant_id)
            .all()
        )
        if org_rows:
            existing = (
                db.query(models.DealRequiredDocument)
                .filter(models.DealRequiredDocument.deal_id == obj.id, models.DealRequiredDocument.tenant_id == tenant_id)
                .all()
            )
            existing_type_ids = {r.document_type_id for r in existing}
            for r in org_rows:
                if r.document_type_id in existing_type_ids:
                    continue
                dr = models.DealRequiredDocument(
                    tenant_id=tenant_id,
                    deal_id=obj.id,
                    document_type_id=r.document_type_id,
                )
                db.add(dr)
                db.flush()
                record_audit_event(
                    db,
                    tenant_id=tenant_id,
                    actor=x_actor,
                    action="REQUIRE",
                    entity_name="DealRequiredDocument",
                    entity_id=dr.id,
                    before=None,
                    after={"deal_id": obj.id, "document_type_id": r.document_type_id},
                )
            db.commit()
    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="CREATE",
        entity_name="Deal",
        entity_id=obj.id,
        before=None,
        after=to_dict(obj),
    )
    return obj

@router.put("/{deal_id}", response_model=schemas.Deal)
def update_deal(
    deal_id: int,
    payload: schemas.DealUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    obj = (
        db.query(models.Deal)
        .filter(models.Deal.id == deal_id, models.Deal.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Deal not found")
    before_fields = {k: getattr(obj, k) for k in payload.dict(exclude_unset=True).keys()}
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    after_fields = {k: getattr(obj, k) for k in payload.dict(exclude_unset=True).keys()}
    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="UPDATE",
        entity_name="Deal",
        entity_id=obj.id,
        before=before_fields,
        after=after_fields,
    )
    return obj

@router.delete("/{deal_id}", status_code=204)
def delete_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    obj = (
        db.query(models.Deal)
        .filter(models.Deal.id == deal_id, models.Deal.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Deal not found")
    before = to_dict(obj)
    db.delete(obj)
    db.commit()
    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="DELETE",
        entity_name="Deal",
        entity_id=deal_id,
        before=before,
        after=None,
    )
    return None
