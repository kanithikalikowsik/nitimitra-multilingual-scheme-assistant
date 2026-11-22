import os
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import String, func, or_
from sqlalchemy.orm import Session, selectinload

from .categories import SCHEME_CATEGORIES, normalize_category
from .assistant_service import answer_question
from .database import get_db
from .eligibility import evaluate as evaluate_eligibility, questionnaire as eligibility_questionnaire
from .models import ApplicationStep, Document, EligibilityRule, Scheme
from .schemas import AssistantChatRequest, AssistantChatResponse, CategoryRead, EligibilityCheckRequest, EligibilityCheckResponse, SchemeRead
from .seed import initialize_and_seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_and_seed()
    yield


app = FastAPI(
    title="NitiMitra API",
    version="0.2.0",
    description="Public information service for NitiMitra. Scheme records are informational and do not make official eligibility decisions.",
    lifespan=lifespan,
)

origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"]
)


def _scheme_query(db: Session):
    return db.query(Scheme).options(
        selectinload(Scheme.eligibility_rules),
        selectinload(Scheme.documents),
        selectinload(Scheme.application_steps),
        selectinload(Scheme.sources),
    )


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "nitimitra-api"}


@app.get("/api/categories", response_model=list[CategoryRead], tags=["schemes"])
def list_categories(db: Session = Depends(get_db)):
    counts = dict(db.query(Scheme.category, func.count(Scheme.id)).group_by(Scheme.category).all())
    return [{**category, "scheme_count": counts.get(category["id"], 0)} for category in SCHEME_CATEGORIES]


@app.get("/api/schemes/search", response_model=list[SchemeRead], tags=["schemes"])
def search_schemes(
    q: Annotated[str, Query(min_length=1, max_length=120)],
    category: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    db: Session = Depends(get_db),
):
    keyword = q.strip()
    if not keyword:
        raise HTTPException(status_code=422, detail="Search query cannot be blank")
    pattern = f"%{keyword}%"
    query = _scheme_query(db).filter(or_(
        Scheme.name.ilike(pattern),
        Scheme.slug.ilike(pattern),
        Scheme.category.ilike(pattern),
        Scheme.short_description.ilike(pattern),
        Scheme.overview.ilike(pattern),
        Scheme.benefits.cast(String).ilike(pattern),
        Scheme.eligibility_rules.any(EligibilityRule.rule_description.ilike(pattern)),
        Scheme.documents.any(or_(Document.document_name.ilike(pattern), Document.description.ilike(pattern))),
        Scheme.application_steps.any(ApplicationStep.instruction.ilike(pattern)),
    ))
    if category:
        query = query.filter(Scheme.category == normalize_category(category))
    return query.order_by(Scheme.id).all()


@app.get("/api/schemes", response_model=list[SchemeRead], tags=["schemes"])
def list_schemes(
    category: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    db: Session = Depends(get_db),
):
    query = _scheme_query(db)
    if category:
        query = query.filter(Scheme.category == normalize_category(category))
    return query.order_by(Scheme.id).all()


@app.get("/api/schemes/slug/{slug}", response_model=SchemeRead, tags=["schemes"])
def get_scheme_by_slug(
    slug: Annotated[str, Path(min_length=1, max_length=200, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")],
    db: Session = Depends(get_db),
):
    scheme = _scheme_query(db).filter(Scheme.slug == slug).first()
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme


@app.get("/api/schemes/slug/{slug}/eligibility", tags=["eligibility"])
def get_eligibility_questionnaire(slug: str, db: Session = Depends(get_db)):
    scheme = _scheme_query(db).filter(Scheme.slug == slug).first()
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return eligibility_questionnaire(scheme)


@app.post("/api/schemes/slug/{slug}/eligibility-check", response_model=EligibilityCheckResponse, tags=["eligibility"])
def check_eligibility(slug: str, payload: EligibilityCheckRequest, db: Session = Depends(get_db)):
    scheme = _scheme_query(db).filter(Scheme.slug == slug).first()
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return evaluate_eligibility(scheme, payload.answers)


@app.post("/api/assistant/chat", response_model=AssistantChatResponse, tags=["assistant"])
async def assistant_chat(payload: AssistantChatRequest, db: Session = Depends(get_db)):
    return await answer_question(
        db,
        message=payload.message,
        language=payload.language,
        history=[entry.model_dump() for entry in payload.history],
    )


@app.get("/api/schemes/{scheme_id}", response_model=SchemeRead, tags=["schemes"])
def get_scheme(
    scheme_id: Annotated[int, Path(gt=0)],
    db: Session = Depends(get_db),
):
    scheme = _scheme_query(db).filter(Scheme.id == scheme_id).first()
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme
