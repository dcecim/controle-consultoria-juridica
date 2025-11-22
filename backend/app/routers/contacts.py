from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas
from ..audit import record_audit_event

router = APIRouter(prefix="/contacts", tags=["contacts"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_tenant_id(x_tenant_id: int = Header(..., alias="X-Tenant-ID")) -> int:
    return x_tenant_id

def to_dict(obj: models.Contact) -> dict:
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

@router.get("/", response_model=list[schemas.Contact])
def list_contacts(db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    return db.query(models.Contact).filter(models.Contact.tenant_id == tenant_id).all()

@router.get("/{contact_id}", response_model=schemas.Contact)
def get_contact(contact_id: int, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = (
        db.query(models.Contact)
        .filter(models.Contact.id == contact_id, models.Contact.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    return obj

@router.post("/", response_model=schemas.Contact, status_code=201)
def create_contact(
    payload: schemas.ContactCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    obj = models.Contact(**payload.dict())
    obj.tenant_id = tenant_id
    db.add(obj)
    db.commit()
    db.refresh(obj)
    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="CREATE",
        entity_name="Contact",
        entity_id=obj.id,
        before=None,
        after=to_dict(obj),
    )
    return obj

@router.put("/{contact_id}", response_model=schemas.Contact)
def update_contact(
    contact_id: int,
    payload: schemas.ContactUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    obj = (
        db.query(models.Contact)
        .filter(models.Contact.id == contact_id, models.Contact.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
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
        entity_name="Contact",
        entity_id=obj.id,
        before=before_fields,
        after=after_fields,
    )
    return obj

@router.delete("/{contact_id}", status_code=204)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    obj = (
        db.query(models.Contact)
        .filter(models.Contact.id == contact_id, models.Contact.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    before = to_dict(obj)
    db.delete(obj)
    db.commit()
    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="DELETE",
        entity_name="Contact",
        entity_id=contact_id,
        before=before,
        after=None,
    )
    return None