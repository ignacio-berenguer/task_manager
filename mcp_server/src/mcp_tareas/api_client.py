"""HTTP client for Task Manager backend API."""

import logging
import httpx
from .config import settings

LOG = logging.getLogger("task_manager_mcp")


class APIError(Exception):
    def __init__(self, message: str, status_code: int = 0):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class TaskAPIClient:
    """Synchronous HTTP client for Task Manager API."""

    def __init__(self, base_url: str = None):
        self.base_url = (base_url or settings.API_BASE_URL).rstrip("/")
        self.client = httpx.Client(base_url=self.base_url, timeout=settings.API_TIMEOUT)

    def search(self, table: str, body: dict) -> dict:
        """POST /{table}/search."""
        response = self.client.post(f"/{table}/search", json=body)
        return self._handle(response)

    def get_record(self, table: str, record_id: str) -> dict:
        """GET /{table}/{id}."""
        response = self.client.get(f"/{table}/{record_id}")
        return self._handle(response)

    def list_records(self, path: str, limit: int = 500, offset: int = 0) -> list | dict:
        """GET /{path}."""
        response = self.client.get(f"/{path}", params={"limit": limit, "offset": offset})
        return self._handle(response)

    def health_check(self) -> bool:
        """Check API availability."""
        try:
            response = self.client.get("/health")
            return response.status_code == 200
        except Exception:
            return False

    def _handle(self, response: httpx.Response):
        if response.status_code >= 400:
            detail = ""
            try:
                detail = response.json().get("detail", response.text)
            except Exception:
                detail = response.text
            raise APIError(f"HTTP {response.status_code}: {detail}", response.status_code)
        return response.json()

    def close(self):
        self.client.close()
