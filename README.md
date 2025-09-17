# Deep Research Agent

A FastAPI-based agent that performs structured literature research across Crossref, OpenAlex, PubMed, and arXiv, extracts content (PDF when available), synthesizes findings, and produces a manuscript in Markdown with references. Includes a simple Tailwind UI.

## Features
- Protocol input: objective, questions, keywords, date range, sources
- Multi-source search and deduplication
- PDF download and text extraction (best-effort)
- Lightweight analysis: overview, themes, limitations, gaps, recommendations
- Manuscript generation (Markdown) with references
- UI: home form, job progress, results, manuscript preview + download

## Requirements
- Python 3.11+

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

## Run
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open http://localhost:8000

## Usage
1. Enter the research objective and optional details on the home page.
2. Submit to start a job; watch progress on the job page.
3. When complete, view results and the manuscript. Download Markdown if desired.

## Notes
- API usage is best-effort and subject to rate limiting.
- PDF extraction may fail for some sources; the system falls back to title/abstract text.
- The analysis and manuscript are deterministic heuristics and can be replaced with more advanced models.

## Next Steps
- Add authentication and persistent storage.
- Integrate robust reference formatting (CSL/APA/IEEE).
- Add full-text parsing (GROBID/ScienceParse) and RAG-based synthesis.
- Implement caching and retry with backoff.
