from __future__ import annotations

import io
from typing import Optional

import httpx
from pypdf import PdfReader


async def download_pdf(url: str, timeout: int = 30) -> Optional[bytes]:
	try:
		async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
			resp = await client.get(url)
			resp.raise_for_status()
			content_type = resp.headers.get("content-type", "")
			if "pdf" not in content_type and not url.lower().endswith(".pdf"):
				return None
			return resp.content
	except Exception:
		return None


def extract_text_from_pdf(data: bytes, max_pages: int = 20) -> str:
	try:
		reader = PdfReader(io.BytesIO(data))
		texts = []
		for i, page in enumerate(reader.pages):
			if i >= max_pages:
				break
			try:
				texts.append(page.extract_text() or "")
			except Exception:
				continue
		return "\n".join(texts)
	except Exception:
		return ""