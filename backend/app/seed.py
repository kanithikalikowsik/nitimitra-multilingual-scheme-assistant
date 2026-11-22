import os

from sqlalchemy import JSON, MetaData, Table, inspect, insert, select
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .migrations import migrate_legacy_schema
from .models import Scheme, Source


DEMO_SCHEMES = [
    {
        "name": "Community Learning Support",
        "slug": "demo-community-learning-support",
        "category": "education-scholarships",
        "short_description": "Illustrative sample record for the NitiMitra interface. This is not a government scheme.",
        "overview": "This record demonstrates how information is organized. It contains no verified scheme guidance.",
        "benefits": [],
        "status": "demo",
        "is_demo": True,
    },
    {
        "name": "Agriculture Category Demo",
        "slug": "demo-agriculture-category",
        "category": "agriculture",
        "short_description": "Illustrative agriculture-category record for the NitiMitra interface. This is not a government scheme.",
        "overview": "This placeholder demonstrates category browsing only. It contains no verified scheme guidance.",
        "benefits": [],
        "status": "demo",
        "is_demo": True,
    },
    {
        "name": "Women & Child Welfare Category Demo",
        "slug": "demo-women-child-welfare-category",
        "category": "women-child-welfare",
        "short_description": "Illustrative women and child welfare category record for the NitiMitra interface. This is not a government scheme.",
        "overview": "This placeholder demonstrates category browsing only. It contains no verified scheme guidance.",
        "benefits": [],
        "status": "demo",
        "is_demo": True,
    },
    {
        "name": "Employment & Skills Category Demo",
        "slug": "demo-employment-skills-category",
        "category": "employment-skills",
        "short_description": "Illustrative employment and skills category record for the NitiMitra interface. This is not a government scheme.",
        "overview": "This placeholder demonstrates category browsing only. It contains no verified scheme guidance.",
        "benefits": [],
        "status": "demo",
        "is_demo": True,
    },
    {
        "name": "Healthcare Category Demo",
        "slug": "demo-healthcare-category",
        "category": "healthcare",
        "short_description": "Illustrative healthcare-category record for the NitiMitra interface. This is not a government scheme.",
        "overview": "This placeholder demonstrates category browsing only. It contains no verified scheme guidance.",
        "benefits": [],
        "status": "demo",
        "is_demo": True,
    },
    {
        "name": "Housing Category Demo",
        "slug": "demo-housing-category",
        "category": "housing",
        "short_description": "Illustrative housing-category record for the NitiMitra interface. This is not a government scheme.",
        "overview": "This placeholder demonstrates category browsing only. It contains no verified scheme guidance.",
        "benefits": [],
        "status": "demo",
        "is_demo": True,
    },
    {
        "name": "Social Security Category Demo",
        "slug": "demo-social-security-category",
        "category": "social-security",
        "short_description": "Illustrative social security category record for the NitiMitra interface. This is not a government scheme.",
        "overview": "This placeholder demonstrates category browsing only. It contains no verified scheme guidance.",
        "benefits": [],
        "status": "demo",
        "is_demo": True,
    },
]


def _add_scheme_compatibly(db: Session, data: dict) -> Scheme:
    """Insert demo rows on both current and legacy SQLite schemas.

    Older local databases have additional required JSON columns (description,
    eligibility, documents, application_steps) that are no longer mapped by
    the current ORM. Reflect only for that legacy case and give those fields
    neutral empty values; never rewrite existing rows.
    """
    bind = db.get_bind()
    columns = {column["name"]: column for column in inspect(bind).get_columns("schemes")}
    legacy_required = {
        name for name, column in columns.items()
        if name not in Scheme.__table__.columns and column["nullable"] is False and column["default"] is None
    }
    if not legacy_required:
        scheme = Scheme(**data)
        db.add(scheme)
        db.flush()
        return scheme

    values = dict(data)
    legacy_defaults = {
        "description": data["short_description"],
        "eligibility": [],
        "documents": [],
        "application_steps": [],
    }
    missing_legacy_values = legacy_required - legacy_defaults.keys()
    if missing_legacy_values:
        raise RuntimeError(f"Cannot safely seed legacy scheme schema; required columns have no compatible defaults: {sorted(missing_legacy_values)}")
    values.update({name: legacy_defaults[name] for name in legacy_required})
    # Keep JSON columns native so SQLAlchemy encodes lists once. Older schemas
    # may declare these legacy columns as plain TEXT instead.
    for name in ("eligibility", "documents", "application_steps"):
        if name in values and not isinstance(columns[name]["type"], JSON):
            values[name] = "[]"
    reflected = Table("schemes", MetaData(), autoload_with=bind)
    result = db.execute(insert(reflected).values(**values))
    scheme_id = result.inserted_primary_key[0]
    return db.get(Scheme, scheme_id)


def seed_demo_data(db: Session) -> None:
    for data in DEMO_SCHEMES:
        scheme = db.scalar(select(Scheme).where(Scheme.slug == data["slug"]))
        if scheme is None:
            scheme = _add_scheme_compatibly(db, data)
            scheme.sources.append(Source(
                source_name="Official source verification pending",
                source_url=None,
                verification_status="pending",
                last_verified_at=None,
            ))
            continue

        # Preserve an existing record. Only ensure a pending source placeholder exists.
        if scheme.is_demo and not scheme.sources:
            scheme.sources.append(Source(
                source_name="Official source verification pending",
                source_url=None,
                verification_status="pending",
                last_verified_at=None,
            ))
    db.commit()


def initialize_and_seed() -> None:
    """Initialize local SQLite compatibly; production schema is managed by Alembic."""
    production = os.getenv("APP_ENV", "development").strip().casefold() == "production"
    if engine.dialect.name == "sqlite" and not production:
        Base.metadata.create_all(bind=engine)
        migrate_legacy_schema(engine)

    seed_setting = os.getenv("SEED_DEMO_DATA")
    seed_enabled = (
        seed_setting.strip().casefold() in {"1", "true", "yes", "on"}
        if seed_setting is not None
        else not production
    )
    if seed_enabled:
        with SessionLocal() as db:
            seed_demo_data(db)


if __name__ == "__main__":
    initialize_and_seed()
    print("Database initialized; demo seed is safe to rerun.")
