def paginate(items: list, page: int, per_page: int) -> dict:
    total = len(items)
    start = (page - 1) * per_page
    end = start + per_page
    return {
        "items": items[start:end],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": max(1, -(-total // per_page)),
        },
    }


def paginate_query(cursor, query: str, params: tuple, page: int, per_page: int) -> dict:
    """Execute a COUNT query then the paginated data query."""
    count_query = f"SELECT COUNT(*) AS total FROM ({query}) AS sub"
    cursor.execute(count_query, params)
    total = cursor.fetchone()["total"]

    offset = (page - 1) * per_page
    paged_query = f"{query} LIMIT %s OFFSET %s"
    cursor.execute(paged_query, params + (per_page, offset))
    items = cursor.fetchall()

    return {
        "items": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": max(1, -(-total // per_page)),
        },
    }
