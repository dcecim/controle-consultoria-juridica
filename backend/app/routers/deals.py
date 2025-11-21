from fastapi import APIRouter, Depends, HTTPException
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

@router.get("/", response_model=list[schemas.Deal])
def list_deals(db: Session = Depends(get_db)):
    return db.query(models.Deal).all()

@router.get("/{deal_id}", response_model=schemas.Deal)
def get_deal(deal_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Deal).filter(models.Deal.id == deal_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Deal not found")
    return obj

@router.post("/", response_model=schemas.Deal, status_code=201)
def create_deal(payload: schemas.DealCreate, db: Session = Depends(get_db)):
    obj = models.Deal(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{deal_id}", response_model=schemas.Deal)
def update_deal(deal_id: int, payload: schemas.DealUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.Deal).filter(models.Deal.id == deal_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Deal not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{deal_id}", status_code=204)
def delete_deal(deal_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Deal).filter(models.Deal.id == deal_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(obj)
    db.commit()
    return None