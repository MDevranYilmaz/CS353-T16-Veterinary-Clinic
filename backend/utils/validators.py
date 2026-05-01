import re
from datetime import datetime


def require_fields(data: dict, fields: list[str]) -> list[str]:
    """Return list of missing field names."""
    return [f for f in fields if not data.get(f) and data.get(f) != 0]


def valid_date(value: str, fmt="%Y-%m-%d") -> bool:
    try:
        datetime.strptime(value, fmt)
        return True
    except (ValueError, TypeError):
        return False


def valid_datetime(value: str, fmt="%Y-%m-%dT%H:%M:%S") -> bool:
    try:
        datetime.strptime(value, fmt)
        return True
    except (ValueError, TypeError):
        # also try with space separator
        try:
            datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
            return True
        except (ValueError, TypeError):
            return False


def valid_email(value: str) -> bool:
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return bool(re.match(pattern, value or ""))


def valid_enum(value: str, choices: list[str]) -> bool:
    return value in choices


def valid_int_range(value, low: int, high: int) -> bool:
    try:
        return low <= int(value) <= high
    except (TypeError, ValueError):
        return False


def parse_pagination(args) -> tuple[int, int]:
    try:
        page = max(1, int(args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = min(100, max(1, int(args.get("per_page", 20))))
    except (TypeError, ValueError):
        per_page = 20
    return page, per_page
