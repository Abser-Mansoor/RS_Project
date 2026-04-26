# RS_Project

This project now includes a notebook-backed API so the frontend can consume recommendations generated from notebook artifacts.

## Architecture

- Notebook backend source: `code.ipynb` (fallback: `Project_Exportable.ipynb`)
- API server: `backend/app/main.py` (loads notebook code cells and exported bundle)
- Frontend: `Frontend/` (React + Vite), calls `/api/recommendations`

## 1) Export Artifacts From Notebook

Run the training/export cells in `code.ipynb` so a `recommender_bundle/` folder is created in the project root.

Expected files in `recommender_bundle/`:

- `vectorizer.joblib`
- `tfidf_matrix.npz`
- `popularity.npy`
- `papers.json`
- `config.json`

If this folder is missing, the backend starts in degraded mode and the frontend falls back to mock papers.

The backend auto-detects both common bundle layouts:

- `recommender_bundle/recommender_bundle/` (nested export)
- `recommender_bundle/` (flat export)

To reduce RAM pressure with very large bundles, the backend only loads a limited
number of paper metadata records from `papers.json` for online querying (default: 10,000).
Recommendation scoring still uses the full trained components (`vectorizer`,
`tfidf_matrix`, and `popularity`).

## 2) Start Backend (FastAPI)

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:

```powershell
curl http://127.0.0.1:8000/api/health
```

Optional environment variables:

- `NOTEBOOK_PATH` (default auto-detect: `code.ipynb`, then `Project_Exportable.ipynb`)
- `RECOMMENDER_BUNDLE_DIR` (default auto-detect: nested then flat bundle path)
- `RECOMMENDER_TOP_K` (default: `80`)
- `SEARCH_PAPER_LIMIT` (default: `10000`)
- `DEFAULT_USER_HISTORY` (default: `1,10,25,40`)
- `ALLOWED_ORIGINS` (default includes `localhost:5173`)

See `backend/.env.example` for a template.

## 3) Start Frontend

In a new terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Vite is configured to proxy `/api/*` to `http://127.0.0.1:8000`.

## API Endpoint Used by Frontend

- `GET /api/recommendations?query=<text>&top_k=<int>`

Response includes papers mapped to the existing UI schema:

- `id`, `title`, `authors`, `abstract`, `category`, `year`
- `relevanceScore`, `similarityScore`, `popularityScore`
- `keywords`, `contribution`, `explanation`, `citation`