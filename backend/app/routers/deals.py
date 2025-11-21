from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas

router = APIRouter(prefix="/deals", tags=["deals"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_tenant_id(x_tenant_id: int = Header(..., alias="X-Tenant-ID")) -> int:
    return x_tenant_id

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
def create_deal(payload: schemas.DealCreate, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = models.Deal(**payload.dict())
    obj.tenant_id = tenant_id
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{deal_id}", response_model=schemas.Deal)
def update_deal(deal_id: int, payload: schemas.DealUpdate, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = (
        db.query(models.Deal)
        .filter(models.Deal.id == deal_id, models.Deal.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Deal not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{deal_id}", status_code=204)
def delete_deal(deal_id: int, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = (
        db.query(models.Deal)
        .filter(models.Deal.id == deal_id, models.Deal.tenant_id == tenant_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(obj)
    db.commit()
    return None