import os
import unittest
from unittest.mock import patch

from sqlalchemy import create_engine

class DeploymentConfigTests(unittest.TestCase):
    def test_postgres_urls_select_psycopg_three(self):
        from app.database import _database_url

        with patch.dict(os.environ, {"DATABASE_URL": "postgres://user:password@db.example:5432/nitimitra"}):
            url = _database_url()
            self.assertEqual(url, "postgresql+psycopg://user:password@db.example:5432/nitimitra")
            engine = create_engine(url)
            self.assertEqual(engine.dialect.name, "postgresql")
            self.assertEqual(engine.dialect.driver, "psycopg")
            engine.dispose()
        with patch.dict(os.environ, {"DATABASE_URL": "postgresql://user:password@db.example:5432/nitimitra"}):
            self.assertEqual(_database_url(), "postgresql+psycopg://user:password@db.example:5432/nitimitra")

    def test_unset_url_keeps_local_sqlite_default(self):
        from app.database import BACKEND_DIR, _database_url

        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(_database_url(), f"sqlite:///{(BACKEND_DIR / 'nitimitra.db').as_posix()}")

    def test_cors_accepts_multiple_origins_and_requires_explicit_production_origins(self):
        from app.main import configured_frontend_origins

        self.assertEqual(
            configured_frontend_origins("production", "https://nitimitra.vercel.app, https://preview.vercel.app/"),
            ["https://nitimitra.vercel.app", "https://preview.vercel.app"],
        )
        with self.assertRaises(RuntimeError):
            configured_frontend_origins("production", "*")
        with self.assertRaises(RuntimeError):
            configured_frontend_origins("production", "")

    def test_production_startup_skips_create_all_and_demo_seed_by_default(self):
        from app.seed import initialize_and_seed

        with patch.dict(os.environ, {"APP_ENV": "production"}, clear=False):
            os.environ.pop("SEED_DEMO_DATA", None)
            with patch("app.seed.Base.metadata.create_all") as create_all, \
                    patch("app.seed.migrate_legacy_schema") as legacy_migration, \
                    patch("app.seed.seed_demo_data") as seed:
                initialize_and_seed()
        create_all.assert_not_called()
        legacy_migration.assert_not_called()
        seed.assert_not_called()


if __name__ == "__main__":
    unittest.main()
