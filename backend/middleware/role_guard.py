from functools import wraps
from flask import g
from middleware.auth_middleware import require_auth
from utils.response import error


def require_role(*roles):
    """Decorator: user must be authenticated and have one of the given roles."""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            user_role = (g.user or {}).get("role")
            if user_role not in roles:
                return error(
                    f"Access denied. Required role(s): {', '.join(roles)}",
                    403,
                )
            return f(*args, **kwargs)
        return decorated
    return decorator
