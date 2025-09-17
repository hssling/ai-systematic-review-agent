from __future__ import annotations

import asyncio
import os
import uuid
from typing import List, Optional

import markdown2
from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .jobs import JobManager
from .models import ResearchOutcome, ResearchProtocol
from .services.orchestrator import run_research


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(os.path.dirname(BASE_DIR), "templates")
STATIC_DIR = os.path.join(os.path.dirname(BASE_DIR), "static")

app = FastAPI(title="Deep Research Agent")
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

templates = Jinja2Templates(directory=TEMPLATES_DIR)

job_manager = JobManager()


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
	return templates.TemplateResponse("index.html", {"request": request})


@app.post("/start")
async def start_research(
	request: Request,
	objective: str = Form(...),
	research_questions: Optional[str] = Form(None),
	include_keywords: Optional[str] = Form(None),
	exclude_keywords: Optional[str] = Form(None),
	date_from: Optional[str] = Form(None),
	date_to: Optional[str] = Form(None),
	sources: Optional[List[str]] = Form(None),
	max_results: int = Form(100),
):
	rq_list = [q.strip() for q in (research_questions or "").splitlines() if q.strip()]
	include_list = [k.strip() for k in (include_keywords or "").split(",") if k.strip()]
	exclude_list = [k.strip() for k in (exclude_keywords or "").split(",") if k.strip()]
	sources_list = [s.strip() for s in (sources or ["crossref", "openalex", "pubmed", "arxiv"]) if s.strip()]

	protocol = ResearchProtocol(
		objective=objective.strip(),
		research_questions=rq_list,
		include_keywords=include_list,
		exclude_keywords=exclude_list,
		date_from=date_from or None,
		date_to=date_to or None,
		sources=sources_list,  # type: ignore[arg-type]
		max_results=max_results,
	)

	job_id = str(uuid.uuid4())
	job_manager.create_job(job_id, protocol)

	# Schedule the async research task on the running event loop
	asyncio.create_task(run_research(job_id, protocol, job_manager))

	return RedirectResponse(url=f"/job/{job_id}", status_code=303)


# JSON API: start research
@app.post("/api/start")
async def api_start(protocol: ResearchProtocol) -> dict:
	job_id = str(uuid.uuid4())
	job_manager.create_job(job_id, protocol)
	asyncio.create_task(run_research(job_id, protocol, job_manager))
	return {"job_id": job_id}


@app.get("/job/{job_id}", response_class=HTMLResponse)
async def job_page(request: Request, job_id: str) -> HTMLResponse:
	# Validate job exists
	try:
		job_manager.get_status(job_id)
	except KeyError:
		raise HTTPException(status_code=404, detail="Job not found")
	return templates.TemplateResponse("job.html", {"request": request, "job_id": job_id})


@app.get("/api/job/{job_id}")
async def job_status(job_id: str):
	try:
		status = job_manager.get_status(job_id)
	except KeyError:
		raise HTTPException(status_code=404, detail="Job not found")
	return status


# JSON API: results
@app.get("/api/results/{job_id}")
async def api_results(job_id: str) -> ResearchOutcome:
	result = job_manager.get_result(job_id)
	if result is None:
		raise HTTPException(status_code=404, detail="Results not ready")
	return result


# JSON API: manuscript markdown
@app.get("/api/manuscript/{job_id}")
async def api_manuscript(job_id: str) -> dict:
	result = job_manager.get_result(job_id)
	if result is None:
		raise HTTPException(status_code=404, detail="Results not ready")
	return {"markdown": result.manuscript.markdown}


@app.get("/results/{job_id}", response_class=HTMLResponse)
async def results_page(request: Request, job_id: str) -> HTMLResponse:
	result = job_manager.get_result(job_id)
	if result is None:
		raise HTTPException(status_code=404, detail="Results not ready")
	return templates.TemplateResponse(
		"results.html",
		{
			"request": request,
			"job_id": job_id,
			"protocol": result.protocol,
			"papers": result.papers,
			"analysis": result.analysis,
		},
	)


@app.get("/manuscript/{job_id}", response_class=HTMLResponse)
async def manuscript_page(request: Request, job_id: str) -> HTMLResponse:
	result = job_manager.get_result(job_id)
	if result is None:
		raise HTTPException(status_code=404, detail="Results not ready")
	html = markdown2.markdown(result.manuscript.markdown)
	return templates.TemplateResponse(
		"manuscript.html",
		{
			"request": request,
			"job_id": job_id,
			"html": html,
		},
	)


@app.get("/download/{job_id}.md")
async def download_markdown(job_id: str) -> Response:
	result = job_manager.get_result(job_id)
	if result is None:
		raise HTTPException(status_code=404, detail="Results not ready")
	return Response(
		content=result.manuscript.markdown,
		media_type="text/markdown",
		headers={"Content-Disposition": f"attachment; filename=manuscript-{job_id}.md"},
	)