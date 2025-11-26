from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import uuid4
from pathlib import Path
import os

from ..database import SessionLocal
from .. import models, schemas
from ..audit import record_audit_event

router = APIRouter(prefix="/documents", tags=["documents"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_tenant_id(x_tenant_id: int = Header(..., alias="X-Tenant-ID")) -> int:
    return x_tenant_id

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))

@router.post("/document-types/", response_model=schemas.DocumentTypeRead, status_code=201)
def create_document_type(
    payload: schemas.DocumentTypeCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    entry = models.DocumentType(
        tenant_id=tenant_id,
        name=payload.name,
        code=payload.code,
        description=payload.description,
        allowed_mime_types=payload.allowed_mime_types,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="CREATE",
        entity_name="DocumentType",
        entity_id=entry.id,
        before=None,
        after={"id": entry.id, "name": entry.name, "code": entry.code},
        details={"allowed_mime_types": entry.allowed_mime_types} if entry.allowed_mime_types else None,
    )
    return entry

@router.get("/document-types/", response_model=list[schemas.DocumentTypeRead])
def list_document_types(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
):
    return db.query(models.DocumentType).filter(models.DocumentType.tenant_id == tenant_id).order_by(models.DocumentType.name.asc()).all()

@router.post("/example-usage")
def log_documents_example_usage(
    payload: schemas.DealFormExampleUsage,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="EXAMPLE_APPLIED",
        entity_name="DocumentsExample",
        entity_id=payload.example_type,
        before=None,
        after=None,
        details={"context": payload.context} if payload.context is not None else None,
    )
    return {"ok": True}

@router.post("/deals/{deal_id}/required/", response_model=list[schemas.DealRequiredDocumentRead])
def set_required_documents_for_deal(
    deal_id: int,
    payload: schemas.DealRequiredSet,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    deal = db.query(models.Deal).filter(models.Deal.id == deal_id, models.Deal.tenant_id == tenant_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # validar tipos
    types = (
        db.query(models.DocumentType)
        .filter(models.DocumentType.id.in_(payload.type_ids), models.DocumentType.tenant_id == tenant_id)
        .all()
    )
    found_ids = {t.id for t in types}
    missing = [tid for tid in payload.type_ids if tid not in found_ids]
    if missing:
        raise HTTPException(status_code=400, detail=f"Invalid document_type_id(s) for tenant: {missing}")

    # inserir idempotente
    existing_rows = (
        db.query(models.DealRequiredDocument)
        .filter(models.DealRequiredDocument.deal_id == deal_id, models.DealRequiredDocument.tenant_id == tenant_id)
        .all()
    )
    existing_pairs = {(r.deal_id, r.document_type_id) for r in existing_rows}
    created = []
    for tid in payload.type_ids:
        pair = (deal_id, tid)
        if pair in existing_pairs:
            continue
        row = models.DealRequiredDocument(tenant_id=tenant_id, deal_id=deal_id, document_type_id=tid)
        db.add(row)
        db.flush()
        record_audit_event(
            db,
            tenant_id=tenant_id,
            actor=x_actor,
            action="REQUIRE",
            entity_name="DealRequiredDocument",
            entity_id=row.id,
            before=None,
            after={"deal_id": deal_id, "document_type_id": tid},
        )
        created.append(row)
    db.commit()

    # retornar com status agregado
    return get_required_documents_for_deal(deal_id, db, tenant_id)

@router.get("/deals/{deal_id}/required/", response_model=list[schemas.DealRequiredDocumentRead])
def get_required_documents_for_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
):
    deal = db.query(models.Deal).filter(models.Deal.id == deal_id, models.Deal.tenant_id == tenant_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    rows = (
        db.query(models.DealRequiredDocument)
        .filter(models.DealRequiredDocument.deal_id == deal_id, models.DealRequiredDocument.tenant_id == tenant_id)
        .all()
    )
    result = []
    for r in rows:
        count = (
            db.query(models.DocumentUpload)
            .filter(
                models.DocumentUpload.deal_id == deal_id,
                models.DocumentUpload.tenant_id == tenant_id,
                models.DocumentUpload.document_type_id == r.document_type_id,
            )
            .count()
        )
        doc_type = db.query(models.DocumentType).filter(models.DocumentType.id == r.document_type_id).first()
        result.append(
            schemas.DealRequiredDocumentRead(
                id=r.id,
                tenant_id=r.tenant_id,
                deal_id=r.deal_id,
                document_type_id=r.document_type_id,
                required_at=r.required_at,
                fulfilled=count > 0,
                uploads_count=count,
                document_type=schemas.DocumentTypeRead.model_validate(doc_type) if doc_type else None,
            )
        )
    return result

@router.post("/organizations/{org_id}/required/", response_model=list[schemas.OrganizationRequiredDocumentRead])
def set_required_documents_for_organization(
    org_id: int,
    payload: schemas.OrganizationRequiredSet,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    org = (
        db.query(models.Organization)
        .filter(models.Organization.id == org_id, models.Organization.tenant_id == tenant_id)
        .first()
    )
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    types = (
        db.query(models.DocumentType)
        .filter(models.DocumentType.id.in_(payload.type_ids), models.DocumentType.tenant_id == tenant_id)
        .all()
    )
    found_ids = {t.id for t in types}
    missing = [tid for tid in payload.type_ids if tid not in found_ids]
    if missing:
        raise HTTPException(status_code=400, detail=f"Invalid document_type_id(s) for tenant: {missing}")

    existing_rows = (
        db.query(models.OrganizationRequiredDocument)
        .filter(models.OrganizationRequiredDocument.organization_id == org_id, models.OrganizationRequiredDocument.tenant_id == tenant_id)
        .all()
    )
    existing_pairs = {(r.organization_id, r.document_type_id) for r in existing_rows}
    created = []
    for tid in payload.type_ids:
        pair = (org_id, tid)
        if pair in existing_pairs:
            continue
        row = models.OrganizationRequiredDocument(tenant_id=tenant_id, organization_id=org_id, document_type_id=tid)
        db.add(row)
        db.flush()
        record_audit_event(
            db,
            tenant_id=tenant_id,
            actor=x_actor,
            action="REQUIRE",
            entity_name="OrganizationRequiredDocument",
            entity_id=row.id,
            before=None,
            after={"organization_id": org_id, "document_type_id": tid},
        )
        created.append(row)
    db.commit()
    return get_required_documents_for_organization(org_id, db, tenant_id)

@router.get("/organizations/{org_id}/required/", response_model=list[schemas.OrganizationRequiredDocumentRead])
def get_required_documents_for_organization(
    org_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
):
    org = (
        db.query(models.Organization)
        .filter(models.Organization.id == org_id, models.Organization.tenant_id == tenant_id)
        .first()
    )
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    rows = (
        db.query(models.OrganizationRequiredDocument)
        .filter(models.OrganizationRequiredDocument.organization_id == org_id, models.OrganizationRequiredDocument.tenant_id == tenant_id)
        .all()
    )
    result = []
    for r in rows:
        doc_type = db.query(models.DocumentType).filter(models.DocumentType.id == r.document_type_id).first()
        result.append(
            schemas.OrganizationRequiredDocumentRead(
                id=r.id,
                tenant_id=r.tenant_id,
                organization_id=r.organization_id,
                document_type_id=r.document_type_id,
                required_at=r.required_at,
                document_type=schemas.DocumentTypeRead.model_validate(doc_type) if doc_type else None,
            )
        )
    return result

@router.post("/deals/{deal_id}/uploads/", response_model=schemas.DocumentUploadRead, status_code=201)
# Método: upload_document_for_deal — reforço de validação e escrita em chunks
async def upload_document_for_deal(
    deal_id: int,
    document_type_id: int = Form(...),
    file: UploadFile = File(...),
    notes: str | None = Form(default=None),
    contact_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    deal = db.query(models.Deal).filter(models.Deal.id == deal_id, models.Deal.tenant_id == tenant_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    doc_type = (
        db.query(models.DocumentType)
        .filter(models.DocumentType.id == document_type_id, models.DocumentType.tenant_id == tenant_id)
        .first()
    )
    if not doc_type:
        raise HTTPException(status_code=400, detail="Invalid document_type_id for tenant")

    # Validação de MIME com fallback por extensão se houver restrição
    allowed = doc_type.allowed_mime_types or []
    if allowed:
        ext = Path(file.filename or "").suffix.lower()
        ext_map = {
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
        }
        ext_mime = ext_map.get(ext)
        if file.content_type not in allowed and (ext_mime is None or ext_mime not in allowed):
            raise HTTPException(status_code=415, detail=f"Unsupported media type: {file.content_type}")

    dest_dir = UPLOAD_DIR / str(tenant_id) / "deals" / str(deal_id)
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Salvar arquivo em chunks com limite configurável
    suffix = Path(file.filename or "").suffix
    safe_name = f"{uuid4()}{suffix}"
    dest_path = dest_dir / safe_name

    max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", "50"))
    max_bytes = max_upload_mb * 1024 * 1024
    size = 0
    CHUNK_SIZE = 1024 * 1024  # 1MB

    with dest_path.open("wb") as out:
        while True:
            chunk = await file.read(CHUNK_SIZE)
            if not chunk:
                break
            size += len(chunk)
            if size > max_bytes:
                try:
                    out.close()
                    if dest_path.exists():
                        dest_path.unlink()
                except Exception:
                    pass
                raise HTTPException(status_code=413, detail=f"File too large (> {max_upload_mb} MB)")
            out.write(chunk)

    entry = models.DocumentUpload(
        tenant_id=tenant_id,
        deal_id=deal_id,
        document_type_id=document_type_id,
        contact_id=contact_id,
        filename=safe_name,
        original_filename=file.filename,
        mime_type=file.content_type,
        size_bytes=size,
        notes=notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="UPLOAD",
        entity_name="DocumentUpload",
        entity_id=entry.id,
        before=None,
        after={
            "deal_id": entry.deal_id,
            "document_type_id": entry.document_type_id,
            "contact_id": entry.contact_id,
            "original_filename": entry.original_filename,
            "size_bytes": entry.size_bytes,
        },
    )
    return entry

@router.get("/deals/{deal_id}/uploads/", response_model=list[schemas.DocumentUploadRead])
def list_uploads_for_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
):
    deal = db.query(models.Deal).filter(models.Deal.id == deal_id, models.Deal.tenant_id == tenant_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    rows = (
        db.query(models.DocumentUpload)
        .filter(models.DocumentUpload.deal_id == deal_id, models.DocumentUpload.tenant_id == tenant_id)
        .order_by(models.DocumentUpload.uploaded_at.desc())
        .all()
    )
    return rows

@router.get("/uploads/{upload_id}/download")
def download_upload(
    upload_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
):
    row = (
        db.query(models.DocumentUpload)
        .filter(models.DocumentUpload.id == upload_id, models.DocumentUpload.tenant_id == tenant_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Upload not found")
    dest_path = UPLOAD_DIR / str(tenant_id) / "deals" / str(row.deal_id) / row.filename
    if not dest_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=str(dest_path), filename=row.original_filename, media_type=row.mime_type or "application/octet-stream")

@router.delete("/uploads/{upload_id}", status_code=204)
def delete_upload(
    upload_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    row = (
        db.query(models.DocumentUpload)
        .filter(models.DocumentUpload.id == upload_id, models.DocumentUpload.tenant_id == tenant_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Upload not found")

    dest_path = UPLOAD_DIR / str(tenant_id) / "deals" / str(row.deal_id) / row.filename
    before = {
        "deal_id": row.deal_id,
        "document_type_id": row.document_type_id,
        "original_filename": row.original_filename,
        "size_bytes": row.size_bytes,
    }
    db.delete(row)
    db.commit()
    try:
        if dest_path.exists():
            dest_path.unlink()
    except Exception:
        # evitar crash se remoção falhar
        pass

    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="DELETE",
        entity_name="DocumentUpload",
        entity_id=upload_id,
        before=before,
        after=None,
    )
    return None

# Dentro do arquivo de roteador de documentos
@router.patch("/document-types/{id}", response_model=schemas.DocumentTypeRead)
def update_document_type(
    id: int,
    payload: schemas.DocumentTypeUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    x_actor: str = Header("system", alias="X-Actor"),
):
    doc_type = (
        db.query(models.DocumentType)
        .filter(models.DocumentType.id == id, models.DocumentType.tenant_id == tenant_id)
        .first()
    )
    if not doc_type:
        raise HTTPException(status_code=404, detail="DocumentType not found")

    before = {
        "name": doc_type.name,
        "description": doc_type.description,
        "allowed_mime_types": doc_type.allowed_mime_types,
    }

    if payload.name is not None:
        doc_type.name = payload.name
    if payload.description is not None:
        doc_type.description = payload.description
    if payload.allowed_mime_types is not None:
        doc_type.allowed_mime_types = [str(x).strip() for x in payload.allowed_mime_types if str(x).strip()]

    db.commit()
    db.refresh(doc_type)

    record_audit_event(
        db,
        tenant_id=tenant_id,
        actor=x_actor,
        action="UPDATE",
        entity_name="DocumentType",
        entity_id=doc_type.id,
        before=before,
        after={
            "name": doc_type.name,
            "description": doc_type.description,
            "allowed_mime_types": doc_type.allowed_mime_types,
        },
    )
    return doc_type
