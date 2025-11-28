from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas

router = APIRouter(prefix="/tenants", tags=["tenants"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[schemas.Tenant])
def list_tenants(db: Session = Depends(get_db)):
    return db.query(models.Tenant).all()

@router.get("/{id}", response_model=schemas.Tenant)
def get_tenant(id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Tenant).filter(models.Tenant.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return obj

@router.post("/", response_model=schemas.Tenant, status_code=201)
def create_tenant(payload: schemas.TenantCreate, db: Session = Depends(get_db)):
    obj = models.Tenant(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{id}", response_model=schemas.Tenant)
def update_tenant(id: int, payload: schemas.TenantUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.Tenant).filter(models.Tenant.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Tenant not found")
    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj
