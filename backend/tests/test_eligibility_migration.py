import unittest
from unittest.mock import patch

from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.orm import Session

from app.database import Base
from app.migrations import migrate_legacy_schema
from app.models import EligibilityRule, Scheme
from app.seed import DEMO_SCHEMES, seed_demo_data


class EligibilityMigrationTests(unittest.TestCase):
    def test_adds_optional_criteria_without_losing_existing_rule(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            scheme = Scheme(name="Existing Scheme", slug="existing-scheme", category="healthcare",
                            short_description="Existing summary", overview="Existing detail", benefits=[],
                            status="published", is_demo=False)
            scheme.eligibility_rules.append(EligibilityRule(rule_description="Age condition", rule_type="unverified"))
            session.add(scheme)
            session.commit()
            scheme_id = scheme.id
            rule_id = scheme.eligibility_rules[0].id

        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE eligibility_rules DROP COLUMN criteria"))

        migrate_legacy_schema(engine)
        columns = {column["name"] for column in inspect(engine).get_columns("eligibility_rules")}
        self.assertIn("criteria", columns)
        with engine.connect() as connection:
            row = connection.execute(text("SELECT scheme_id, rule_description, criteria FROM eligibility_rules WHERE id=:id"),
                                     {"id": rule_id}).mappings().one()
        self.assertEqual(row["scheme_id"], scheme_id)
        self.assertEqual(row["rule_description"], "Age condition")
        self.assertIsNone(row["criteria"])
        engine.dispose()

    def test_demo_seed_writes_valid_json_to_legacy_schema(self):
        engine = create_engine("sqlite://")
        with engine.begin() as connection:
            connection.execute(text("""
                CREATE TABLE schemes (
                    id INTEGER PRIMARY KEY, name VARCHAR(200) NOT NULL,
                    category VARCHAR(100) NOT NULL, description TEXT NOT NULL,
                    benefits JSON NOT NULL, eligibility JSON NOT NULL,
                    documents JSON NOT NULL, application_steps JSON NOT NULL,
                    official_url VARCHAR(1000), department VARCHAR(200),
                    last_verified DATETIME, is_demo BOOLEAN NOT NULL
                )
            """))
        Base.metadata.create_all(engine)
        migrate_legacy_schema(engine)

        with Session(engine) as session, patch("app.seed.DEMO_SCHEMES", DEMO_SCHEMES[:1]):
            seed_demo_data(session)
            scheme = session.scalar(select(Scheme))
            self.assertIsNotNone(scheme)
            self.assertEqual(scheme.benefits, [])
            self.assertEqual(scheme.sources[0].verification_status, "pending")
        engine.dispose()


if __name__ == "__main__":
    unittest.main()
