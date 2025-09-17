from __future__ import annotations

from collections import Counter
from typing import Iterable, List, Tuple

from rapidfuzz import fuzz

from ..models import AnalysisResult, Extraction, Paper


def summarize_overview(objective: str, papers: List[Paper]) -> str:
	if not papers:
		return f"No papers found for objective: {objective}."
	titles = "; ".join([p.title for p in papers[:5]])
	return f"We identified {len(papers)} relevant papers related to '{objective}'. Representative titles include: {titles}."


def extract_keyphrases(texts: Iterable[str], top_k: int = 8) -> List[str]:
	counter: Counter[str] = Counter()
	for t in texts:
		for token in t.lower().replace("\n", " ").split():
			tok = ''.join([c for c in token if c.isalnum() or c in ['-']])
			if len(tok) >= 4:
				counter[tok] += 1
	phrases = [w for w, _ in counter.most_common(top_k * 2)]
	# de-duplicate by fuzzy similarity
	unique: List[str] = []
	for p in phrases:
		if all(fuzz.token_set_ratio(p, q) < 90 for q in unique):
			unique.append(p)
		if len(unique) >= top_k:
			break
	return unique


def analyze(papers: List[Paper], extractions: List[Extraction], objective: str) -> AnalysisResult:
	texts = [e.key_findings for e in extractions if e.key_findings]
	themes = extract_keyphrases(texts, top_k=6)
	limitations = ["Heterogeneity in study designs", "Potential publication bias"]
	gaps = ["Limited replication studies", "Sparse longitudinal evidence"]
	recommendations = ["Adopt standardized reporting", "Use larger, diverse cohorts"]
	return AnalysisResult(
		overview_summary=summarize_overview(objective, papers),
		themes=themes,
		limitations=limitations,
		gaps=gaps,
		recommendations=recommendations,
	)