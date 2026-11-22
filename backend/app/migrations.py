import json
import re
from urllib.parse import urlsplit

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from .categories import normalize_category


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")
    return slug or "scheme"


def _json_list(value) -> list:
    if value is None:
        return []
    try:
        parsed = json.loads(value) if isinstance(value, str) else value
    except (TypeError, json.JSONDecodeError):
        return []
    return parsed if isinstance(parsed, list) else []


def migrate_legacy_schema(engine: Engine) -> None:
    """Add Phase 4 columns and move legacy JSON detail arrays without dropping data."""
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as connection:
        if "schemes" not in inspect(connection).get_table_names():
            return

        original_columns = {column["name"] for column in inspect(connection).get_columns("schemes")}
        if "eligibility_rules" in inspect(connection).get_table_names():
            rule_columns = {column["name"] for column in inspect(connection).get_columns("eligibility_rules")}
            if "criteria" not in rule_columns:
                connection.exec_driver_sql('ALTER TABLE eligibility_rules ADD COLUMN "criteria" JSON')
        additions = {
            "slug": "VARCHAR(200)",
            "short_description": "TEXT NOT NULL DEFAULT ''",
            "overview": "TEXT NOT NULL DEFAULT ''",
            "status": "VARCHAR(30) NOT NULL DEFAULT 'draft'",
            "is_demo": "BOOLEAN NOT NULL DEFAULT 0",
            "created_at": "DATETIME",
            "updated_at": "DATETIME",
        }
        for column, definition in additions.items():
            if column not in original_columns:
                connection.exec_driver_sql(f'ALTER TABLE schemes ADD COLUMN "{column}" {definition}')

        if "description" in original_columns:
            connection.exec_driver_sql(
                "UPDATE schemes SET short_description=description WHERE short_description='' OR short_description IS NULL"
            )
            connection.exec_driver_sql("UPDATE schemes SET overview=description WHERE overview='' OR overview IS NULL")

        rows = connection.execute(text("SELECT id, name, slug, category, is_demo, status FROM schemes ORDER BY id")).mappings().all()
        used_slugs: set[str] = set()
        for row in rows:
            slug = row["slug"] or _slugify(row["name"])
            if slug in used_slugs:
                slug = f"{slug}-{row['id']}"
            used_slugs.add(slug)
            connection.execute(
                text("UPDATE schemes SET slug=:slug, category=:category WHERE id=:id"),
                {
                    "slug": slug,
                    "category": normalize_category(row["category"]),
                    "id": row["id"],
                },
            )
            if not row["status"]:
                connection.execute(
                    text("UPDATE schemes SET status=:status WHERE id=:id"),
                    {"status": "demo" if row["is_demo"] else "draft", "id": row["id"]},
                )
        connection.exec_driver_sql(
            "UPDATE schemes SET created_at=COALESCE(created_at, strftime('%Y-%m-%dT%H:%M:%SZ','now')), "
            "updated_at=COALESCE(updated_at, strftime('%Y-%m-%dT%H:%M:%SZ','now'))"
        )
        connection.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS uq_schemes_slug ON schemes (slug)")

        legacy_arrays = {
            "eligibility": ("eligibility_rules", "rule_description", "rule_type", "unverified"),
            "documents": ("documents", "document_name", None, None),
            "application_steps": ("application_steps", "instruction", None, None),
        }
        scheme_rows = connection.execute(text("SELECT * FROM schemes ORDER BY id")).mappings().all()
        for row in scheme_rows:
            for legacy_column, config in legacy_arrays.items():
                if legacy_column not in original_columns:
                    continue
                table, value_column, secondary_column, secondary_value = config
                existing = connection.execute(
                    text(f"SELECT count(*) FROM {table} WHERE scheme_id=:scheme_id"),
                    {"scheme_id": row["id"]},
                ).scalar_one()
                if existing:
                    continue
                for index, item in enumerate(_json_list(row[legacy_column]), start=1):
                    if not isinstance(item, str) or not item.strip():
                        continue
                    if table == "eligibility_rules":
                        connection.execute(
                            text("INSERT INTO eligibility_rules (scheme_id, rule_description, rule_type) VALUES (:scheme_id, :value, :type)"),
                            {"scheme_id": row["id"], "value": item, "type": "demo" if row["is_demo"] else secondary_value},
                        )
                    elif table == "documents":
                        connection.execute(
                            text("INSERT INTO documents (scheme_id, document_name, description) VALUES (:scheme_id, :value, NULL)"),
                            {"scheme_id": row["id"], "value": item},
                        )
                    else:
                        connection.execute(
                            text("INSERT INTO application_steps (scheme_id, step_number, instruction) VALUES (:scheme_id, :step_number, :value)"),
                            {"scheme_id": row["id"], "step_number": index, "value": item},
                        )

            legacy_url = row.get("official_url") if "official_url" in original_columns else None
            if legacy_url:
                source_count = connection.execute(
                    text("SELECT count(*) FROM sources WHERE scheme_id=:scheme_id"), {"scheme_id": row["id"]}
                ).scalar_one()
                if not source_count:
                    legacy_name = row.get("department") or "Legacy source record (not verified)"
                    parsed_url = urlsplit(legacy_url)
                    safe_url = legacy_url if parsed_url.scheme in {"http", "https"} and parsed_url.netloc else None
                    connection.execute(
                        text("INSERT INTO sources (scheme_id, source_name, source_url, last_verified_at, verification_status) "
                             "VALUES (:scheme_id, :name, :url, NULL, 'pending')"),
                        {"scheme_id": row["id"], "name": legacy_name, "url": safe_url},
                    )
