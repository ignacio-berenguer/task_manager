"""
Router for Trabajos — execute management CLI commands with SSE streaming output.

Uses subprocess.Popen with threads (not asyncio.create_subprocess_exec) because
the default Windows event loop does not support async subprocesses.
"""
import asyncio
import json
import logging
import os
import subprocess
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trabajos", tags=["Trabajos"])

# Singleton guard — only one job at a time
_current_job = {
    "running": False,
    "command": None,
    "start_time": None,
    "pid": None,
}

# Valid commands and their CLI arguments
_COMMANDS = {
    "proceso-completo": "complete_process",
    "escanear-documentos": "scan_documents",
    "sumarizar-documentos": "summarize_documentos",
}


def _sse_event(event_type: str, data: dict) -> str:
    """Format a server-sent event."""
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


def _read_stream_thread(stream, stream_name: str, queue: asyncio.Queue, loop):
    """Read lines from a subprocess stream in a thread, push to async queue."""
    try:
        for line in stream:
            text = line.rstrip("\n").rstrip("\r")
            if text:
                loop.call_soon_threadsafe(queue.put_nowait, (stream_name, text))
    except ValueError:
        pass  # stream closed
    loop.call_soon_threadsafe(queue.put_nowait, (stream_name, None))


async def _stream_subprocess(command_name: str):
    """
    Async generator that runs a management CLI command and yields SSE events.
    Uses subprocess.Popen + threads for Windows compatibility.
    """
    global _current_job

    cli_command = _COMMANDS[command_name]

    # Resolve management directory
    backend_dir = Path(__file__).parent.parent.parent
    management_dir = (backend_dir / settings.MANAGEMENT_DIR).resolve()

    if not management_dir.exists():
        logger.error(f"Management directory not found: {management_dir}")
        yield _sse_event("status", {
            "status": "failed",
            "error": f"Management directory not found: {management_dir}",
        })
        return

    manage_py = management_dir / "manage.py"
    if not manage_py.exists():
        logger.error(f"manage.py not found in {management_dir}")
        yield _sse_event("status", {
            "status": "failed",
            "error": f"manage.py not found in {management_dir}",
        })
        return

    start_time = time.time()
    logger.info(f"Trabajo started: {command_name} (cli: {cli_command})")

    # Send running status
    yield _sse_event("status", {
        "status": "running",
        "command": command_name,
    })

    try:
        # Clear VIRTUAL_ENV so uv uses the management directory's own venv
        # instead of inheriting the backend's venv path.
        child_env = {k: v for k, v in os.environ.items() if k != "VIRTUAL_ENV"}

        process = subprocess.Popen(
            [settings.UV_EXECUTABLE, "run", "python", "manage.py", cli_command],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(management_dir),
            env=child_env,
            text=True,
            bufsize=1,
        )

        _current_job.update({
            "running": True,
            "command": command_name,
            "start_time": datetime.now(timezone.utc).isoformat(),
            "pid": process.pid,
        })

        # Read stdout and stderr in background threads, bridge to async queue
        loop = asyncio.get_running_loop()
        queue = asyncio.Queue()

        stdout_thread = threading.Thread(
            target=_read_stream_thread,
            args=(process.stdout, "stdout", queue, loop),
            daemon=True,
        )
        stderr_thread = threading.Thread(
            target=_read_stream_thread,
            args=(process.stderr, "stderr", queue, loop),
            daemon=True,
        )
        stdout_thread.start()
        stderr_thread.start()

        streams_done = 0
        while streams_done < 2:
            stream_name, text = await queue.get()
            if text is None:
                streams_done += 1
                continue

            event_type = "output" if stream_name == "stdout" else "error"
            yield _sse_event(event_type, {
                "line": text,
                "stream": stream_name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

        stdout_thread.join(timeout=5)
        stderr_thread.join(timeout=5)
        exit_code = process.wait()
        duration = round(time.time() - start_time, 1)

        status = "completed" if exit_code == 0 else "failed"
        logger.info(
            f"Trabajo finished: {command_name} — {status} "
            f"(exit_code={exit_code}, duration={duration}s)"
        )

        yield _sse_event("status", {
            "status": status,
            "exit_code": exit_code,
            "duration_seconds": duration,
        })

    except FileNotFoundError:
        logger.error(
            f"Executable not found: {settings.UV_EXECUTABLE}. "
            "Ensure uv is installed and in PATH."
        )
        yield _sse_event("status", {
            "status": "failed",
            "error": f"Executable not found: {settings.UV_EXECUTABLE}",
        })
    except Exception as e:
        logger.exception(f"Unexpected error running trabajo {command_name}: {e}")
        yield _sse_event("status", {
            "status": "failed",
            "error": str(e),
        })
    finally:
        _current_job.update({
            "running": False,
            "command": None,
            "start_time": None,
            "pid": None,
        })


def _run_job(command_name: str):
    """Validate singleton guard and return a StreamingResponse."""
    if _current_job["running"]:
        raise HTTPException(
            status_code=409,
            detail=f"A job is already running: {_current_job['command']} "
                   f"(started {_current_job['start_time']})",
        )

    return StreamingResponse(
        _stream_subprocess(command_name),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# --- Static routes (must be before any dynamic path params) ---


@router.get("/status")
def get_status():
    """Get current job status."""
    return _current_job


@router.post("/proceso-completo")
def run_proceso_completo():
    """Run the complete management process pipeline."""
    return _run_job("proceso-completo")


@router.post("/escanear-documentos")
def run_escanear_documentos():
    """Run the document scanning process."""
    return _run_job("escanear-documentos")


@router.post("/sumarizar-documentos")
def run_sumarizar_documentos():
    """Run the document summarization process."""
    return _run_job("sumarizar-documentos")
