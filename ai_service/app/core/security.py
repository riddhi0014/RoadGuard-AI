"""
app/core/security.py

The AI service's own auth mechanism, separate from the Node backend's
JWT/RBAC system entirely. This service isn't a citizen/officer/contractor/
admin — it's a second backend process. Any endpoint that should only be
callable by your trusted Node backend (not the public internet) should
depend on require_service_auth.

Usage in a router:
    from app.core.security import require_service_auth

    @router.post("/some-endpoint", dependencies=[Depends(require_service_auth)])
    def some_endpoint(...):
        ...
"""

from fastapi import Header, HTTPException, status

from app.config import settings


def require_service_auth(x_internal_secret: str = Header(...)) -> None:
    """
    FastAPI dependency that checks the X-Internal-Secret header against
    the AI_SERVICE_SECRET environment variable. Raises 401 if missing or
    wrong, so the endpoint function itself never runs.
    """
    if x_internal_secret != settings.ai_service_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal service credentials.",
        )
