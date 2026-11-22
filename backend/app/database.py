import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy import event
from sqlalchemy.orm import DeclarativeBase, sessionmaker


BACKEND_DIR = Path(__file__).resolve().parents[1]
try:
    from dotenv import load_dotenv

    load_dotenv(BACKEND_DIR / ".env", override=False)
except ImportError:
    pass


def _database_url() -> str:
    configured = os.getenv("DATABASE_URL")
    if not configured:
        return f"sqlite:///{(BACKEND_DIR / 'nitimitra.db').as_posix()}"
    # Render has historically supplied postgres:// URLs; SQLAlchemy's psycopg
    # 3 dialect is explicit so no psycopg2 dependency is needed.
    if configured.startswith("postgres://"):
        configured = "postgresql+psycopg://" + configured.removeprefix("postgres://")
    elif configured.startswith("postgresql://"):
        configured = "postgresql+psycopg://" + configured.removeprefix("postgresql://")
    if configured.startswith("sqlite:///"):
        configured_path = Path(configured.removeprefix("sqlite:///"))
        if not configured_path.is_absolute():
            configured = f"sqlite:///{(BACKEND_DIR / configured_path).resolve().as_posix()}"
    return configured


DATABASE_URL = _database_url()
is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


if is_sqlite:
    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
