"""Async HTTP client for Task Manager backend API."""

import logging
import httpx
from .config import AGENT_API_BASE_URL
from ..config import settings as app_settings

LOG = logging.getLogger("task_manager_agent")


class APIError(Exception):
    """API communication error."""
    def __init__(self, message: str, status_code: int = 0):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AgentAPIClient:
    """Async HTTP client for the Task Manager API."""

    def __init__(self, base_url: str = None):
        self.base_url = (base_url or AGENT_API_BASE_URL).rstrip("/")
        headers = {}
        if app_settings.API_KEY:
            headers["X-API-Key"] = app_settings.API_KEY
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0, headers=headers)

    async def search(self, table: str, body: dict) -> dict:
        """POST /{table}/search with flexible filters."""
        response = await self.client.post(f"/{table}/search", json=body)
        return self._handle_response(response)

    async def get_record(self, table: str, record_id: str) -> dict:
        """GET /{table}/{id}."""
        response = await self.client.get(f"/{table}/{record_id}")
        return self._handle_response(response)

    async def list_records(self, path: str, limit: int = 500, offset: int = 0) -> list | dict:
        """GET /{path}?limit=N&offset=N or GET /{path} (no params)."""
        response = await self.client.get(f"/{path}", params={"limit": limit, "offset": offset})
        return self._handle_response(response)

    def _handle_response(self, response: httpx.Response):
        """Handle API response, raise on error."""
        if response.status_code >= 400:
            detail = ""
            try:
                detail = response.json().get("detail", response.text)
            except Exception:
                detail = response.text
            raise APIError(f"HTTP {response.status_code}: {detail}", response.status_code)
        return response.json()

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
