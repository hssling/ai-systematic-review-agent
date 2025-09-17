from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


SearchSource = Literal["crossref", "openalex", "pubmed", "arxiv"]


class ResearchProtocol(BaseModel):
	objective: str
	research_questions: List[str] = Field(default_factory=list)
	include_keywords: List[str] = Field(default_factory=list)
	exclude_keywords: List[str] = Field(default_factory=list)
	date_from: Optional[str] = None  # YYYY or YYYY-MM-DD
	date_to: Optional[str] = None
	sources: List[SearchSource] = Field(default_factory=lambda: ["crossref", "openalex", "pubmed", "arxiv"])
	max_results: int = 100
	created_at: datetime = Field(default_factory=datetime.utcnow)


class Paper(BaseModel):
	id: str
	title: str
	abstract: Optional[str] = None
	authors: List[str] = Field(default_factory=list)
	journal: Optional[str] = None
	year: Optional[int] = None
	doi: Optional[str] = None
	url: Optional[str] = None
	pdf_url: Optional[str] = None
	source: SearchSource = "crossref"
	score: Optional[float] = None


class Extraction(BaseModel):
	paper_id: str
	key_findings: str
	methods: Optional[str] = None
	limitations: Optional[str] = None


class AnalysisResult(BaseModel):
	overview_summary: str
	themes: List[str] = Field(default_factory=list)
	limitations: List[str] = Field(default_factory=list)
	gaps: List[str] = Field(default_factory=list)
	recommendations: List[str] = Field(default_factory=list)


class Manuscript(BaseModel):
	markdown: str


class ResearchOutcome(BaseModel):
	protocol: ResearchProtocol
	papers: List[Paper]
	extractions: Dict[str, Extraction]
	analysis: AnalysisResult
	manuscript: Manuscript


class JobStatus(BaseModel):
	id: str
	status: Literal["pending", "running", "completed", "failed"]
	progress: int = 0
	current_stage: str = ""
	logs: List[str] = Field(default_factory=list)
	error: Optional[str] = None