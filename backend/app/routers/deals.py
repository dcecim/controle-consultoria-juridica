from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas
from ..audit import record_audit_event

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
def list_deals(db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    return db.query(models.Deal).filter(models.Deal.tenant_id == tenant_id).all()

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