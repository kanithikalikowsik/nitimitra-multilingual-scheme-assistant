import os
from pathlib import Path
import unittest
from unittest.mock import AsyncMock, patch


_database_directory = Path(__file__).resolve().parents[1] / ".phase6-test-data"
_database_directory.mkdir(exist_ok=True)
_api_database = _database_directory / "api.db"
if _api_database.exists():
    _api_database.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{_api_database.as_posix()}"

from fastapi.testclient import TestClient

from app.main import app
from app.database import engine
from app.seed import initialize_and_seed


class EligibilityApiTests(unittest.TestCase):
    def test_health_categories_search_filter_and_scheme_details(self):
        with TestClient(app) as client:
            health = client.get("/health")
            self.assertEqual(health.status_code, 200)
            self.assertEqual(health.json()["status"], "ok")

            categories = client.get("/api/categories")
            self.assertEqual(categories.status_code, 200)
            self.assertGreaterEqual(len(categories.json()), 1)
            self.assertTrue(all("scheme_count" in category for category in categories.json()))

            schemes = client.get("/api/schemes")
            self.assertEqual(schemes.status_code, 200)
            self.assertEqual(len(schemes.json()), 7)
            scheme = next(row for row in schemes.json() if row["slug"] == "demo-community-learning-support")
            self.assertTrue(scheme["is_demo"])
            self.assertEqual(scheme["sources"][0]["verification_status"], "pending")
            self.assertEqual(scheme["documents"], [])
            self.assertEqual(scheme["application_steps"], [])
            self.assertEqual(scheme["eligibility_rules"], [])

            listed_total = 0
            for category in categories.json():
                category_schemes = client.get("/api/schemes", params={"category": category["id"]})
                self.assertEqual(category_schemes.status_code, 200)
                self.assertEqual(len(category_schemes.json()), category["scheme_count"])
                self.assertTrue(all(row["category"] == category["id"] for row in category_schemes.json()))
                listed_total += len(category_schemes.json())
            self.assertEqual(listed_total, len(schemes.json()))
            self.assertTrue(all(category["scheme_count"] == 1 for category in categories.json()))

            searched = client.get("/api/schemes/search", params={"q": "Community Learning"})
            self.assertEqual(searched.status_code, 200)
            self.assertEqual(searched.json()[0]["slug"], scheme["slug"])
            filtered = client.get("/api/schemes", params={"category": "education-scholarships"})
            self.assertEqual(filtered.status_code, 200)
            self.assertEqual([row["slug"] for row in filtered.json()], [scheme["slug"]])
            filtered_case_insensitive = client.get("/api/schemes", params={"category": "EDUCATION-SCHOLARSHIPS"})
            filtered_by_name = client.get("/api/schemes", params={"category": "Education & Scholarships"})
            self.assertEqual([row["slug"] for row in filtered_case_insensitive.json()], [scheme["slug"]])
            self.assertEqual([row["slug"] for row in filtered_by_name.json()], [scheme["slug"]])
            empty_filter = client.get("/api/schemes", params={"category": "nonexistent-category"})
            self.assertEqual(empty_filter.status_code, 200)
            self.assertEqual(empty_filter.json(), [])
            search_with_matching_category = client.get("/api/schemes/search", params={"q": "Community Learning", "category": "education-scholarships"})
            search_with_empty_category = client.get("/api/schemes/search", params={"q": "Community Learning", "category": "housing"})
            self.assertEqual(len(search_with_matching_category.json()), 1)
            self.assertEqual(search_with_empty_category.json(), [])

            by_id = client.get(f"/api/schemes/{scheme['id']}")
            by_slug = client.get(f"/api/schemes/slug/{scheme['slug']}")
            self.assertEqual(by_id.status_code, 200)
            self.assertEqual(by_slug.status_code, 200)
            self.assertEqual(by_slug.json()["id"], scheme["id"])

    def test_api_missing_invalid_long_and_unknown_inputs(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/schemes/search").status_code, 422)
            self.assertEqual(client.get("/api/schemes/search", params={"q": ""}).status_code, 422)
            self.assertEqual(client.get("/api/schemes/search", params={"q": "x" * 121}).status_code, 422)
            self.assertEqual(client.get("/api/schemes/0").status_code, 422)
            self.assertEqual(client.get("/api/schemes/99999").status_code, 404)
            self.assertEqual(client.get("/api/schemes/slug/does-not-exist").status_code, 404)
            self.assertEqual(client.get("/api/schemes/slug/UPPERCASE").status_code, 422)
            self.assertEqual(client.get("/api/schemes/slug/does-not-exist/eligibility").status_code, 404)
            self.assertEqual(client.post("/api/schemes/slug/does-not-exist/eligibility-check", json={"answers": {}}).status_code, 404)
            self.assertEqual(client.post("/api/assistant/chat", json={"message": "x" * 1501}).status_code, 422)
            self.assertEqual(client.post("/api/assistant/chat", json={"message": "hello", "history": [{"role": "user", "content": "x" * 1201}]}).status_code, 422)
            self.assertEqual(client.post("/api/assistant/chat", json=[]).status_code, 422)

    def test_database_relationships_foreign_keys_and_repeated_seed_are_safe(self):
        with TestClient(app) as client:
            scheme_json = client.get("/api/schemes").json()[0]
            self.assertEqual(scheme_json["sources"][0]["source_name"], "Official source verification pending")
            with engine.connect() as connection:
                self.assertEqual(connection.exec_driver_sql("PRAGMA foreign_keys").scalar_one(), 1)
            before = client.get("/api/schemes").json()
            initialize_and_seed()
            after = client.get("/api/schemes").json()
            self.assertEqual(len(after), len(before))
            self.assertEqual(after[0]["id"], before[0]["id"])
            self.assertEqual(after[0]["sources"], before[0]["sources"])

    def test_questionnaire_check_and_post_cors(self):
        with TestClient(app) as client:
            path = "/api/schemes/slug/demo-community-learning-support"
            questionnaire = client.get(f"{path}/eligibility")
            self.assertEqual(questionnaire.status_code, 200)
            self.assertTrue(questionnaire.json()["is_demo"])
            self.assertEqual(questionnaire.json()["questions"], [])

            result = client.post(f"{path}/eligibility-check", json={"answers": {}})
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()["overall_status"], "cannot_determine")
            self.assertTrue(result.json()["preliminary"])

            options = client.options(path + "/eligibility-check", headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            })
            self.assertEqual(options.status_code, 200)
            self.assertEqual(options.headers.get("access-control-allow-origin"), "http://localhost:5173")

    def test_existing_scheme_api_fields_remain_available(self):
        with TestClient(app) as client:
            response = client.get("/api/schemes")
            self.assertEqual(response.status_code, 200)
            scheme = next(row for row in response.json() if row["slug"] == "demo-community-learning-support")
            self.assertIn("eligibility_rules", scheme)
            self.assertIn("documents", scheme)
            self.assertIn("criteria", scheme["eligibility_rules"][0]) if scheme["eligibility_rules"] else None

    def test_assistant_api_reports_demo_and_rejects_invalid_chat_input(self):
        with TestClient(app) as client:
            response = client.post("/api/assistant/chat", json={
                "message": "What does Community Learning Support provide?",
                "language": "te",
                "history": [],
            })
            self.assertEqual(response.status_code, 200)
            self.assertIn(response.json()["status"], {"unavailable", "unverified"})
            self.assertNotEqual(response.json()["status"], "answered")
            self.assertEqual(response.json()["sources"][0]["verification_status"], "pending")
            self.assertFalse(response.json()["stored"])
            self.assertEqual(client.post("/api/assistant/chat", json={"message": "   "}).status_code, 422)
            self.assertEqual(client.post("/api/assistant/chat", json={"message": "hello", "language": "fr"}).status_code, 422)
            self.assertEqual(client.post("/api/assistant/chat", json={"message": "x" * 1501}).status_code, 422)

    def test_assistant_api_accepts_general_response_and_returns_expected_shape(self):
        result = {"answer": "Hello!", "status": "answered", "sources": [], "stored": False}
        with patch("app.main.answer_question", new=AsyncMock(return_value=result)):
            with TestClient(app) as client:
                response = client.post("/api/assistant/chat", json={
                    "message": "hello", "language": "en", "history": [],
                })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), result)

    @classmethod
    def tearDownClass(cls):
        engine.dispose()
        if _api_database.exists():
            _api_database.unlink()
        _database_directory.rmdir()


if __name__ == "__main__":
    unittest.main()
