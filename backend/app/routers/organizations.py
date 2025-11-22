from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas
from ..audit import record_audit_event

router = APIRouter(prefix="/organizations", tags=["organizations"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_tenant_id(x_tenant_id: int = Header(..., alias="X-Tenant-ID")) -> int:
    return x_tenant_id

def to_dict(obj: models.Organization) -> dict:
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

@router.get("/", response_model=list[schemas.Organization])
def list_organizations(db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    return db.query(models.Organization).filter(models.Organization.tenant_id == tenant_id).all()

@router.get("/{org_id}", response_model=schemas.Organization)
def get_organization(org_id: int, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = (
        db.query(models.Organization)
        .filter(models.Organization.id == org_id, models.Organization.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Organization not found")
    return obj

@router.post("/", response_model=schemas.Organization, status_code=201)
def create_organization(
    payload: schemas.OrganizationCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    obj = models.Organization(**payload.dict())
    obj.tenant_id = tenant_id
    db.add(obj)
    db.commit()
    db.refresh(obj)
    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="CREATE",
        entity_name="Organization",
        entity_id=obj.id,
        before=None,
        after=to_dict(obj),
    )
    return obj

@router.put("/{org_id}", response_model=schemas.Organization)
def update_organization(
    org_id: int,
    payload: schemas.OrganizationCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    obj = (
        db.query(models.Organization)
        .filter(models.Organization.id == org_id, models.Organization.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Organization not found")
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
        entity_name="Organization",
        entity_id=obj.id,
        before=before_fields,
        after=after_fields,
    )
    return obj

@router.delete("/{org_id}", status_code=204)
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    obj = (
        db.query(models.Organization)
        .filter(models.Organization.id == org_id, models.Organization.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Organization not found")
    before = to_dict(obj)
    db.delete(obj)
    db.commit()
    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="DELETE",
        entity_name="Organization",
        entity_id=org_id,
        before=before,
        after=None,
    )
    return None