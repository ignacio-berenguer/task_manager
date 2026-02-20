"""Async HTTP client for the FastAPI backend.

Adapted from mcp_server/src/mcp_portfolio/api_client.py using httpx.AsyncClient.
"""

import json
import logging

import httpx

from .table_metadata import get_url_prefix

logger = logging.getLogger("portfolio_agent")


class APIError(Exception):
    """Raised when the API returns an error."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AgentAPIClient:
    """Async HTTP client for the Portfolio Digital FastAPI backend."""

    def __init__(self, base_url: str, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.client = httpx.AsyncClient(
            base_url=self.base_url, timeout=timeout, follow_redirects=True
        )

    def _handle_response(self, response: httpx.Response) -> dict | list:
        """Handle API response, raising friendly errors."""
        if response.status_code == 200:
            return response.json()

        if response.status_code == 404:
            raise APIError("No se encontraron datos.", status_code=404)

        if response.status_code == 422:
            try:
                detail = response.json().get("detail", response.text)
            except Exception:
                detail = response.text
            raise APIError(
                f"Error en los parámetros de búsqueda: {detail}",
                status_code=422,
            )

        raise APIError(
            f"Error del servidor API (HTTP {response.status_code}). "
            f"Consulta los logs del backend.",
            status_code=response.status_code,
        )

    async def search(
        self,
        table: str,
        filters: list[dict] | None = None,
        order_by: str | None = None,
        order_dir: str = "asc",
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """POST /{table}/search with flexible filters."""
        prefix = get_url_prefix(table)
        body: dict = {"filters": filters or [], "limit": limit, "offset": offset}
        if order_by:
            body["order_by"] = order_by
            body["order_dir"] = order_dir

        logger.debug("POST /%s/search body=%s", prefix, json.dumps(body, default=str))
        response = await self.client.post(f"/{prefix}/search", json=body)
        return self._handle_response(response)

    async def list_records(self, table: str, limit: int = 50, offset: int = 0) -> dict:
        """GET /{table}?limit=N&offset=N for CRUD-only tables."""
        prefix = get_url_prefix(table)
        logger.debug("GET /%s?limit=%d&offset=%d", prefix, limit, offset)
        response = await self.client.get(
            f"/{prefix}", params={"limit": limit, "offset": offset}
        )
        return self._handle_response(response)

    async def get_portfolio(self, portfolio_id: str) -> dict:
        """GET /portfolio/{portfolio_id} — all data across all tables."""
        logger.debug("GET /portfolio/%s", portfolio_id)
        response = await self.client.get(f"/portfolio/{portfolio_id}")
        return self._handle_response(response)

    async def get_portfolio_records(self, table: str, portfolio_id: str) -> list:
        """GET /{table}/portfolio/{portfolio_id}."""
        prefix = get_url_prefix(table)
        logger.debug("GET /%s/portfolio/%s", prefix, portfolio_id)
        response = await self.client.get(f"/{prefix}/portfolio/{portfolio_id}")
        return self._handle_response(response)

    async def execute_sql(self, sql: str, max_rows: int = 500) -> dict:
        """POST /sql/execute — execute a read-only SQL query."""
        logger.debug("POST /sql/execute sql=%s", sql[:100])
        response = await self.client.post("/sql/execute", json={"sql": sql, "max_rows": max_rows})
        return self._handle_response(response)

    async def close(self):
        """Close the underlying HTTP client."""
        await self.client.aclose()
