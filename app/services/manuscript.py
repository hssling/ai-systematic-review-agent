from __future__ import annotations

from typing import List

from ..models import AnalysisResult, Manuscript, Paper, ResearchProtocol


def _format_reference(idx: int, p: Paper) -> str:
	authors = ", ".join(p.authors) if p.authors else "Unknown"
	year = f"{p.year}" if p.year else "n.d."
	doi = f" https://doi.org/{p.doi}" if p.doi else (f" {p.url}" if p.url else "")
	return f"{idx}. {authors} ({year}). {p.title}. {p.journal or p.source.capitalize()}.{doi}"


def build_manuscript(protocol: ResearchProtocol, papers: List[Paper], analysis: AnalysisResult) -> Manuscript:
	lines: List[str] = []
	lines.append(f"# {protocol.objective}")
	lines.append("")
	lines.append("## Abstract")
	lines.append(analysis.overview_summary)
	lines.append("")
	lines.append("## Introduction")
	lines.append("We present a structured synthesis of the scientific literature addressing the stated objective and research questions.")
	lines.append("")
	lines.append("## Methods")
	lines.append("We queried Crossref, OpenAlex, PubMed, and arXiv using inclusion and exclusion keywords, constrained by date filters when provided. Results were deduplicated and ranked.")
	lines.append("")
	lines.append("## Results")
	lines.append("Key themes: " + ", ".join(analysis.themes))
	lines.append("")
	lines.append("## Discussion")
	lines.append("Limitations include: " + ", ".join(analysis.limitations))
	lines.append("Research gaps: " + ", ".join(analysis.gaps))
	lines.append("Recommendations: " + ", ".join(analysis.recommendations))
	lines.append("")
	lines.append("## References")
	for i, p in enumerate(papers, start=1):
		lines.append(_format_reference(i, p))
	return Manuscript(markdown="\n".join(lines))