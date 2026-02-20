"""
FastAPI application entry point.
"""
import logging
import time
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .routers import (
    iniciativas,
    datos_relevantes,
    hechos,
    datos_descriptivos,
    etiquetas,
    fichas,
    informacion_economica,
    acciones,
    beneficios,
    facturacion,
    grupos_iniciativas,
    justificaciones,
    ltp,
    wbes,
    dependencias,
    notas,
    avance,
    descripciones,
    estado_especial,
    investment_memos,
    impacto_aatt,
    datos_ejecucion,
    documentos,
    documentos_items,
    transacciones,
    transacciones_json,
    migracion_metadata,
    portfolio,
    parametros,
    etiquetas_destacadas,
    trabajos,
    stats,
    agent,
    charts,
    sql,
)

# Setup logging
_backend_dir = Path(__file__).parent.parent
_project_root = _backend_dir.parent
_logs_dir = _project_root / "logs"
_logs_dir.mkdir(exist_ok=True)

import sys
if sys.platform == 'win32' and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT,
    handlers=[
        logging.FileHandler(_logs_dir / settings.LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(),
    ]
)

# Disable Uvicorn's default access log to avoid duplicate request lines
# with a different format. Our RequestLoggingMiddleware handles access logging
# with richer information (duration, filtered paths).
logging.getLogger("uvicorn.access").disabled = True

# Silence verbose third-party loggers (httpcore, anthropic, httpx emit DEBUG noise)
for _noisy_logger in ("httpcore", "anthropic", "httpx", "hpack"):
    logging.getLogger(_noisy_logger).setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API requests."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Process the request
        response = await call_next(request)

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Skip logging for health checks and docs
        path = request.url.path
        if path not in ["/health", "/", "/api/v1/docs", "/api/v1/redoc", "/api/v1/openapi.json"]:
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
    redoc_url=f"{settings.API_PREFIX}/redoc"
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

# Include routers - Tables with flexible search
app.include_router(iniciativas.router, prefix=settings.API_PREFIX)
app.include_router(datos_relevantes.router, prefix=settings.API_PREFIX)
app.include_router(hechos.router, prefix=settings.API_PREFIX)
app.include_router(datos_descriptivos.router, prefix=settings.API_PREFIX)
app.include_router(etiquetas.router, prefix=settings.API_PREFIX)
app.include_router(fichas.router, prefix=settings.API_PREFIX)
app.include_router(informacion_economica.router, prefix=settings.API_PREFIX)
app.include_router(acciones.router, prefix=settings.API_PREFIX)

# Include routers - Standard CRUD tables
app.include_router(beneficios.router, prefix=settings.API_PREFIX)
app.include_router(facturacion.router, prefix=settings.API_PREFIX)
app.include_router(grupos_iniciativas.router, prefix=settings.API_PREFIX)
app.include_router(justificaciones.router, prefix=settings.API_PREFIX)
app.include_router(ltp.router, prefix=settings.API_PREFIX)
app.include_router(wbes.router, prefix=settings.API_PREFIX)
app.include_router(dependencias.router, prefix=settings.API_PREFIX)
app.include_router(notas.router, prefix=settings.API_PREFIX)
app.include_router(avance.router, prefix=settings.API_PREFIX)
app.include_router(descripciones.router, prefix=settings.API_PREFIX)
app.include_router(estado_especial.router, prefix=settings.API_PREFIX)
app.include_router(investment_memos.router, prefix=settings.API_PREFIX)
app.include_router(impacto_aatt.router, prefix=settings.API_PREFIX)
app.include_router(datos_ejecucion.router, prefix=settings.API_PREFIX)
app.include_router(documentos.router, prefix=settings.API_PREFIX)
app.include_router(documentos_items.router, prefix=settings.API_PREFIX)

# Include routers - Read-only tables
app.include_router(transacciones.router, prefix=settings.API_PREFIX)
app.include_router(transacciones_json.router, prefix=settings.API_PREFIX)
app.include_router(migracion_metadata.router, prefix=settings.API_PREFIX)

# Include routers - Parametric tables
app.include_router(parametros.router, prefix=settings.API_PREFIX)
app.include_router(etiquetas_destacadas.router, prefix=settings.API_PREFIX)

# Include router - Cross-table portfolio search
app.include_router(portfolio.router, prefix=settings.API_PREFIX)

# Include router - Trabajos (management CLI operations)
app.include_router(trabajos.router, prefix=settings.API_PREFIX)

# Include router - Stats (aggregated overview)
app.include_router(stats.router, prefix=settings.API_PREFIX)

# Include router - Agent (AI chat assistant)
app.include_router(agent.router, prefix=settings.API_PREFIX)

# Include router - Charts (generated chart images)
app.include_router(charts.router, prefix=settings.API_PREFIX)

# Include router - SQL Query (read-only SQL execution)
app.include_router(sql.router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Portfolio Digital API",
        "version": settings.API_VERSION,
        "docs": f"{settings.API_PREFIX}/docs"
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}
