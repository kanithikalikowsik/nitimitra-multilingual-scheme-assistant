from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


class EligibilityRuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    rule_description: str
    rule_type: str
    criteria: dict | None = None


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    document_name: str
    description: str | None


class ApplicationStepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    step_number: int
    instruction: str


class SourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source_name: str
    source_url: HttpUrl | None
    last_verified_at: datetime | None
    verification_status: Literal["pending", "verified", "unverified"]

    @model_validator(mode="after")
    def verified_sources_require_url_and_date(self):
        if self.verification_status == "verified" and (not self.source_url or not self.last_verified_at):
            raise ValueError("A verified source must include its URL and verification date.")
        return self


class SchemeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    category: str
    short_description: str
    overview: str
    benefits: list[str]
    status: str
    is_demo: bool
    created_at: datetime
    updated_at: datetime
    eligibility_rules: list[EligibilityRuleRead] = Field(default_factory=list)
    documents: list[DocumentRead] = Field(default_factory=list)
    application_steps: list[ApplicationStepRead] = Field(default_factory=list)
    sources: list[SourceRead] = Field(default_factory=list)


class CategoryRead(BaseModel):
    id: str
    name: str
    name_te: str
    scheme_count: int


class EligibilityCheckRequest(BaseModel):
    answers: dict[str, str | int | float | bool] = Field(default_factory=dict)


class EligibilityConditionResult(BaseModel):
    rule_id: int
    description: str
    answer: str | int | float | bool | None
    status: Literal["met", "not_met", "needs_more_information", "not_verified"]
    explanation: str
    explanation_key: Literal["rule_unverified", "demo_rule", "answer_missing", "answer_matches", "answer_does_not_match"] | None = None
    source_name: str | None = None
    source_url: HttpUrl | None = None


class EligibilityDocumentResult(BaseModel):
    name: str
    requirement: Literal["required", "optional", "unknown"]
    explanation: str
    explanation_key: Literal["document_requirement_unknown"] | None = None
    source_name: str | None = None
    source_url: HttpUrl | None = None


class EligibilityCheckResponse(BaseModel):
    scheme_id: int
    scheme_name: str
    is_demo: bool
    overall_status: Literal["appears_eligible", "appears_not_eligible", "insufficient_information", "cannot_determine"]
    preliminary: bool = True
    conditions: list[EligibilityConditionResult]
    documents: list[EligibilityDocumentResult]


class AssistantHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1200)


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1500)
    language: Literal["en", "te", "hi"] = "en"
    history: list[AssistantHistoryMessage] = Field(default_factory=list, max_length=8)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Message cannot be blank.")
        return value.strip()


class AssistantSourceReference(BaseModel):
    scheme_name: str
    source_name: str
    source_url: HttpUrl | None
    verification_status: Literal["verified", "pending", "unverified"]
    last_verified_at: str | None = None
    evidence_sections: list[str] = Field(default_factory=list)


class AssistantChatResponse(BaseModel):
    answer: str
    status: Literal["answered", "unavailable", "unverified", "not_found", "error"]
    sources: list[AssistantSourceReference] = Field(default_factory=list)
    stored: Literal[False] = False
