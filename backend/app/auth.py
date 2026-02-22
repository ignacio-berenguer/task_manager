"""Authentication module for Clerk JWT and API key verification."""

import hmac
import logging

import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, Request

from .config import settings

LOG = logging.getLogger("task_manager_backend")

# Lazy-initialized JWKS client (only created when CLERK_JWKS_URL is configured)
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient | None:
    """Get or create the JWKS client singleton."""
    global _jwks_client
    if _jwks_client is None and settings.CLERK_JWKS_URL:
        _jwks_client = PyJWKClient(
            settings.CLERK_JWKS_URL,
            cache_keys=True,
            lifespan=3600,
        )
        LOG.info("JWKS client initialized for %s", settings.CLERK_JWKS_URL)
    return _jwks_client


def _verify_jwt(token: str) -> dict:
    """Decode and verify a Clerk JWT token.

    Returns the decoded claims on success.
    Raises HTTPException on failure.
    """
    client = _get_jwks_client()
    if client is None:
        raise HTTPException(
            status_code=401,
            detail="JWT authentication is not configured",
        )

    try:
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
            },
            leeway=5,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    # Validate authorized party (azp claim)
    azp = payload.get("azp")
    if azp and settings.CLERK_AUTHORIZED_PARTIES and azp not in settings.CLERK_AUTHORIZED_PARTIES:
        LOG.warning("JWT rejected: unauthorized origin '%s'", azp)
        raise HTTPException(status_code=403, detail="Unauthorized origin")

    return payload


async def verify_auth(request: Request) -> dict:
    """FastAPI dependency that verifies authentication.

    Supports two mechanisms:
    1. Clerk JWT via Authorization: Bearer <token>
    2. API key via X-API-Key header

    Returns auth info dict on success, raises HTTPException(401) on failure.
    """
    # 1. Try JWT authentication
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        claims = _verify_jwt(token)
        user_id = claims.get("sub", "unknown")
        LOG.info("JWT auth successful for user %s", user_id)
        LOG.debug("JWT claims: %s", {k: v for k, v in claims.items() if k != "raw"})
        return {"type": "jwt", "user_id": user_id, "claims": claims}

    # 2. Try API key authentication
    api_key = request.headers.get("x-api-key", "")
    if api_key:
        if settings.API_KEY and hmac.compare_digest(api_key, settings.API_KEY):
            LOG.info("API key auth successful")
            return {"type": "api_key"}
        LOG.warning("Invalid API key from %s", request.client.host if request.client else "unknown")
        raise HTTPException(status_code=401, detail="Invalid API key")

    # 3. No credentials provided
    raise HTTPException(status_code=401, detail="Authentication required")
