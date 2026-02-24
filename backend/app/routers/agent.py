"""Agent chat endpoint — SSE streaming."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..agent.orchestrator import stream_agent_response
from ..auth import verify_auth
from ..config import settings

logger = logging.getLogger("task_manager_agent")

router = APIRouter(prefix="/agent", tags=["agent"], dependencies=[Depends(verify_auth)])


class AgentChatRequest(BaseModel):
    messages: list[dict]
    user_email: str | None = None


@router.post("/chat")
async def agent_chat(request: AgentChatRequest):
    """Chat with the AI agent. Returns Server-Sent Events."""
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="El asistente IA no está configurado. Falta la clave ANTHROPIC_API_KEY.",
        )

    if not request.messages:
        raise HTTPException(status_code=400, detail="Se requiere al menos un mensaje.")

    if request.user_email:
        logger.info("Agent chat request from user: %s", request.user_email)

    return StreamingResponse(
        stream_agent_response(request.messages, user_email=request.user_email),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
