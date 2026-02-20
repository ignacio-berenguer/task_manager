"""Agent chat endpoint — SSE streaming."""

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..agent.orchestrator import stream_agent_response
from ..config import settings

logger = logging.getLogger("portfolio_agent")

router = APIRouter(prefix="/agent", tags=["agent"])


class AgentChatRequest(BaseModel):
    messages: list[dict]


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

    return StreamingResponse(
        stream_agent_response(request.messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
