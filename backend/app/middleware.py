import logging
import time
import uuid
from typing import Callable
from fastapi import Request

logger = logging.getLogger("request")

async def RequestContextMiddleware(request: Request, call_next: Callable):
    # Correlation ID
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    actor = request.headers.get("X-Actor") or "system"
    tenant_id = request.headers.get("X-Tenant-ID") or "-"
    # Log request start
    start = time.perf_counter()
    logger.info(
        f"Request start {request.method} {request.url.path}",
        extra={"request_id": request_id, "tenant_id": tenant_id, "actor": actor},
    )
    # Pass context to handlers if needed
    request.state.request_id = request_id
    request.state.actor = actor
    request.state.tenant_id = tenant_id

    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        f"Request end {request.method} {request.url.path} status={response.status_code} duration_ms={duration_ms:.2f}",
        extra={"request_id": request_id, "tenant_id": tenant_id, "actor": actor},
    )
    # Propagate request id
    response.headers["X-Request-ID"] = request_id
    return response