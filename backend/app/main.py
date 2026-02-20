"""FastAPI application entry point for Task Manager."""

import logging
import sys
import time
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .routers import tareas, acciones, estados, agent

# Setup logging
_backend_dir = Path(__file__).parent.parent
_project_root = _backend_dir.parent
_logs_dir = _project_root / "logs"
_logs_dir.mkdir(exist_ok=True)

if sys.platform == "win32" and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT,
    handlers=[
        logging.FileHandler(_logs_dir / settings.LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)

# Disable Uvicorn's default access log
logging.getLogger("uvicorn.access").disabled = True

# Silence verbose third-party loggers
for _noisy_logger in ("httpcore", "anthropic", "httpx", "hpack"):
    logging.getLogger(_noisy_logger).setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API requests."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000

        path = request.url.path
        if path not in ["/health", "/", f"{settings.API_PREFIX}/docs", f"{settings.API_PREFIX}/redoc", f"{settings.API_PREFIX}/openapi.json"]:
            logger.info(
                f"{request.method} {path} - "
                f"Status: {response.status_code} - "
                f"Duration: {duration_ms:.1f}ms"
            )

        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info(f"Starting {settings.API_TITLE} v{settings.API_VERSION}")
    yield
    logger.info("Shutting down API")


# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    lifespan=lifespan,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# Request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Include routers
app.include_router(tareas.router, prefix=settings.API_PREFIX)
app.include_router(acciones.router, prefix=settings.API_PREFIX)
app.include_router(estados.router_tareas, prefix=settings.API_PREFIX)
app.include_router(estados.router_acciones, prefix=settings.API_PREFIX)
app.include_router(agent.router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Task Manager API",
        "version": settings.API_VERSION,
        "docs": f"{settings.API_PREFIX}/docs",
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}
