from fastapi import APIRouter, Depends, HTTPException
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

@router.get("/", response_model=list[schemas.Contact])
def list_contacts(db: Session = Depends(get_db)):
    return db.query(models.Contact).all()

@router.get("/{contact_id}", response_model=schemas.Contact)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    return obj

@router.post("/", response_model=schemas.Contact, status_code=201)
def create_contact(payload: schemas.ContactCreate, db: Session = Depends(get_db)):
    obj = models.Contact(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{contact_id}", response_model=schemas.Contact)
def update_contact(contact_id: int, payload: schemas.ContactUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(obj)
    db.commit()
    return None