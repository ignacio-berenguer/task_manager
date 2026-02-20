"""Router for serving generated chart images."""

import logging
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..config import settings

logger = logging.getLogger("portfolio_agent")

router = APIRouter(prefix="/charts", tags=["Charts"])


def _get_charts_dir() -> Path:
    """Resolve the charts output directory."""
    charts_dir = Path(settings.CHART_OUTPUT_DIR)
    if not charts_dir.is_absolute():
        charts_dir = Path(__file__).parent.parent.parent / charts_dir
    charts_dir.mkdir(parents=True, exist_ok=True)
    return charts_dir


def cleanup_old_charts():
    """Delete chart files older than CHART_MAX_AGE_HOURS."""
    charts_dir = _get_charts_dir()
    max_age_seconds = settings.CHART_MAX_AGE_HOURS * 3600
    now = time.time()
    count = 0
    for f in charts_dir.glob("*.png"):
        try:
            if now - f.stat().st_mtime > max_age_seconds:
                f.unlink()
                count += 1
        except OSError:
            pass
    if count:
        logger.info("Cleaned up %d old chart files", count)


@router.get("/{filename}")
async def get_chart(filename: str):
    """Serve a generated chart image.

    Chart filenames are UUIDs with .png extension.
    """
    # Validate filename format (prevent path traversal)
    if not filename.endswith(".png") or "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    charts_dir = _get_charts_dir()
    file_path = charts_dir / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Chart not found")

    # Trigger cleanup of old files in the background (don't block the response)
    cleanup_old_charts()

    return FileResponse(
        path=str(file_path),
        media_type="image/png",
        content_disposition_type="inline",
    )
