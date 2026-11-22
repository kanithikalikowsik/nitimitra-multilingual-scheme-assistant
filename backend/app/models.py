from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Scheme(Base):
    __tablename__ = "schemes"
    __table_args__ = (UniqueConstraint("slug", name="uq_schemes_slug"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    overview: Mapped[str] = mapped_column(Text, nullable=False)
    benefits: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="draft", nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    eligibility_rules: Mapped[list["EligibilityRule"]] = relationship(back_populates="scheme", cascade="all, delete-orphan", order_by="EligibilityRule.id")
    documents: Mapped[list["Document"]] = relationship(back_populates="scheme", cascade="all, delete-orphan", order_by="Document.id")
    application_steps: Mapped[list["ApplicationStep"]] = relationship(back_populates="scheme", cascade="all, delete-orphan", order_by="ApplicationStep.step_number")
    sources: Mapped[list["Source"]] = relationship(back_populates="scheme", cascade="all, delete-orphan", order_by="Source.id")


class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_description: Mapped[str] = mapped_column(Text, nullable=False)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # Optional machine-readable predicate. Legacy prose rules remain valid without this field.
    criteria: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    scheme: Mapped[Scheme] = relationship(back_populates="eligibility_rules")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    document_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    scheme: Mapped[Scheme] = relationship(back_populates="documents")


class ApplicationStep(Base):
    __tablename__ = "application_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    instruction: Mapped[str] = mapped_column(Text, nullable=False)

    scheme: Mapped[Scheme] = relationship(back_populates="application_steps")


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    source_name: Mapped[str] = mapped_column(String(200), nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)

    scheme: Mapped[Scheme] = relationship(back_populates="sources")
