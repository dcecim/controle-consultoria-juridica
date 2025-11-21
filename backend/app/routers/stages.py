from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas

router = APIRouter(prefix="/stages", tags=["stages"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[schemas.Stage])
def list_stages(db: Session = Depends(get_db)):
    return db.query(models.Stage).order_by(models.Stage.order.asc()).all()

@router.get("/{stage_id}", response_model=schemas.Stage)
def get_stage(stage_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Stage).filter(models.Stage.id == stage_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Stage not found")
    return obj

@router.post("/", response_model=schemas.Stage, status_code=201)
def create_stage(payload: schemas.StageCreate, db: Session = Depends(get_db)):
    obj = models.Stage(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{stage_id}", response_model=schemas.Stage)
def update_stage(stage_id: int, payload: schemas.StageCreate, db: Session = Depends(get_db)):
    obj = db.query(models.Stage).filter(models.Stage.id == stage_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Stage not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{stage_id}", status_code=204)
def delete_stage(stage_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Stage).filter(models.Stage.id == stage_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Stage not found")
    db.delete(obj)
    db.commit()
    return None