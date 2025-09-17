from __future__ import annotations

import asyncio
import re
from typing import Dict, Iterable, List, Optional, Tuple

import httpx
from bs4 import BeautifulSoup
from rapidfuzz import fuzz

from ..models import Paper, ResearchProtocol


USER_AGENT = "DeepResearchAgent/0.1 (+https://example.org)"


def _build_query(include_keywords: List[str], exclude_keywords: List[str]) -> str:
	must = " ".join([f"{k}" for k in include_keywords]) if include_keywords else ""
	excl = " ".join([f"-\"{k}\"" for k in exclude_keywords]) if exclude_keywords else ""
	return (must + " " + excl).strip()


def _score_title(title: str, include_keywords: List[str]) -> float:
	title_lower = title.lower()
	if not include_keywords:
		return 0.0
	score = 0.0
	for kw in include_keywords:
		if kw.lower() in title_lower:
			score += 1.0
	return score / max(1.0, float(len(include_keywords)))


def _normalize_author_list(authors: Iterable[str]) -> List[str]:
	cleaned = []
	for a in authors:
		name = re.sub(r"\s+", " ", a or "").strip()
		if name:
			cleaned.append(name)
	return cleaned[:10]


async def _search_crossref(protocol: ResearchProtocol, client: httpx.AsyncClient) -> List[Paper]:
	params = {
		"query": _build_query(protocol.include_keywords, protocol.exclude_keywords) or protocol.objective,
		"rows": str(min(200, protocol.max_results)),
	}
	filters = []
	if protocol.date_from:
		filters.append(f"from-pub-date:{protocol.date_from}")
	if protocol.date_to:
		filters.append(f"until-pub-date:{protocol.date_to}")
	if filters:
		params["filter"] = ",".join(filters)
	resp = await client.get("https://api.crossref.org/works", params=params, timeout=20)
	resp.raise_for_status()
	items = resp.json().get("message", {}).get("items", [])
	papers: List[Paper] = []
	for it in items:
		doi = it.get("DOI")
		title = (it.get("title") or [""])[0]
		authors = []
		for a in it.get("author", []) or []:
			parts = []
			if a.get("family"):
				parts.append(a["family"])
			if a.get("given"):
				parts.append(a["given"])
			authors.append(", ".join(parts))
		papers.append(
			Paper(
				id=f"crossref:{doi or title[:40]}",
				title=title or "",
				abstract=None,
				authors=_normalize_author_list(authors),
				journal=((it.get("container-title") or [None])[0]) or None,
				year=(it.get("issued", {}).get("date-parts") or [[None]])[0][0],
				doi=doi,
				url=(it.get("URL") or None),
				pdf_url=None,
				source="crossref",
				score=_score_title(title or "", protocol.include_keywords),
			)
		)
	return papers


async def _search_openalex(protocol: ResearchProtocol, client: httpx.AsyncClient) -> List[Paper]:
	params = {
		"search": _build_query(protocol.include_keywords, protocol.exclude_keywords) or protocol.objective,
		"per-page": str(min(200, protocol.max_results)),
	}
	if protocol.date_from:
		params["from_publication_date"] = protocol.date_from
	if protocol.date_to:
		params["to_publication_date"] = protocol.date_to
	resp = await client.get("https://api.openalex.org/works", params=params, timeout=20)
	resp.raise_for_status()
	results = resp.json().get("results", [])
	papers: List[Paper] = []
	for w in results:
		title = w.get("title") or ""
		doi = (w.get("doi") or "").replace("https://doi.org/", "") or None
		url = (w.get("primary_location", {}) or {}).get("landing_page_url")
		authors = [a.get("author", {}).get("display_name", "") for a in w.get("authorships", [])]
		venue = (w.get("primary_location", {}) or {}).get("source", {}).get("display_name")
		year = None
		if w.get("publication_year"):
			year = int(w["publication_year"])  # type: ignore[arg-type]
		papers.append(
			Paper(
				id=f"openalex:{w.get('id')}",
				title=title,
				abstract=None,
				authors=_normalize_author_list(authors),
				journal=venue,
				year=year,
				doi=doi,
				url=url,
				pdf_url=None,
				source="openalex",
				score=_score_title(title, protocol.include_keywords),
			)
		)
	return papers


async def _search_pubmed(protocol: ResearchProtocol, client: httpx.AsyncClient) -> List[Paper]:
	term = _build_query(protocol.include_keywords, protocol.exclude_keywords) or protocol.objective
	params = {
		"db": "pubmed",
		"retmode": "json",
		"retmax": str(min(200, protocol.max_results)),
		"term": term,
	}
	resp = await client.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", params=params, timeout=20)
	resp.raise_for_status()
	ids = (resp.json().get("esearchresult", {}) or {}).get("idlist", [])
	if not ids:
		return []
	# Fetch summaries
	summary = await client.get(
		"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
		params={"db": "pubmed", "retmode": "json", "id": ",".join(ids)},
		timeout=30,
	)
	summary.raise_for_status()
	result = (summary.json().get("result") or {})
	papers: List[Paper] = []
	for pmid in ids:
		it = result.get(pmid) or {}
		title = it.get("title") or ""
		authors = [a.get("name", "") for a in it.get("authors", []) or []]
		journal = it.get("fulljournalname") or it.get("source")
		year = None
		try:
			year = int((it.get("pubdate") or "").split(" ")[0])
		except Exception:
			pass
		url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
		papers.append(
			Paper(
				id=f"pubmed:{pmid}",
				title=title,
				abstract=None,
				authors=_normalize_author_list(authors),
				journal=journal,
				year=year,
				doi=None,
				url=url,
				pdf_url=None,
				source="pubmed",
				score=_score_title(title, protocol.include_keywords),
			)
		)
	return papers


async def _search_arxiv(protocol: ResearchProtocol, client: httpx.AsyncClient) -> List[Paper]:
	q = _build_query(protocol.include_keywords, protocol.exclude_keywords) or protocol.objective
	params = {
		"search_query": f"all:{q}",
		"max_results": str(min(200, protocol.max_results)),
	}
	resp = await client.get("http://export.arxiv.org/api/query", params=params, timeout=20)
	resp.raise_for_status()
	soup = BeautifulSoup(resp.text, "xml")
	papers: List[Paper] = []
	for entry in soup.find_all("entry"):
		title = (entry.find("title").text or "").strip()
		authors = [a.text for a in entry.find_all("name")]
		url = (entry.find("id").text if entry.find("id") else None)
		year = None
		if entry.find("published") and entry.find("published").text:
			year = int(entry.find("published").text[:4])
		pdf_url = None
		for link in entry.find_all("link"):
			if link.get("title") == "pdf" or link.get("type") == "application/pdf":
				pdf_url = link.get("href")
				break
		papers.append(
			Paper(
				id=f"arxiv:{url}",
				title=title,
				abstract=None,
				authors=_normalize_author_list(authors),
				journal="arXiv",
				year=year,
				doi=None,
				url=url,
				pdf_url=pdf_url,
				source="arxiv",
				score=_score_title(title, protocol.include_keywords),
			)
		)
	return papers


def _dedupe_and_rank(papers: List[Paper]) -> List[Paper]:
	seen_doi: Dict[str, Paper] = {}
	unique: List[Paper] = []
	for p in papers:
		if p.doi and p.doi not in seen_doi:
			seen_doi[p.doi] = p
			unique.append(p)
			continue
		# fuzzy dedupe by title
		is_dup = False
		for q in unique:
			if fuzz.token_sort_ratio(p.title, q.title) >= 95:
				is_dup = True
				break
		if not is_dup:
			unique.append(p)
	# simple rank by score then year desc
	unique.sort(key=lambda x: (-(x.score or 0.0), -(x.year or 0)))
	return unique


async def search_all_sources(protocol: ResearchProtocol) -> List[Paper]:
	headers = {"User-Agent": USER_AGENT}
	async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
		tasks: List[asyncio.Task[List[Paper]]] = []
		for s in protocol.sources:
			if s == "crossref":
				tasks.append(asyncio.create_task(_search_crossref(protocol, client)))
			elif s == "openalex":
				tasks.append(asyncio.create_task(_search_openalex(protocol, client)))
			elif s == "pubmed":
				tasks.append(asyncio.create_task(_search_pubmed(protocol, client)))
			elif s == "arxiv":
				tasks.append(asyncio.create_task(_search_arxiv(protocol, client)))
			else:
				continue
			# Bound concurrency implicitly by number of sources
		results = await asyncio.gather(*tasks, return_exceptions=True)
		papers: List[Paper] = []
		for r in results:
			if isinstance(r, Exception):
				continue
			papers.extend(r)
		return _dedupe_and_rank(papers)[: protocol.max_results]