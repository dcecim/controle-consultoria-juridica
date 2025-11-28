from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas

router = APIRouter(prefix="/rbac", tags=["rbac"])

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

@router.get("/profiles", response_model=list[schemas.Profile])
def list_profiles(db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    return db.query(models.Profile).filter(models.Profile.tenant_id == tenant_id).all()

@router.post("/profiles", response_model=schemas.Profile, status_code=201)
def create_profile(payload: schemas.ProfileCreate, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = models.Profile(tenant_id=tenant_id, name=payload.name, code=payload.code)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/profiles/{id}", response_model=schemas.Profile)
def update_profile(id: int, payload: schemas.ProfileCreate, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = db.query(models.Profile).filter(models.Profile.id == id, models.Profile.tenant_id == tenant_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Profile not found")
    if payload.name is not None:
        obj.name = payload.name
    if payload.code is not None:
        obj.code = payload.code
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/profiles/{id}")
def delete_profile(id: int, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = db.query(models.Profile).filter(models.Profile.id == id, models.Profile.tenant_id == tenant_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Profile not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}

def _hash_password(raw: str) -> str:
    import hashlib
    import os
    salt = os.getenv("AUTH_SALT", "static-salt")
    return hashlib.sha256((salt + raw).encode("utf-8")).hexdigest()

@router.get("/users", response_model=list[schemas.UserRead])
def list_users(db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    return db.query(models.User).filter(models.User.tenant_id == tenant_id).all()

@router.post("/users", status_code=201)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    if not payload.password:
        import secrets
        temp = secrets.token_urlsafe(8)
        password_hash = _hash_password(temp)
        obj = models.User(
            tenant_id=tenant_id,
            name=payload.name,
            email=payload.email,
            role=payload.role,
            password_hash=password_hash,
            must_change_password=True if payload.must_change_password is None else payload.must_change_password,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return {"id": obj.id, "name": obj.name, "email": obj.email, "role": obj.role, "temporary_password": temp}
    password_hash = _hash_password(payload.password)
    obj = models.User(
        tenant_id=tenant_id,
        name=payload.name,
        email=payload.email,
        role=payload.role,
        password_hash=password_hash,
        must_change_password=True if payload.must_change_password is None else payload.must_change_password,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {"id": obj.id, "name": obj.name, "email": obj.email, "role": obj.role}

@router.put("/users/{id}", response_model=schemas.UserRead)
def update_user(id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = db.query(models.User).filter(models.User.id == id, models.User.tenant_id == tenant_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.name is not None:
        obj.name = payload.name
    if payload.email is not None:
        obj.email = payload.email
    if payload.role is not None:
        obj.role = payload.role
    if payload.password is not None:
        obj.password_hash = _hash_password(payload.password)
    if payload.must_change_password is not None:
        obj.must_change_password = payload.must_change_password
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/users/{id}")
def delete_user(id: int, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    obj = db.query(models.User).filter(models.User.id == id, models.User.tenant_id == tenant_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}

@router.get("/roles/{role}/permissions")
def get_role_permissions(role: str, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    rows = (
        db.query(models.RolePermission)
        .filter(models.RolePermission.tenant_id == tenant_id, models.RolePermission.role == role)
        .all()
    )
    result: dict[str, list[str]] = {}
    for r in rows:
        result[r.resource] = list(r.actions or [])
    return result

@router.put("/roles/{role}/permissions")
def set_role_permissions(role: str, payload: schemas.RolePermissionsPayload, db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    db.query(models.RolePermission).filter(models.RolePermission.tenant_id == tenant_id, models.RolePermission.role == role).delete()
    for resource, actions in payload.__root__.items():
        obj = models.RolePermission(tenant_id=tenant_id, role=role, resource=resource, actions=actions)
        db.add(obj)
    db.commit()
    return {"ok": True}

@router.post("/seed")
def seed_rbac(db: Session = Depends(get_db), tenant_id: int = Depends(get_tenant_id)):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        tenant = models.Tenant(id=tenant_id, name=f"Tenant {tenant_id}")
        db.add(tenant)
        db.flush()
    base_roles = ["Master", "Projetista", "Financeiro", "Comercial", "Guest"]
    for name in base_roles:
        exists = db.query(models.Profile).filter(models.Profile.tenant_id == tenant_id, models.Profile.name == name).first()
        if not exists:
            db.add(models.Profile(tenant_id=tenant_id, name=name))
    admin_email = "admin@example.com"
    existing_global = db.query(models.User).filter(models.User.email == admin_email).first()
    if existing_global and existing_global.tenant_id != tenant_id:
        admin_email = f"admin+{tenant_id}@example.com"
    admin = db.query(models.User).filter(models.User.tenant_id == tenant_id, models.User.email == admin_email).first()
    if not admin:
        import os
        default_pwd = os.getenv("ADMIN_PASSWORD", "admin123")
        obj = models.User(
            tenant_id=tenant_id,
            name="Admin",
            email=admin_email,
            role="Master",
            password_hash=_hash_password(default_pwd),
            must_change_password=False,
        )
        db.add(obj)
    for role in base_roles:
        exists = db.query(models.RolePermission).filter(models.RolePermission.tenant_id == tenant_id, models.RolePermission.role == role, models.RolePermission.resource == "*" ).first()
        if not exists:
            actions = ["read"] if role != "Master" else ["read", "write", "delete"]
            db.add(models.RolePermission(tenant_id=tenant_id, role=role, resource="*", actions=actions))
    db.commit()
    return {"ok": True}

