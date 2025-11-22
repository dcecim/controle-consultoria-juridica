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