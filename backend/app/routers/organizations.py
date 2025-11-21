from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas

router = APIRouter(prefix="/organizations", tags=["organizations"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[schemas.Organization])
def list_organizations(db: Session = Depends(get_db)):
    return db.query(models.Organization).all()

@router.get("/{org_id}", response_model=schemas.Organization)
def get_organization(org_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Organization not found")
    return obj

@router.post("/", response_model=schemas.Organization, status_code=201)
def create_organization(payload: schemas.OrganizationCreate, db: Session = Depends(get_db)):
    obj = models.Organization(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{org_id}", response_model=schemas.Organization)
def update_organization(org_id: int, payload: schemas.OrganizationCreate, db: Session = Depends(get_db)):
    obj = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Organization not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{org_id}", status_code=204)
def delete_organization(org_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Organization not found")
    db.delete(obj)
    db.commit()
    return None