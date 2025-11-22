# módulo: database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
from urllib.parse import quote
# módulo: logger e helper para logar o engine
import logging
logger = logging.getLogger("database")

load_dotenv()

BASE_DIR = r"c:\Demandas\Consultor-juridico"
DB_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DB_DIR, exist_ok=True)

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

# Preferir PG* em vez de DATABASE_URL para evitar DSN com caracteres inválidos
pg_url = build_database_url_from_env()
env_url = os.getenv("DATABASE_URL")
DATABASE_URL = pg_url or env_url

if DATABASE_URL:
    DATABASE_URL = normalize_database_url(DATABASE_URL)
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
else:
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'crm.db')}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()