from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas
from ..audit import record_audit_event

router = APIRouter(prefix="/stages", tags=["stages"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", response_model=schemas.Stage)
def create_stage(
    stage: schemas.StageCreate,
    db: Session = Depends(get_db),
    x_tenant_id: int = Header(..., alias="X-Tenant-ID"),
    x_actor: str = Header("system", alias="X-Actor"),
):
    obj = models.Stage(name=stage.name, order=stage.order, tenant_id=x_tenant_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    record_audit_event(
        db,
        tenant_id=x_tenant_id,
        actor=x_actor,
        action="CREATE",
        entity_name="Stage",
        entity_id=obj.id,
        before=None,
        after={"id": obj.id, "name": obj.name, "order": obj.order, "tenant_id": obj.tenant_id},
    )
    return obj

@router.delete("/{stage_id}")
def delete_stage(
    stage_id: int,
    db: Session = Depends(get_db),
    x_tenant_id: int = Header(..., alias="X-Tenant-ID"),
    x_actor: str = Header("system", alias="X-Actor"),
):
    obj = db.query(models.Stage).filter(
        models.Stage.id == stage_id, models.Stage.tenant_id == x_tenant_id
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Stage not found")
    before = {"id": obj.id, "name": obj.name, "order": obj.order, "tenant_id": obj.tenant_id}
    db.delete(obj)
    db.commit()
    record_audit_event(
        db,
        tenant_id=x_tenant_id,
        actor=x_actor,
        action="DELETE",
        entity_name="Stage",
        entity_id=stage_id,
        before=before,
        after=None,
    )
    return {"ok": True}

@router.get("/", response_model=list[schemas.Stage])
def list_stages(
    db: Session = Depends(get_db),
    x_tenant_id: int = Header(..., alias="X-Tenant-ID"),
):
    return (
        db.query(models.Stage)
        .filter(models.Stage.tenant_id == x_tenant_id)
        .order_by(models.Stage.order.asc())
        .all()
    )

@router.post("/seed", response_model=list[schemas.Stage])
def seed_stages(
    db: Session = Depends(get_db),
    x_tenant_id: int = Header(..., alias="X-Tenant-ID"),
    x_actor: str = Header("system", alias="X-Actor"),
):
    defaults = ["Novo", "Inicial", "Em análise", "Proposta", "Negociação", "Ajuizado", "Ganho", "Perdido"]
    existing = (
        db.query(models.Stage)
        .filter(models.Stage.tenant_id == x_tenant_id)
        .order_by(models.Stage.order.asc())
        .all()
    )
    existing_names = {s.name for s in existing}
    next_order = (existing[-1].order + 1) if existing else 1

    created = []
    for name in defaults:
        if name not in existing_names:
            obj = models.Stage(name=name, order=next_order, tenant_id=x_tenant_id)
            db.add(obj)
            db.flush()
            record_audit_event(
                db,
                tenant_id=x_tenant_id,
                actor=x_actor,
                action="CREATE",
                entity_name="Stage",
                entity_id=obj.id,
                before=None,
                after={"id": obj.id, "name": obj.name, "order": obj.order, "tenant_id": obj.tenant_id},
            )
            created.append(obj)
            next_order += 1
    db.commit()
    return (
        db.query(models.Stage)
        .filter(models.Stage.tenant_id == x_tenant_id)
        .order_by(models.Stage.order.asc())
        .all()
    )

@router.post("/example-usage")
def log_stage_example_usage(
    payload: schemas.DealFormExampleUsage,
    db: Session = Depends(get_db),
    x_tenant_id: int = Header(..., alias="X-Tenant-ID"),
    x_actor: str = Header("system", alias="X-Actor"),
):
    record_audit_event(
        db,
        tenant_id=x_tenant_id,
        actor=x_actor,
        action="EXAMPLE_APPLIED",
        entity_name="StageFormExample",
        entity_id=payload.example_type,
        before=None,
        after=None,
        details={"context": payload.context} if payload.context is not None else None,
    )
    return {"ok": True}
