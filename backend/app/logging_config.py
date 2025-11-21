import logging
import os

class CommonContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        if not hasattr(record, "tenant_id"):
            record.tenant_id = "-"
        if not hasattr(record, "actor"):
            record.actor = "-"
        return True

def configure_logging():
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    numeric_level = getattr(logging, level, logging.INFO)
    logging.basicConfig(
        level=numeric_level,
        format="ts=%(asctime)s lvl=%(levelname)s logger=%(name)s req_id=%(request_id)s tenant=%(tenant_id)s actor=%(actor)s msg=%(message)s",
    )
    # Attach filter to all handlers to provide defaults
    root = logging.getLogger()
    context_filter = CommonContextFilter()
    for handler in root.handlers:
        handler.addFilter(context_filter)
    # Reduce noise or tune libraries if needed
    logging.getLogger("uvicorn.access").setLevel(numeric_level)
    logging.getLogger("uvicorn.error").setLevel(numeric_level)