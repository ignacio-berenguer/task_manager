"""Ayuda endpoint — serves project README as markdown."""

import logging
from fastapi import APIRouter, Depends, HTTPException
from app.auth import verify_auth
from app.config import PROJECT_ROOT

LOG = logging.getLogger("task_manager_backend")

router = APIRouter(
    prefix="/ayuda",
    tags=["ayuda"],
    dependencies=[Depends(verify_auth)],
)


@router.get("/readme")
def get_readme():
    """Return the project README.md content as JSON."""
    readme_path = PROJECT_ROOT / "README.md"
    if not readme_path.exists():
        raise HTTPException(status_code=404, detail="README.md not found")
    content = readme_path.read_text(encoding="utf-8")
    return {"content": content}
