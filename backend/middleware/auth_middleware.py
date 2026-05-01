import logging
from functools import wraps
from flask import request, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from utils.response import error

logger = logging.getLogger(__name__)


def load_user():
    """Populate g.user from the JWT if present. Non-blocking — use require_auth for enforcement."""
    try:
        verify_jwt_in_request(optional=True)
        claims = get_jwt()
        if claims:
            g.user = {
                "user_id":   claims.get("user_id"),
                "role":      claims.get("role"),
                "branch_id": claims.get("branch_id"),
            }
        else:
            g.user = None
    except Exception:
        g.user = None


def require_auth(f):
    """Decorator: request must carry a valid JWT."""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            claims = get_jwt()
            g.user = {
                "user_id":   claims.get("user_id"),
                "role":      claims.get("role"),
                "branch_id": claims.get("branch_id"),
            }
            logger.debug("Authenticated user_id=%s role=%s", g.user["user_id"], g.user["role"])
        except Exception as exc:
            logger.warning("Auth failed: %s", exc)
            return error("Authentication required", 401)
        return f(*args, **kwargs)
    return decorated
