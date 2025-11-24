import logging
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from . import models
from datetime import datetime

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
    def _json_safe(value: Any) -> Any:
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, dict):
            return {k: _json_safe(v) for k, v in value.items()}
        if isinstance(value, list):
            return [_json_safe(v) for v in value]
        return value

    entry = models.AuditLog(
        tenant_id=tenant_id,
        actor=actor,
        action=action,
        entity_name=entity_name,
        entity_id=str(entity_id),
        before=_json_safe(before) if before is not None else None,
        after=_json_safe(after) if after is not None else None,
        details=_json_safe(details) if details is not None else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    logger.info(
        f"Audit {action} {entity_name}({entity_id})",
        extra={"tenant_id": str(tenant_id), "actor": actor, "request_id": "-"},
    )
    return entry