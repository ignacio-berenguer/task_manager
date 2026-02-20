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

logger = logging.getLogger("portfolio_agent")


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
    if tool_name == "buscar_iniciativas":
        parts = []
        if tool_input.get("filtros"):
            filters = [f"{f.get('field')} {f.get('operator')} {f.get('value', '')}" for f in tool_input["filtros"]]
            parts.append(f"filtros: {', '.join(filters)}")
        if tool_input.get("limite"):
            parts.append(f"límite: {tool_input['limite']}")
        return " | ".join(parts) if parts else "sin filtros"

    if tool_name == "buscar_en_tabla":
        tabla = tool_input.get("tabla", "?")
        parts = [f"tabla: {tabla}"]
        if tool_input.get("filtros"):
            filters = [f"{f.get('field')} {f.get('operator')} {f.get('value', '')}" for f in tool_input["filtros"]]
            parts.append(f"filtros: {', '.join(filters)}")
        return " | ".join(parts)

    if tool_name == "obtener_iniciativa":
        return tool_input.get("portfolio_id", "?")

    if tool_name == "obtener_documentos":
        parts = []
        if tool_input.get("portfolio_id"):
            parts.append(tool_input["portfolio_id"])
        if tool_input.get("texto_busqueda"):
            parts.append(f'"{tool_input["texto_busqueda"]}"')
        return ", ".join(parts) if parts else "todos"

    if tool_name == "contar_iniciativas":
        parts = [f"agrupar por: {tool_input.get('campo_agrupacion', '?')}"]
        if tool_input.get("filtros"):
            filters = [f"{f.get('field')} {f.get('operator')} {f.get('value', '')}" for f in tool_input["filtros"]]
            parts.append(f"filtros: {', '.join(filters)}")
        return " | ".join(parts)

    if tool_name == "totalizar_importes":
        parts = [f"sumar: {tool_input.get('campo_importe', '?')}"]
        if tool_input.get("campo_agrupacion"):
            parts.append(f"por: {tool_input['campo_agrupacion']}")
        return " | ".join(parts)

    if tool_name == "describir_tabla":
        return tool_input.get("tabla", "?")

    if tool_name == "obtener_valores_campo":
        return f"{tool_input.get('tabla', '?')}.{tool_input.get('campo', '?')}"

    if tool_name == "generar_grafico":
        parts = [f"tipo: {tool_input.get('tipo_grafico', '?')}"]
        if tool_input.get("titulo"):
            parts.append(f'"{tool_input["titulo"]}"')
        return " | ".join(parts)

    if tool_name == "ejecutar_consulta_sql":
        sql = tool_input.get("consulta_sql", "")
        # Show first 120 chars of SQL
        sql_preview = sql[:120] + ("..." if len(sql) > 120 else "")
        return f"SQL: {sql_preview}"

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

    # Count/total summaries
    if "total" in data:
        parts.append(f"{data['total']} registros")
    if "total_iniciativas" in data:
        parts.append(f"{data['total_iniciativas']} iniciativas")
    if "total_general" in data:
        parts.append(f"total: {data['total_general']:,.2f}")
    if "grupos" in data:
        parts.append(f"{len(data['grupos'])} grupos")
    if "datos" in data and isinstance(data["datos"], list):
        parts.append(f"{len(data['datos'])} filas devueltas")
    if "documentos" in data and isinstance(data["documentos"], list):
        parts.append(f"{len(data['documentos'])} documentos")
    if "tablas" in data and isinstance(data["tablas"], dict):
        parts.append(f"{len(data['tablas'])} tablas con datos")
    if "campos" in data and isinstance(data["campos"], list):
        parts.append(f"{len(data['campos'])} campos")
    if "valores" in data and isinstance(data["valores"], list):
        parts.append(f"{len(data['valores'])} valores distintos")
    if "total_distintos" in data:
        parts.append(f"total distintos: {data['total_distintos']}")
    if "imagen_url" in data:
        parts.append("gráfico generado")

    # SQL query tool
    if "sql_ejecutado" in data:
        parts.append(f"{data.get('total_filas', 0)} filas")
        if data.get("columnas"):
            parts.append(f"{len(data['columnas'])} columnas")
        if data.get("tiempo_ejecucion_ms"):
            parts.append(f"{data['tiempo_ejecucion_ms']} ms")
        if data.get("truncado"):
            parts.append("truncado")

    # For listar_tablas (returns a list directly)
    if isinstance(data, list):
        parts.append(f"{len(data)} tablas")

    return " | ".join(parts) if parts else "resultado recibido"
