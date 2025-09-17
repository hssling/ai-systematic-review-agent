from __future__ import annotations

import threading
from typing import Dict, Optional

from .models import JobStatus, ResearchOutcome, ResearchProtocol


class JobManager:
	def __init__(self) -> None:
		self._jobs: Dict[str, JobStatus] = {}
		self._results: Dict[str, ResearchOutcome] = {}
		self._protocols: Dict[str, ResearchProtocol] = {}
		self._lock = threading.Lock()

	def create_job(self, job_id: str, protocol: ResearchProtocol) -> JobStatus:
		with self._lock:
			status = JobStatus(id=job_id, status="pending", progress=0, current_stage="queued", logs=[])
			self._jobs[job_id] = status
			self._protocols[job_id] = protocol
			return status

	def set_running(self, job_id: str, stage: str = "starting") -> None:
		with self._lock:
			job = self._jobs[job_id]
			job.status = "running"
			job.current_stage = stage
			job.logs.append(f"Stage: {stage}")

	def update(self, job_id: str, progress: int, stage: Optional[str] = None, log: Optional[str] = None) -> None:
		with self._lock:
			job = self._jobs[job_id]
			job.progress = max(0, min(100, progress))
			if stage is not None:
				job.current_stage = stage
			if log:
				job.logs.append(log)

	def set_completed(self, job_id: str, outcome: ResearchOutcome) -> None:
		with self._lock:
			job = self._jobs[job_id]
			job.status = "completed"
			job.progress = 100
			job.current_stage = "done"
			self._results[job_id] = outcome
			job.logs.append("Completed successfully.")

	def set_failed(self, job_id: str, error: str) -> None:
		with self._lock:
			job = self._jobs[job_id]
			job.status = "failed"
			job.current_stage = "error"
			job.error = error
			job.logs.append(error)

	def get_status(self, job_id: str) -> JobStatus:
		with self._lock:
			return self._jobs[job_id]

	def get_result(self, job_id: str) -> Optional[ResearchOutcome]:
		with self._lock:
			return self._results.get(job_id)

	def get_protocol(self, job_id: str) -> ResearchProtocol:
		with self._lock:
			return self._protocols[job_id]