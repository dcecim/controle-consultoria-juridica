import logging
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from . import models

logger = logging.getLogger("audit")

def record_audit_event(
    db: Session,
    *,
    tenant_id: int,
    actor: str,
    action: str,
    entity_name: str,
    entity_id: str,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None,
    details: Optional[Dict[str, Any]] = None,
) -> models.AuditLog:
    entry = models.AuditLog(
        tenant_id=tenant_id,
        actor=actor,
        action=action,
        entity_name=entity_name,
        entity_id=str(entity_id),
        before=before,
        after=after,
        details=details,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    logger.info(
        f"Audit {action} {entity_name}({entity_id})",
        extra={"tenant_id": str(tenant_id), "actor": actor, "request_id": "-"},
    )
    return entry