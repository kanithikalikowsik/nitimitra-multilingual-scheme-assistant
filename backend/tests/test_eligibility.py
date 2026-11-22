import unittest
from datetime import datetime, timezone
from types import SimpleNamespace as Row

from fastapi import HTTPException

from app.eligibility import evaluate, questionnaire


def sample_scheme(criteria=None, *, demo=False, verification="verified", rule_type="verified", documents=None):
    return Row(
        id=7, slug="sample", name="Sample", is_demo=demo,
        sources=[Row(source_name="Department source", source_url="https://example.gov", verification_status=verification, last_verified_at=datetime.now(timezone.utc))],
        eligibility_rules=[Row(id=1, rule_description="Applicant must be at least 18", rule_type=rule_type, criteria=criteria)] if criteria is not None else [],
        documents=[Row(document_name="Proof of residence", description=None)] if documents else [],
    )


class EligibilityEngineTests(unittest.TestCase):
    criteria = {"field": "age", "question": "How old are you?", "field_type": "number", "operator": "gte", "expected": 18, "verification_status": "verified"}

    def test_all_conditions_met_and_document_requirement_unknown(self):
        result = evaluate(sample_scheme(self.criteria, documents=True), {"age": 24})
        self.assertEqual(result["overall_status"], "appears_eligible")
        self.assertEqual(result["conditions"][0]["status"], "met")
        self.assertEqual(result["documents"][0]["requirement"], "unknown")

    def test_condition_not_met(self):
        result = evaluate(sample_scheme(self.criteria), {"age": 16})
        self.assertEqual(result["overall_status"], "appears_not_eligible")
        self.assertEqual(result["conditions"][0]["status"], "not_met")

    def test_missing_answer_is_insufficient_information(self):
        result = evaluate(sample_scheme(self.criteria), {})
        self.assertEqual(result["overall_status"], "insufficient_information")
        self.assertEqual(result["conditions"][0]["status"], "needs_more_information")

    def test_unverified_conditions_prevent_a_definitive_negative_result(self):
        scheme = sample_scheme(self.criteria)
        scheme.eligibility_rules.append(Row(id=3, rule_description="Unverified residence rule", rule_type="unverified", criteria=None))
        result = evaluate(scheme, {"age": 16})
        self.assertEqual(result["conditions"][0]["status"], "not_met")
        self.assertEqual(result["overall_status"], "insufficient_information")

    def test_legacy_rule_and_pending_source_are_not_verified(self):
        legacy = sample_scheme(None)
        legacy.eligibility_rules = [Row(id=2, rule_description="Age condition", rule_type="unverified", criteria=None)]
        result = evaluate(legacy, {})
        self.assertEqual(result["overall_status"], "cannot_determine")
        self.assertEqual(result["conditions"][0]["status"], "not_verified")
        self.assertEqual(questionnaire(legacy)["questions"], [])
        pending = evaluate(sample_scheme(self.criteria, verification="pending"), {})
        self.assertEqual(pending["conditions"][0]["status"], "not_verified")
        self.assertIsNone(pending["conditions"][0]["source_url"])

    def test_verified_conditions_require_verified_https_source_and_date(self):
        scheme = sample_scheme(self.criteria)
        scheme.sources[0].last_verified_at = None
        result = evaluate(scheme, {})
        self.assertEqual(result["conditions"][0]["status"], "not_verified")
        self.assertIsNone(result["conditions"][0]["source_url"])
        scheme.sources[0].last_verified_at = datetime.now(timezone.utc)
        scheme.sources[0].source_url = "http://example.gov"
        result = evaluate(scheme, {})
        self.assertEqual(result["conditions"][0]["status"], "not_verified")
        self.assertIsNone(result["conditions"][0]["source_url"])

    def test_demo_and_invalid_answers(self):
        demo = evaluate(sample_scheme(self.criteria, demo=True), {})
        self.assertEqual(demo["overall_status"], "cannot_determine")
        self.assertTrue(demo["is_demo"])
        with self.assertRaises(HTTPException):
            evaluate(sample_scheme(self.criteria), {"age": "a"})
        with self.assertRaises(HTTPException):
            evaluate(sample_scheme(self.criteria), {"aadhaar": "123"})


if __name__ == "__main__":
    unittest.main()

