# Deep Research Agent

A FastAPI-based agent that performs structured literature research across Crossref, OpenAlex, PubMed, and arXiv, extracts content (PDF when available), synthesizes findings, and produces a manuscript in Markdown with references. Includes a simple Tailwind UI and an Android app.

## Features
- Protocol input: objective, questions, keywords, date range, sources
- Multi-source search and deduplication
- PDF download and text extraction (best-effort)
- Lightweight analysis: overview, themes, limitations, gaps, recommendations
- Manuscript generation (Markdown) with references
- UI: home form, job progress, results, manuscript preview + download
- JSON API with CORS for mobile/other clients
- Android app (Jetpack Compose) consuming the JSON API

## Requirements
- Python 3.11+
- Android Studio (for Android app)

## Setup
If virtualenv is available:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
If your environment is externally managed, you can override (not recommended globally):
```bash
pip3 install --break-system-packages -r requirements.txt
```

## Run (Web)
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open http://localhost:8000

## API (JSON)
- POST /api/start -> { job_id }
- GET /api/job/{job_id} -> JobStatus
- GET /api/results/{job_id} -> ResearchOutcome
- GET /api/manuscript/{job_id} -> { markdown }

## Docker
Build and run locally:
```bash
docker build -t deep-research-agent .
docker run -p 8000:8000 deep-research-agent
```

## Deploy (Render)
- Commit the repo to GitHub.
- On Render, create a new Web Service from repo; choose "Use Docker". Render reads `render.yaml`.
- Once deployed, set your Android app `baseUrl` to the Render URL.

## Android App
Path: `android-app/`
- Open in Android Studio.
- Update the `baseUrl` in the app’s UI to your backend URL (emulator default `http://10.0.2.2:8000`).
- Build/Run on emulator or device.

## Notes
- API usage is best-effort and subject to rate limiting.
- PDF extraction may fail; falls back to title/abstract.
- Heuristic analysis can be replaced with advanced models.
