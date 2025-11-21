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

@router.post("/", response_model=schemas.Tenant, status_code=201)
def create_tenant(payload: schemas.TenantCreate, db: Session = Depends(get_db)):
    obj = models.Tenant(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj