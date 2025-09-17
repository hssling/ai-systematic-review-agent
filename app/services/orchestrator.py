from __future__ import annotations

import asyncio
from typing import Dict, List

from ..jobs import JobManager
from ..models import AnalysisResult, Extraction, Manuscript, Paper, ResearchOutcome, ResearchProtocol
from .analysis import analyze
from .manuscript import build_manuscript
from .pdf_utils import download_pdf, extract_text_from_pdf
from .sources import search_all_sources


async def run_research(job_id: str, protocol: ResearchProtocol, jobs: JobManager) -> None:
	try:
		jobs.set_running(job_id, stage="protocoling")
		await asyncio.sleep(0.05)

		jobs.update(job_id, 10, stage="searching", log="Searching across literature sources...")
		papers: List[Paper] = await search_all_sources(protocol)

		jobs.update(job_id, 40, stage="extracting", log=f"Extracting content from {len(papers)} papers...")
		extractions: Dict[str, Extraction] = {}
		for idx, p in enumerate(papers[: min(30, len(papers))]):
			text = ""
			if p.pdf_url:
				data = await download_pdf(p.pdf_url)
				if data:
					text = extract_text_from_pdf(data, max_pages=15)
			# fallback to title+abstract if available
			if not text:
				text = f"{p.title}\n{p.abstract or ''}"
			extractions[p.id] = Extraction(paper_id=p.id, key_findings=text[:4000])
			if idx % 5 == 0:
				jobs.update(job_id, 40 + int(20 * (idx + 1) / max(1, len(papers))), stage="extracting")

		jobs.update(job_id, 70, stage="analyzing", log="Synthesizing insights...")
		analysis: AnalysisResult = analyze(papers, list(extractions.values()), protocol.objective)

		jobs.update(job_id, 85, stage="writing", log="Generating manuscript...")
		manuscript: Manuscript = build_manuscript(protocol, papers[:30], analysis)

		outcome = ResearchOutcome(
			protocol=protocol,
			papers=papers,
			extractions=extractions,
			analysis=analysis,
			manuscript=manuscript,
		)
		jobs.set_completed(job_id, outcome)
	except Exception as exc:
		jobs.set_failed(job_id, error=str(exc))