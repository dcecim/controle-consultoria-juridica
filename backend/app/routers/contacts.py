from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas

router = APIRouter(prefix="/contacts", tags=["contacts"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_tenant_id(x_tenant_id: int = Header(..., alias="X-Tenant-ID")) -> int:
    return x_tenant_id

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
def create_contact(payload: schemas.ContactCreate, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = models.Contact(**payload.dict())
    obj.tenant_id = tenant_id
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{contact_id}", response_model=schemas.Contact)
def update_contact(contact_id: int, payload: schemas.ContactUpdate, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = (
        db.query(models.Contact)
        .filter(models.Contact.id == contact_id, models.Contact.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = (
        db.query(models.Contact)
        .filter(models.Contact.id == contact_id, models.Contact.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(obj)
    db.commit()
    return None