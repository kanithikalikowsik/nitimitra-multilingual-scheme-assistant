from typing import Any
from urllib.parse import urlparse

from fastapi import HTTPException

ALLOWED_OPERATORS = {"eq", "neq", "gte", "lte", "gt", "lt", "in"}


def _verified_source(scheme, source) -> bool:
    if scheme.is_demo or not source or source.verification_status != "verified" or not source.source_url or not source.last_verified_at:
        return False
    return urlparse(source.source_url).scheme == "https"


def _sensitive_field(field: str) -> bool:
    normalized = field.casefold()
    return any(token in normalized for token in ("aadhaar", "bank_account", "password", "pan_number"))


def _compare(actual: Any, operator: str, expected: Any) -> bool:
    if operator == "eq":
        return actual == expected
    if operator == "neq":
        return actual != expected
    if operator in {"gt", "gte", "lt", "lte"}:
        if isinstance(actual, bool) or isinstance(expected, bool) or not isinstance(actual, (int, float)) or not isinstance(expected, (int, float)):
            raise ValueError("This condition requires numeric values.")
        return {"gt": actual > expected, "gte": actual >= expected, "lt": actual < expected, "lte": actual <= expected}[operator]
    if operator == "in":
        if not isinstance(expected, list):
            raise ValueError("The configured allowed values are invalid.")
        return actual in expected
    raise ValueError("The configured condition operator is unsupported.")


def _rule_is_verified(rule, source, scheme) -> bool:
    criteria = rule.criteria
    return (
        not scheme.is_demo
        and rule.rule_type not in {"demo", "unverified"}
        and _verified_source(scheme, source)
        and isinstance(criteria, dict)
        and criteria.get("verification_status") == "verified"
    )


def evaluate(scheme, answers: dict[str, Any]) -> dict:
    if any(_sensitive_field(key) for key in answers):
        raise HTTPException(status_code=422, detail="Sensitive personal information is not accepted.")
    source = next((item for item in scheme.sources if _verified_source(scheme, item)), None) or next(iter(scheme.sources), None)
    accepted_fields = {rule.criteria.get("field") for rule in scheme.eligibility_rules if _rule_is_verified(rule, source, scheme) and isinstance(rule.criteria.get("field"), str) and not _sensitive_field(rule.criteria["field"])}
    if set(answers) - accepted_fields:
        raise HTTPException(status_code=422, detail="An answer was provided for an unknown question.")
    conditions = []
    verified_outcomes = []
    needs_information = False

    for rule in scheme.eligibility_rules:
        criteria = rule.criteria
        result = {"rule_id": rule.id, "description": rule.rule_description, "answer": None,
                  "status": "not_verified", "explanation": "This rule or its structured criteria has not been verified and cannot be evaluated.",
                  "explanation_key": "rule_unverified",
                  "source_name": source.source_name if source else None, "source_url": source.source_url if _verified_source(scheme, source) else None}
        if not _rule_is_verified(rule, source, scheme):
            if scheme.is_demo:
                result["explanation"] = "This is demo information, not a verified scheme rule."
                result["explanation_key"] = "demo_rule"
            conditions.append(result)
            continue
        field = criteria.get("field")
        operator = criteria.get("operator")
        if not isinstance(field, str) or _sensitive_field(field) or operator not in ALLOWED_OPERATORS or "expected" not in criteria:
            conditions.append(result)
            continue
        if field not in answers:
            result.update(status="needs_more_information", explanation="Please answer this question to evaluate the published condition.", explanation_key="answer_missing")
            needs_information = True
            conditions.append(result)
            continue
        answer = answers[field]
        if isinstance(answer, str) and len(answer) > 300:
            raise HTTPException(status_code=422, detail="Answers must be 300 characters or fewer.")
        if isinstance(answer, str) and not answer.strip():
            result.update(status="needs_more_information", explanation="Please provide an answer to evaluate this condition.", explanation_key="answer_missing")
            needs_information = True
            conditions.append(result)
            continue
        if operator in {"gt", "gte", "lt", "lte"} and (isinstance(answer, bool) or not isinstance(answer, (int, float))):
            raise HTTPException(status_code=422, detail="This question requires a valid number.")
        result["answer"] = answer
        try:
            matched = _compare(answer, operator, criteria["expected"])
        except ValueError:
            conditions.append(result)
            continue
        result.update(status="met" if matched else "not_met", explanation=(
            "Your answer matches this structured condition." if matched else
            "Your answer does not match this structured condition."
        ), explanation_key="answer_matches" if matched else "answer_does_not_match")
        verified_outcomes.append(matched)
        conditions.append(result)

    if scheme.is_demo or not conditions or not verified_outcomes and all(c["status"] == "not_verified" for c in conditions):
        overall = "cannot_determine"
    elif needs_information or any(c["status"] == "not_verified" for c in conditions):
        overall = "insufficient_information"
    elif False in verified_outcomes:
        overall = "appears_not_eligible"
    elif verified_outcomes and all(verified_outcomes):
        overall = "appears_eligible"
    else:
        overall = "cannot_determine"

    documents = [{"name": document.document_name, "requirement": "unknown",
                  "explanation": document.description or "This document is listed on the scheme record, but whether it is required is not specified.",
                  "explanation_key": None if document.description else "document_requirement_unknown",
                  "source_name": source.source_name if source else None, "source_url": source.source_url if _verified_source(scheme, source) else None}
                 for document in scheme.documents]
    return {"scheme_id": scheme.id, "scheme_name": scheme.name, "is_demo": scheme.is_demo,
            "overall_status": overall, "preliminary": True, "conditions": conditions, "documents": documents}


def questionnaire(scheme) -> dict:
    questions = []
    source = next((item for item in scheme.sources if _verified_source(scheme, item)), None) or next(iter(scheme.sources), None)
    for rule in scheme.eligibility_rules:
        criteria = rule.criteria
        if not _rule_is_verified(rule, source, scheme):
            continue
        field = criteria.get("field")
        operator = criteria.get("operator")
        if isinstance(field, str) and not _sensitive_field(field) and operator in ALLOWED_OPERATORS and "expected" in criteria:
            question = criteria.get("question")
            field_type = criteria.get("field_type")
            options = criteria.get("options")
            questions.append({"field": field, "label": question if isinstance(question, str) and question.strip() else rule.rule_description,
                              "type": field_type if field_type in {"text", "number", "select"} else "text",
                              "options": [option for option in options if isinstance(option, (str, int, float)) and not isinstance(option, bool)] if isinstance(options, list) else [],
                              "rule_id": rule.id})
    return {"scheme_id": scheme.id, "scheme_name": scheme.name, "is_demo": scheme.is_demo,
            "questions": questions, "rule_count": len(scheme.eligibility_rules),
            "source_name": source.source_name if source else None, "source_url": source.source_url if _verified_source(scheme, source) else None}
