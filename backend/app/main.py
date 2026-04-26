from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

PROJECT_ROOT = Path(__file__).resolve().parents[2]
NOTEBOOK_PATH = Path(
    os.environ.get("NOTEBOOK_PATH", str(PROJECT_ROOT / "Project_Exportable.ipynb"))
)
BUNDLE_DIR = Path(
    os.environ.get("RECOMMENDER_BUNDLE_DIR", str(PROJECT_ROOT / "recommender_bundle"))
)
DEFAULT_TOP_K = int(os.environ.get("RECOMMENDER_TOP_K", "80"))

DEFAULT_HISTORY: tuple[int, ...] = tuple(
    int(value)
    for value in os.environ.get("DEFAULT_USER_HISTORY", "1,10,25,40").split(",")
    if value.strip().isdigit()
)

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "their",
    "this",
    "to",
    "using",
    "via",
    "we",
    "with",
}

app = FastAPI(title="Notebook Recommender API", version="1.0.0")

allowed_origins = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RUNTIME: dict[str, Any] = {
    "namespace": None,
    "artifacts": None,
    "notebook_error": None,
    "bundle_error": None,
}


# Execute notebook code cells so this API stays sourced from Project_Exportable.ipynb.
def _load_notebook_namespace(notebook_path: Path) -> dict[str, Any]:
    with notebook_path.open("r", encoding="utf-8") as notebook_file:
        notebook = json.load(notebook_file)

    namespace: dict[str, Any] = {}
    skip_markers = (
        "# Example: train and export",
        "# Example: load exported artifacts and run inference",
    )

    for cell in notebook.get("cells", []):
        if cell.get("cell_type") != "code":
            continue

        source = cell.get("source", "")
        code = "\n".join(source) if isinstance(source, list) else str(source)
        if not code.strip():
            continue
        if any(marker in code for marker in skip_markers):
            continue

        exec(code, namespace)

    required_symbols = ["clean_text", "load_artifacts", "hybrid_recommend", "cosine_similarity"]
    missing_symbols = [symbol for symbol in required_symbols if symbol not in namespace]
    if missing_symbols:
        missing_text = ", ".join(missing_symbols)
        raise RuntimeError(f"Notebook is missing required symbols: {missing_text}")

    return namespace


def _initialize_runtime() -> None:
    RUNTIME["namespace"] = None
    RUNTIME["artifacts"] = None
    RUNTIME["notebook_error"] = None
    RUNTIME["bundle_error"] = None

    try:
        namespace = _load_notebook_namespace(NOTEBOOK_PATH)
        RUNTIME["namespace"] = namespace
    except Exception as exc:  # pragma: no cover - startup error path
        RUNTIME["notebook_error"] = str(exc)
        return

    if not BUNDLE_DIR.exists():
        RUNTIME["bundle_error"] = (
            f"Bundle directory not found at '{BUNDLE_DIR}'. "
            "Run the training/export cells in Project_Exportable.ipynb first."
        )
        return

    try:
        RUNTIME["artifacts"] = namespace["load_artifacts"](str(BUNDLE_DIR))
    except Exception as exc:  # pragma: no cover - startup error path
        RUNTIME["bundle_error"] = str(exc)


def _clamp_01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _default_history_indices(total_papers: int) -> list[int]:
    if total_papers <= 0:
        return []

    seeded_defaults = [index for index in DEFAULT_HISTORY if 0 <= index < total_papers]
    if seeded_defaults:
        return seeded_defaults

    return list(range(min(4, total_papers)))


def _query_seed_indices(artifacts: dict[str, Any], query: str) -> list[int]:
    clean_text = RUNTIME["namespace"]["clean_text"]
    cosine_similarity = RUNTIME["namespace"]["cosine_similarity"]

    normalized_query = clean_text(query)
    if not normalized_query:
        return _default_history_indices(len(artifacts["papers"]))

    vectorizer = artifacts["vectorizer"]
    tfidf_matrix = artifacts["tfidf_matrix"]
    query_vector = vectorizer.transform([normalized_query]).astype(np.float32)
    similarities = cosine_similarity(query_vector, tfidf_matrix).flatten()

    if not np.isfinite(similarities).any() or float(similarities.max()) <= 0.0:
        return _default_history_indices(len(artifacts["papers"]))

    candidate_count = min(8, len(similarities))
    ranked = similarities.argsort()[-candidate_count:][::-1]
    selected = [int(index) for index in ranked if float(similarities[int(index)]) > 0.0]

    if selected:
        return selected[: min(4, len(selected))]

    return _default_history_indices(len(artifacts["papers"]))


def _normalize_authors(raw_authors: Any) -> list[str]:
    if isinstance(raw_authors, list):
        return [str(author).strip() for author in raw_authors if str(author).strip()]

    if isinstance(raw_authors, str):
        parts = [part.strip() for part in re.split(r",| and ", raw_authors) if part.strip()]
        return parts

    return []


def _extract_primary_category(raw_categories: Any) -> str:
    if isinstance(raw_categories, list) and raw_categories:
        first_category = str(raw_categories[0]).strip()
        return first_category or "Uncategorized"

    if isinstance(raw_categories, str):
        tokens = [token.strip() for token in raw_categories.split() if token.strip()]
        if tokens:
            return tokens[0]

    return "Uncategorized"


def _extract_year(update_date: Any) -> int | str:
    if not update_date:
        return "Unknown"

    match = re.match(r"^(\d{4})", str(update_date))
    if not match:
        return "Unknown"

    return int(match.group(1))


def _build_keywords(paper: dict[str, Any], query: str, max_keywords: int = 6) -> list[str]:
    query_tokens = re.findall(r"[a-z][a-z0-9+-]{2,}", query.lower())
    text_blob = " ".join(
        [
            str(paper.get("title") or ""),
            str(paper.get("categories") or ""),
            str(paper.get("abstract") or ""),
        ]
    ).lower()
    text_tokens = re.findall(r"[a-z][a-z0-9+-]{2,}", text_blob)

    unique_keywords: list[str] = []
    for token in [*query_tokens, *text_tokens]:
        if token in STOPWORDS:
            continue
        if token not in unique_keywords:
            unique_keywords.append(token)
        if len(unique_keywords) >= max_keywords:
            break

    return unique_keywords if unique_keywords else ["research"]


def _build_citation(title: str, authors: list[str], year: int | str) -> str:
    author_text = ", ".join(authors[:3]) if authors else "Unknown author"
    year_text = str(year)
    return f"{author_text} ({year_text}). {title}."


def _format_recommendation(
    paper_index: int,
    paper: dict[str, Any],
    score_components: dict[str, Any],
    query: str,
    content_weight: float,
    popularity_weight: float,
) -> dict[str, Any]:
    title = str(paper.get("title") or "Untitled Paper")
    abstract = str(paper.get("abstract") or "")
    authors = _normalize_authors(paper.get("authors"))
    category = _extract_primary_category(paper.get("categories"))
    year = _extract_year(paper.get("update_date"))

    similarity_score = _clamp_01(float(score_components["content"][paper_index]))
    popularity_score = _clamp_01(float(score_components["popularity"][paper_index]))
    relevance_score = _clamp_01(float(score_components["final"][paper_index]))

    weighted_content = max(0.0, content_weight * similarity_score)
    weighted_popularity = max(0.0, popularity_weight * popularity_score)
    weight_sum = weighted_content + weighted_popularity

    if weight_sum > 0:
        content_contribution = weighted_content / weight_sum
        popularity_contribution = weighted_popularity / weight_sum
    else:
        content_contribution = 0.0
        popularity_contribution = 0.0

    query_active = bool(query.strip())
    user_interest = similarity_score if query_active else 0.0
    explanation = (
        f"Recommended with {round(content_contribution * 100)}% content similarity and "
        f"{round(popularity_contribution * 100)}% popularity signal."
    )

    return {
        "id": str(paper.get("id") or f"paper-{paper_index}"),
        "title": title,
        "authors": authors,
        "abstract": abstract,
        "category": category,
        "year": year,
        "relevanceScore": relevance_score,
        "similarityScore": similarity_score,
        "popularityScore": popularity_score,
        "keywords": _build_keywords(paper, query),
        "contribution": {
            "content": _clamp_01(content_contribution),
            "popularity": _clamp_01(popularity_contribution),
            "userInterest": _clamp_01(user_interest),
        },
        "explanation": explanation,
        "citation": _build_citation(title, authors, year),
    }


def _build_filter_options(papers: list[dict[str, Any]]) -> dict[str, list[str]]:
    categories = sorted({paper["category"] for paper in papers if paper.get("category")})

    year_values = [
        paper["year"]
        for paper in papers
        if isinstance(paper.get("year"), int)
    ]
    unique_years = sorted(set(year_values), reverse=True)

    author_values = sorted(
        {
            author
            for paper in papers
            for author in paper.get("authors", [])
            if author
        }
    )

    return {
        "categories": ["All", *categories],
        "years": ["All", *[str(year) for year in unique_years]],
        "authors": ["All", *author_values],
    }


def _require_artifacts() -> dict[str, Any]:
    if RUNTIME["namespace"] is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load notebook runtime from Project_Exportable.ipynb. "
                f"Details: {RUNTIME['notebook_error']}"
            ),
        )

    if RUNTIME["artifacts"] is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Notebook runtime loaded, but recommender artifacts are unavailable. "
                f"Details: {RUNTIME['bundle_error']}"
            ),
        )

    return RUNTIME["artifacts"]


@app.on_event("startup")
def startup_event() -> None:
    _initialize_runtime()


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "Notebook recommender API is running.",
        "notebook": "Project_Exportable.ipynb",
    }


@app.get("/api/health")
def health() -> dict[str, Any]:
    paper_count = 0
    if RUNTIME["artifacts"] is not None:
        paper_count = len(RUNTIME["artifacts"].get("papers", []))

    return {
        "status": "ok" if RUNTIME["artifacts"] is not None else "degraded",
        "notebookLoaded": RUNTIME["namespace"] is not None,
        "bundleLoaded": RUNTIME["artifacts"] is not None,
        "paperCount": paper_count,
        "notebookPath": str(NOTEBOOK_PATH),
        "bundlePath": str(BUNDLE_DIR),
        "notebookError": RUNTIME["notebook_error"],
        "bundleError": RUNTIME["bundle_error"],
    }


@app.post("/api/reload")
def reload_runtime() -> dict[str, Any]:
    _initialize_runtime()
    return health()


@app.get("/api/recommendations")
def get_recommendations(
    query: str = Query(default="", max_length=300),
    top_k: int = Query(default=DEFAULT_TOP_K, ge=1, le=300),
) -> dict[str, Any]:
    artifacts = _require_artifacts()
    papers = artifacts.get("papers", [])
    paper_count = len(papers)
    if paper_count == 0:
        return {
            "papers": [],
            "filters": {"categories": ["All"], "years": ["All"], "authors": ["All"]},
            "count": 0,
            "source": "Project_Exportable.ipynb",
            "query": query,
        }

    user_indices = _query_seed_indices(artifacts, query)
    available_count = max(1, paper_count - len(user_indices))
    effective_top_k = min(top_k, available_count)

    hybrid_recommend = RUNTIME["namespace"]["hybrid_recommend"]
    top_indices, score_components = hybrid_recommend(
        artifacts,
        user_indices,
        top_k=effective_top_k,
    )

    config = artifacts.get("config", {})
    content_weight = float(config.get("content_weight", 0.7))
    popularity_weight = float(config.get("popularity_weight", 0.3))

    formatted_recommendations: list[dict[str, Any]] = []
    for item in top_indices:
        paper_index = int(item)
        if not (0 <= paper_index < paper_count):
            continue
        if float(score_components["final"][paper_index]) < 0.0:
            continue

        formatted_recommendations.append(
            _format_recommendation(
                paper_index,
                papers[paper_index],
                score_components,
                query,
                content_weight,
                popularity_weight,
            )
        )

    return {
        "papers": formatted_recommendations,
        "filters": _build_filter_options(formatted_recommendations),
        "count": len(formatted_recommendations),
        "source": "Project_Exportable.ipynb",
        "query": query,
        "seedIndices": user_indices,
    }
