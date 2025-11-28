from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_tenant_id(x_tenant_id: int | None = Header(default=None, alias="X-Tenant-ID")) -> int:
    try:
        import os
        if x_tenant_id is None:
            return int(os.getenv("TENANT_ID", "1"))
        return int(x_tenant_id)
    except Exception:
        return 1

_tokens: dict[str, int] = {}

def _hash_password(raw: str) -> str:
    import hashlib
    import os
    salt = os.getenv("AUTH_SALT", "static-salt")
    return hashlib.sha256((salt + raw).encode("utf-8")).hexdigest()

@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginPayload, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    if user.password_hash != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = secrets.token_urlsafe(32)
    _tokens[token] = user.id
    return {
        "token": token,
        "access_token": token,
        "role": user.role,
        "must_change_password": user.must_change_password,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }

@router.get("/me")
def me(authorization: str | None = Header(default=None, alias="Authorization"), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")
    token = authorization.split(" ", 1)[1]
    user_id = _tokens.get(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Token inválido")
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
