# RS_Project

This project now includes a notebook-backed API so the frontend can consume recommendations generated from `Project_Exportable.ipynb` artifacts.

## Architecture

- Notebook backend source: `Project_Exportable.ipynb`
- API server: `backend/app/main.py` (loads notebook code cells and exported bundle)
- Frontend: `Frontend/` (React + Vite), calls `/api/recommendations`

## 1) Export Artifacts From Notebook

Run the training/export cells in `Project_Exportable.ipynb` so a `recommender_bundle/` folder is created in the project root.

Expected files in `recommender_bundle/`:

- `vectorizer.joblib`
- `tfidf_matrix.npz`
- `popularity.npy`
- `papers.json`
- `config.json`

If this folder is missing, the backend starts in degraded mode and the frontend falls back to mock papers.

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

- `NOTEBOOK_PATH` (default: `Project_Exportable.ipynb`)
- `RECOMMENDER_BUNDLE_DIR` (default: `recommender_bundle`)
- `RECOMMENDER_TOP_K` (default: `80`)
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