# módulo: database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
from urllib.parse import quote
# módulo: logger e helper para logar o engine
import logging
logger = logging.getLogger("database")

BASE_DIR = r"c:\Demandas\Consultor-juridico"
DB_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DB_DIR, exist_ok=True)

# carregar .env explicitamente do diretório do projeto, sobrescrevendo envs existentes
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"), override=True, encoding="utf-8")

def normalize_database_url(url_str: str) -> str:
    try:
        from sqlalchemy.engine import make_url
        u = make_url(url_str)
        if u.drivername.startswith("postgresql"):
            user = quote(u.username) if u.username else ""
            pwd = quote(u.password) if u.password else ""
            host = u.host or "localhost"
            port = f":{u.port}" if u.port else ""
            db = quote(u.database) if u.database else ""
            return f"postgresql+psycopg2://{user}:{pwd}@{host}{port}/{db}"
        return url_str
    except Exception:
        return url_str

def build_database_url_from_env() -> str | None:
    user = os.getenv("PGUSER")
    password = os.getenv("PGPASSWORD")
    host = os.getenv("PGHOST") or "localhost"
    port = os.getenv("PGPORT") or "5432"
    db = os.getenv("PGDATABASE")
    if user and password and db:
        return f"postgresql+psycopg2://{quote(user)}:{quote(password)}@{host}:{port}/{quote(db)}"
    return None

# preferir PG* do .env; se não houver, cair para DATABASE_URL
DATABASE_URL = build_database_url_from_env() or os.getenv("DATABASE_URL")

if DATABASE_URL:
    DATABASE_URL = normalize_database_url(DATABASE_URL)
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        def log_engine_info():
            try:
                redacted_url = engine.url.render_as_string(hide_password=True)
            except Exception:
                redacted_url = str(engine.url)
            logger.info(
                f"Database engine initialized dialect={engine.dialect.name} url={redacted_url}",
                extra={"request_id": "-", "tenant_id": "-", "actor": "-"},
            )
        log_engine_info()
    except Exception as e:
        logger.error(
            f"Failed to initialize Postgres engine, falling back to SQLite: {e}",
            extra={"request_id": "-", "tenant_id": "-", "actor": "-"},
        )
        # Fallback para SQLite
        SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'crm.db')}"
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
        )
else:
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'crm.db')}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# NOVO: patch mínimo de schema para colunas novas (PostgreSQL)
def apply_minimal_schema_patch(engine):
    if engine.dialect.name != "postgresql":
        return
    try:
        with engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT")
            conn.exec_driver_sql("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS responsible_name VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS responsible_oab VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS website VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS instagram VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS linkedin VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS session_idle_minutes INTEGER DEFAULT 4;")
            # organizations
            conn.exec_driver_sql("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sector VARCHAR;")
            # contacts
            conn.exec_driver_sql("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS client_type VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_source VARCHAR;")
            # deals
            conn.exec_driver_sql("ALTER TABLE deals ADD COLUMN IF NOT EXISTS main_issue VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE deals ADD COLUMN IF NOT EXISTS estimated_value DOUBLE PRECISION;")
            conn.exec_driver_sql("ALTER TABLE deals ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ DEFAULT NOW();")
            conn.exec_driver_sql("ALTER TABLE deals ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;")
            conn.exec_driver_sql("ALTER TABLE deals ADD COLUMN IF NOT EXISTS email_open_rate DOUBLE PRECISION;")
            conn.exec_driver_sql("ALTER TABLE deals ADD COLUMN IF NOT EXISTS interactions_total INTEGER NOT NULL DEFAULT 0;")
            conn.exec_driver_sql("ALTER TABLE deals ADD COLUMN IF NOT EXISTS docs_shared BOOLEAN NOT NULL DEFAULT FALSE;")
            # users MFA
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;")
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_method VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;")
        logger.info(
            "Minimal schema patch applied for lead scoring columns",
            extra={"request_id": "-", "tenant_id": "-", "actor": "-"},
        )
    except Exception as e:
        logger.error(
            f"Failed to apply minimal schema patch: {e}",
            extra={"request_id": "-", "tenant_id": "-", "actor": "-"},
        )
