"""Agentic loop — Anthropic API with tool use + SSE streaming."""

import json
import logging
import time
from collections.abc import AsyncGenerator

import anthropic

from .api_client import AgentAPIClient
from .tools_definition import AGENT_TOOLS
from .tools_executor import execute_tool
from .system_prompt import get_system_prompt
from . import config

logger = logging.getLogger("task_manager_agent")


async def stream_agent_response(messages: list[dict]) -> AsyncGenerator[str, None]:
    """Run the agentic loop and yield SSE events.

    Yields SSE-formatted strings:
      event: chunk\ndata: {"content": "..."}\n\n          — streamed text delta
      event: clear_streaming\ndata: {}\n\n              — reasoning done, transitioning to tools
      event: tool_call\ndata: {...}\n\n                  — tool execution details
      event: done\ndata: {"status": "completed"}\n\n    — response complete
      event: error\ndata: {"message": "..."}\n\n        — error occurred
    """
    if not config.ANTHROPIC_API_KEY:
        yield _sse_event("error", {"message": "El asistente IA no está configurado. Falta la clave ANTHROPIC_API_KEY."})
        return

    client = anthropic.AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)
    api_client = AgentAPIClient(base_url=config.AGENT_API_BASE_URL)

    try:
        # Build the messages for the Anthropic API
        api_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                api_messages.append({"role": role, "content": content})

        if not api_messages:
            yield _sse_event("error", {"message": "No se proporcionaron mensajes."})
            return

        # Agentic loop
        for iteration in range(config.AGENT_MAX_TOOL_ROUNDS):
            logger.info("Agent iteration %d/%d", iteration + 1, config.AGENT_MAX_TOOL_ROUNDS)

            # Stream Anthropic API response — text deltas arrive in real time
            streamed_text = ""
            async with client.messages.stream(
                model=config.AGENT_MODEL,
                max_tokens=config.AGENT_MAX_TOKENS,
                temperature=config.AGENT_TEMPERATURE,
                system=get_system_prompt(),
                tools=AGENT_TOOLS,
                messages=api_messages,
            ) as stream:
                async for text in stream.text_stream:
                    streamed_text += text
                    yield _sse_event("chunk", {"content": text})

                response = await stream.get_final_message()

            # Check if the response contains tool use
            tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

            if response.stop_reason == "end_turn" or not tool_use_blocks:
                # Final answer was already streamed token-by-token
                yield _sse_event("done", {"status": "completed"})
                return

            # Tool use — the streamed text was reasoning, not the final answer
            logger.info("Tool use: %s", [b.name for b in tool_use_blocks])

            # Tell frontend to clear the streaming bubble (reasoning transitions to tool panel)
            yield _sse_event("clear_streaming", {})

            thinking_text = streamed_text

            # Append the assistant message (with tool_use blocks) to conversation
            api_messages.append({"role": "assistant", "content": _serialize_content(response.content)})

            # Execute each tool and build tool_result messages
            tool_results = []
            for tool_block in tool_use_blocks:
                logger.info("Executing tool: %s(%s)", tool_block.name, json.dumps(tool_block.input, default=str)[:200])

                t0 = time.monotonic()
                result_str = await execute_tool(tool_block.name, tool_block.input, api_client)
                duration_ms = round((time.monotonic() - t0) * 1000)

                # Notify frontend about the tool call with full details
                yield _sse_event("tool_call", {
                    "tool": tool_block.name,
                    "input_summary": _summarize_tool_input(tool_block.name, tool_block.input),
                    "input_raw": tool_block.input,
                    "thinking": thinking_text,
                    "result_summary": _summarize_tool_result(result_str),
                    "duration_ms": duration_ms,
                    "iteration": iteration + 1,
                })
                thinking_text = ""  # Only send thinking once per iteration

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_block.id,
                    "content": result_str,
                })

            api_messages.append({"role": "user", "content": tool_results})

        # Max iterations reached
        yield _sse_event("chunk", {"content": "Se alcanzó el límite de iteraciones del asistente. Por favor, reformula tu pregunta de forma más específica."})
        yield _sse_event("done", {"status": "max_iterations"})

    except anthropic.APIConnectionError:
        logger.error("Anthropic API connection error")
        yield _sse_event("error", {"message": "No se pudo conectar con el servicio de IA. Inténtalo de nuevo más tarde."})
    except anthropic.RateLimitError:
        logger.error("Anthropic API rate limit")
        yield _sse_event("error", {"message": "Se ha superado el límite de solicitudes al servicio de IA. Espera un momento e inténtalo de nuevo."})
    except anthropic.APIStatusError as e:
        logger.error("Anthropic API error: %s", e)
        yield _sse_event("error", {"message": f"Error del servicio de IA: {e.message}"})
    except Exception as e:
        logger.error("Agent error: %s", e, exc_info=True)
        yield _sse_event("error", {"message": "Error interno del asistente. Consulta los logs del backend."})
    finally:
        await api_client.close()


def _serialize_content(content_blocks) -> list[dict]:
    """Serialize Anthropic content blocks to dicts for the messages array."""
    result = []
    for block in content_blocks:
        if block.type == "text":
            result.append({"type": "text", "text": block.text})
        elif block.type == "tool_use":
            result.append({
                "type": "tool_use",
                "id": block.id,
                "name": block.name,
                "input": block.input,
            })
    return result


def _sse_event(event: str, data: dict) -> str:
    """Format a Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _summarize_tool_input(tool_name: str, tool_input: dict) -> str:
    """Create a human-readable summary of tool input for the frontend."""
    if tool_name == "buscar_tareas":
        parts = []
        if tool_input.get("filtros"):
            filters = [f"{f.get('field')} {f.get('operator')} {f.get('value', '')}" for f in tool_input["filtros"]]
            parts.append(f"filtros: {', '.join(filters)}")
        if tool_input.get("limite"):
            parts.append(f"limite: {tool_input['limite']}")
        return " | ".join(parts) if parts else "sin filtros"

    if tool_name == "obtener_tarea":
        return tool_input.get("tarea_id", "?")

    if tool_name == "buscar_acciones":
        return f"tarea: {tool_input.get('tarea_id', '?')}"

    if tool_name == "listar_estados":
        return f"tipo: {tool_input.get('tipo', '?')}"

    return json.dumps(tool_input, ensure_ascii=False, default=str)[:150] if tool_input else ""


def _summarize_tool_result(result_str: str) -> str:
    """Create a brief human-readable summary of a tool result."""
    try:
        data = json.loads(result_str)
    except (json.JSONDecodeError, TypeError):
        return "resultado recibido"

    if "error" in data:
        return f"Error: {data['error'][:100]}"

    parts = []

    # Search results
    if "total" in data:
        parts.append(f"{data['total']} registros")
    if "data" in data and isinstance(data["data"], list):
        parts.append(f"{len(data['data'])} filas devueltas")

    # Tarea detail
    if "tarea" in data and isinstance(data["tarea"], dict):
        parts.append("tarea encontrada")
    if "acciones_realizadas" in data and isinstance(data["acciones_realizadas"], list):
        parts.append(f"{len(data['acciones_realizadas'])} acciones")

    # Acciones search
    if "acciones" in data and isinstance(data["acciones"], list):
        parts.append(f"{len(data['acciones'])} acciones")

    # Estados list
    if "estados" in data and isinstance(data["estados"], list):
        parts.append(f"{len(data['estados'])} estados")

    return " | ".join(parts) if parts else "resultado recibido"
