from __future__ import annotations

import ast
import json
import os
import re
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from scipy import sparse
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _resolve_notebook_path() -> Path:
    configured_path = os.environ.get("NOTEBOOK_PATH")
    if configured_path:
        candidate = Path(configured_path)
        if not candidate.is_absolute():
            candidate = PROJECT_ROOT / candidate
        return candidate

    candidates = [
        PROJECT_ROOT / "code.ipynb",
        PROJECT_ROOT / "Project_Exportable.ipynb",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0]


def _resolve_bundle_path() -> Path:
    configured_path = os.environ.get("RECOMMENDER_BUNDLE_DIR")
    if configured_path:
        candidate = Path(configured_path)
        if not candidate.is_absolute():
            candidate = PROJECT_ROOT / candidate
        return candidate

    candidates = [
        PROJECT_ROOT / "recommender_bundle" / "recommender_bundle",
        PROJECT_ROOT / "recommender_bundle",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0]


NOTEBOOK_PATH = _resolve_notebook_path()
BUNDLE_DIR = _resolve_bundle_path()
DEFAULT_TOP_K = int(os.environ.get("RECOMMENDER_TOP_K", "50"))
SEARCH_PAPER_LIMIT = int(os.environ.get("SEARCH_PAPER_LIMIT", "10000"))

DEFAULT_HISTORY: tuple[int, ...] = tuple(
    int(value)
    for value in os.environ.get("DEFAULT_USER_HISTORY", "1,10,25,40").split(",")
    if value.strip().isdigit()
)
DEFAULT_HISTORY_IDS: tuple[str, ...] = tuple(
    value.strip()
    for value in os.environ.get("DEFAULT_USER_HISTORY_IDS", "").split(",")
    if value.strip()
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
    for cell in notebook.get("cells", []):
        if cell.get("cell_type") != "code":
            continue

        source = cell.get("source", "")
        code = "\n".join(source) if isinstance(source, list) else str(source)
        if not code.strip():
            continue

        parsed = ast.parse(code, filename=str(notebook_path), mode="exec")
        executable_nodes = []

        def _is_safe_assignment_value(node: ast.AST) -> bool:
            if isinstance(node, ast.Constant):
                return True
            if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
                return all(_is_safe_assignment_value(item) for item in node.elts)
            if isinstance(node, ast.Dict):
                return all(
                    (key is None or _is_safe_assignment_value(key))
                    and _is_safe_assignment_value(value)
                    for key, value in zip(node.keys, node.values)
                )
            return False

        for node in parsed.body:
            if isinstance(
                node,
                (
                    ast.Import,
                    ast.ImportFrom,
                    ast.FunctionDef,
                    ast.AsyncFunctionDef,
                    ast.ClassDef,
                ),
            ):
                executable_nodes.append(node)
                continue

            if isinstance(node, ast.Assign) and _is_safe_assignment_value(node.value):
                executable_nodes.append(node)
                continue

            if isinstance(node, ast.AnnAssign) and node.value is not None and _is_safe_assignment_value(node.value):
                executable_nodes.append(node)

        if not executable_nodes:
            continue

        parsed.body = executable_nodes
        compiled = compile(parsed, filename=str(notebook_path), mode="exec")
        exec(compiled, namespace)

    required_symbols = ["clean_text", "hybrid_recommend", "cosine_similarity", "normalize"]
    missing_symbols = [symbol for symbol in required_symbols if symbol not in namespace]
    if missing_symbols:
        missing_text = ", ".join(missing_symbols)
        raise RuntimeError(f"Notebook is missing required symbols: {missing_text}")

    return namespace


def _load_first_n_array_items(file_path: Path, limit: int) -> list[Any]:
    if limit <= 0:
        return []

    decoder = json.JSONDecoder()
    items: list[Any] = []

    with file_path.open("r", encoding="utf-8") as json_file:
        buffer = ""
        index = 0
        started = False
        exhausted = False

        def ensure_data() -> bool:
            nonlocal buffer, exhausted
            if exhausted:
                return False
            chunk = json_file.read(1024 * 1024)
            if not chunk:
                exhausted = True
                return False
            buffer += chunk
            return True

        while len(items) < limit:
            while True:
                if index >= len(buffer):
                    if not ensure_data():
                        break
                    continue

                char = buffer[index]
                if char.isspace():
                    index += 1
                    continue

                if not started:
                    if char != "[":
                        raise ValueError(f"Expected '[' at start of JSON array in {file_path}")
                    started = True
                    index += 1
                    continue

                if char == ",":
                    index += 1
                    continue

                break

            if not started:
                if not ensure_data():
                    raise ValueError(f"Unable to parse JSON array from {file_path}")
                continue

            if index >= len(buffer):
                if exhausted:
                    break
                if not ensure_data():
                    break
                continue

            if buffer[index] == "]":
                break

            while True:
                try:
                    item, end_index = decoder.raw_decode(buffer, index)
                    items.append(item)
                    index = end_index
                    break
                except json.JSONDecodeError:
                    if not ensure_data():
                        raise ValueError(f"Unexpected end of JSON while reading {file_path}")

            if index > 2 * 1024 * 1024:
                buffer = buffer[index:]
                index = 0

    return items


def _load_runtime_artifacts(namespace: dict[str, Any], bundle_dir: Path) -> dict[str, Any]:
    vectorizer = joblib.load(bundle_dir / "vectorizer.joblib")
    tfidf_matrix = sparse.load_npz(bundle_dir / "tfidf_matrix.npz")
    popularity = np.load(bundle_dir / "popularity.npy")

    with (bundle_dir / "config.json").open("r", encoding="utf-8") as config_file:
        config = json.load(config_file)

    full_paper_count = int(popularity.shape[0])
    searchable_paper_count = min(max(0, SEARCH_PAPER_LIMIT), full_paper_count)
    searchable_papers = _load_first_n_array_items(
        bundle_dir / "papers.json",
        searchable_paper_count,
    )

    if len(searchable_papers) < searchable_paper_count:
        searchable_paper_count = len(searchable_papers)

    return {
        "papers": searchable_papers,
        "vectorizer": vectorizer,
        "tfidf_matrix": tfidf_matrix,
        "popularity": popularity,
        "config": config,
        "full_paper_count": full_paper_count,
        "searchable_paper_count": searchable_paper_count,
    }


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
        RUNTIME["artifacts"] = _load_runtime_artifacts(namespace, BUNDLE_DIR)
    except Exception as exc:  # pragma: no cover - startup error path
        RUNTIME["bundle_error"] = str(exc)


def _clamp_01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _profile_ids_to_indices(artifacts: dict[str, Any], profile_ids: list[str]) -> list[int]:
    papers = artifacts.get("papers", [])
    id_to_index: dict[str, int] = {}
    for index, paper in enumerate(papers):
        paper_id = str(paper.get("id") or "").strip()
        if paper_id and paper_id not in id_to_index:
            id_to_index[paper_id] = index

    selected: list[int] = []
    seen: set[int] = set()
    for paper_id in profile_ids:
        idx = id_to_index.get(str(paper_id).strip())
        if idx is None or idx in seen:
            continue
        selected.append(int(idx))
        seen.add(int(idx))

    return selected


def _default_history_indices(artifacts: dict[str, Any]) -> list[int]:
    total_papers = len(artifacts.get("papers", []))
    if total_papers <= 0:
        return []

    if DEFAULT_HISTORY_IDS:
        seed_from_ids = _profile_ids_to_indices(artifacts, list(DEFAULT_HISTORY_IDS))
        if seed_from_ids:
            return seed_from_ids

    seeded_defaults = [index for index in DEFAULT_HISTORY if 0 <= index < total_papers]
    if seeded_defaults:
        return seeded_defaults

    return list(range(min(4, total_papers)))


def _query_seed_indices(
    artifacts: dict[str, Any], query: str, profile_ids: list[str] | None = None
) -> list[int]:
    clean_text = RUNTIME["namespace"]["clean_text"]
    cosine_similarity = RUNTIME["namespace"]["cosine_similarity"]
    provided_profile_ids = profile_ids or []

    normalized_query = clean_text(query)
    if not normalized_query:
        seed_from_profile = _profile_ids_to_indices(artifacts, provided_profile_ids)
        if seed_from_profile:
            return seed_from_profile
        return _default_history_indices(artifacts)

    vectorizer = artifacts["vectorizer"]
    tfidf_matrix = artifacts["tfidf_matrix"]
    query_vector = vectorizer.transform([normalized_query]).astype(np.float32)
    similarities = cosine_similarity(query_vector, tfidf_matrix).flatten()

    if not np.isfinite(similarities).any() or float(similarities.max()) <= 0.0:
        seed_from_profile = _profile_ids_to_indices(artifacts, provided_profile_ids)
        if seed_from_profile:
            return seed_from_profile
        return _default_history_indices(artifacts)

    candidate_count = min(8, len(similarities))
    ranked = similarities.argsort()[-candidate_count:][::-1]
    selected = [int(index) for index in ranked if float(similarities[int(index)]) > 0.0]

    if selected:
        return selected[: min(4, len(selected))]

    seed_from_profile = _profile_ids_to_indices(artifacts, provided_profile_ids)
    if seed_from_profile:
        return seed_from_profile

    return _default_history_indices(artifacts)


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
    user_interest = similarity_score if not query_active else 0.0
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


def _format_paper_by_id(paper_index: int, paper: dict[str, Any], pop_score: float) -> dict[str, Any]:
    title = str(paper.get("title") or "Untitled Paper")
    abstract = str(paper.get("abstract") or "")
    authors = _normalize_authors(paper.get("authors"))
    category = _extract_primary_category(paper.get("categories"))
    year = _extract_year(paper.get("update_date"))
    popularity_score = _clamp_01(pop_score)

    return {
        "id": str(paper.get("id") or f"paper-{paper_index}"),
        "title": title,
        "authors": authors,
        "abstract": abstract,
        "category": category,
        "year": year,
        "relevanceScore": popularity_score,
        "similarityScore": 0.0,
        "popularityScore": popularity_score,
        "keywords": _build_keywords(paper, ""),
        "contribution": {
            "content": 0.0,
            "popularity": 1.0,
            "userInterest": 0.0,
        },
        "explanation": "Loaded from your saved/profile paper IDs.",
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
                f"Failed to load notebook runtime from {NOTEBOOK_PATH.name}. "
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
        "notebook": NOTEBOOK_PATH.name,
    }


@app.get("/api/health")
def health() -> dict[str, Any]:
    paper_count = 0
    full_paper_count = 0
    if RUNTIME["artifacts"] is not None:
        paper_count = len(RUNTIME["artifacts"].get("papers", []))
        full_paper_count = int(RUNTIME["artifacts"].get("full_paper_count", paper_count))

    return {
        "status": "ok" if RUNTIME["artifacts"] is not None else "degraded",
        "notebookLoaded": RUNTIME["namespace"] is not None,
        "bundleLoaded": RUNTIME["artifacts"] is not None,
        "paperCount": paper_count,
        "searchablePaperCount": paper_count,
        "fullPaperCount": full_paper_count,
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
    profile_ids: str = Query(default="", max_length=4000),
    top_k: int = Query(default=DEFAULT_TOP_K, ge=1, le=300),
) -> dict[str, Any]:
    artifacts = _require_artifacts()
    papers = artifacts.get("papers", [])
    searchable_count = len(papers)
    full_paper_count = int(artifacts.get("full_paper_count", searchable_count))
    if searchable_count == 0 or full_paper_count == 0:
        return {
            "papers": [],
            "filters": {"categories": ["All"], "years": ["All"], "authors": ["All"]},
            "count": 0,
            "source": NOTEBOOK_PATH.name,
            "query": query,
        }

    profile_id_list = [value.strip() for value in profile_ids.split(",") if value.strip()]
    user_indices = _query_seed_indices(artifacts, query, profile_id_list)
    available_count = max(1, full_paper_count - len(user_indices))
    desired_count = min(top_k, searchable_count)
    candidate_pool = min(available_count, max(desired_count * 10, desired_count + 100))

    hybrid_recommend = RUNTIME["namespace"]["hybrid_recommend"]
    top_indices, score_components = hybrid_recommend(
        artifacts,
        user_indices,
        top_k=candidate_pool,
    )

    config = artifacts.get("config", {})
    content_weight = float(config.get("content_weight", 0.7))
    popularity_weight = float(config.get("popularity_weight", 0.3))

    formatted_recommendations: list[dict[str, Any]] = []
    used_indices: set[int] = set()
    for item in top_indices:
        paper_index = int(item)
        if not (0 <= paper_index < searchable_count):
            continue
        if float(score_components["final"][paper_index]) < 0.0:
            continue
        if paper_index in used_indices:
            continue

        used_indices.add(paper_index)

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

        if len(formatted_recommendations) >= desired_count:
            break

    if len(formatted_recommendations) < desired_count:
        available_scores = np.asarray(score_components["final"][:searchable_count], dtype=float)
        ranked_fallback = available_scores.argsort()[::-1]
        for item in ranked_fallback:
            paper_index = int(item)
            if paper_index in used_indices:
                continue
            if float(score_components["final"][paper_index]) < 0.0:
                continue

            used_indices.add(paper_index)
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

            if len(formatted_recommendations) >= desired_count:
                break

    return {
        "papers": formatted_recommendations,
        "filters": _build_filter_options(formatted_recommendations),
        "count": len(formatted_recommendations),
        "source": NOTEBOOK_PATH.name,
        "query": query,
        "seedPaperIds": [
            str(papers[index].get("id") or f"paper-{index}")
            for index in user_indices
            if 0 <= index < searchable_count
        ],
        "seedIndices": user_indices,
    }


@app.get("/api/papers")
def get_papers(
    query: str = Query(default="", max_length=300),
    top_k: int = Query(default=DEFAULT_TOP_K, ge=1, le=500),
) -> dict[str, Any]:
    artifacts = _require_artifacts()
    papers = artifacts.get("papers", [])
    searchable_count = len(papers)
    if searchable_count == 0:
        return {
            "papers": [],
            "filters": {"categories": ["All"], "years": ["All"], "authors": ["All"]},
            "count": 0,
            "source": NOTEBOOK_PATH.name,
            "query": query,
        }

    clean_text = RUNTIME["namespace"]["clean_text"]
    cosine_similarity = RUNTIME["namespace"]["cosine_similarity"]
    normalize_fn = RUNTIME["namespace"]["normalize"]
    normalized_query = clean_text(query)

    tfidf_matrix = artifacts["tfidf_matrix"]
    popularity = artifacts["popularity"]
    pop_scores_full = normalize_fn(popularity)

    if normalized_query:
        query_vector = artifacts["vectorizer"].transform([normalized_query]).astype(np.float32)
        content_scores_full = cosine_similarity(query_vector, tfidf_matrix).flatten()
        content_scores_full = normalize_fn(content_scores_full)
    else:
        content_scores_full = np.zeros(pop_scores_full.shape[0], dtype=np.float32)

    pop_scores = np.asarray(pop_scores_full[:searchable_count], dtype=np.float32)
    content_scores = np.asarray(content_scores_full[:searchable_count], dtype=np.float32)

    config = artifacts.get("config", {})
    content_weight = float(config.get("content_weight", 0.7))
    popularity_weight = float(config.get("popularity_weight", 0.3))

    if normalized_query:
        final_scores = normalize_fn(content_weight * content_scores + popularity_weight * pop_scores)
    else:
        final_scores = pop_scores

    candidate_count = min(top_k, searchable_count)
    ranked_indices = final_scores.argsort()[-candidate_count:][::-1]

    score_components = {
        "content": content_scores,
        "popularity": pop_scores,
        "final": final_scores,
    }

    formatted_papers = [
        _format_recommendation(
            int(index),
            papers[int(index)],
            score_components,
            query,
            content_weight,
            popularity_weight,
        )
        for index in ranked_indices
    ]

    return {
        "papers": formatted_papers,
        "filters": _build_filter_options(formatted_papers),
        "count": len(formatted_papers),
        "source": NOTEBOOK_PATH.name,
        "query": query,
    }


@app.get("/api/papers/by-ids")
def get_papers_by_ids(
    ids: str = Query(default="", max_length=10000),
) -> dict[str, Any]:
    artifacts = _require_artifacts()
    papers = artifacts.get("papers", [])
    searchable_count = len(papers)
    if searchable_count == 0:
        return {
            "papers": [],
            "filters": {"categories": ["All"], "years": ["All"], "authors": ["All"]},
            "count": 0,
            "source": NOTEBOOK_PATH.name,
        }

    requested_ids = [value.strip() for value in ids.split(",") if value.strip()]
    if not requested_ids:
        return {
            "papers": [],
            "filters": {"categories": ["All"], "years": ["All"], "authors": ["All"]},
            "count": 0,
            "source": NOTEBOOK_PATH.name,
        }

    id_to_index: dict[str, int] = {}
    for index, paper in enumerate(papers):
        paper_id = str(paper.get("id") or "").strip()
        if paper_id and paper_id not in id_to_index:
            id_to_index[paper_id] = index

    normalize_fn = RUNTIME["namespace"]["normalize"]
    pop_scores = normalize_fn(artifacts["popularity"])

    results: list[dict[str, Any]] = []
    for paper_id in requested_ids:
        paper_index = id_to_index.get(paper_id)
        if paper_index is None or not (0 <= paper_index < searchable_count):
            continue

        results.append(
            _format_paper_by_id(
                paper_index,
                papers[paper_index],
                float(pop_scores[paper_index]),
            )
        )

    return {
        "papers": results,
        "filters": _build_filter_options(results),
        "count": len(results),
        "source": NOTEBOOK_PATH.name,
    }
