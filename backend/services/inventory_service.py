import logging
from database.connection import DBContext

logger = logging.getLogger(__name__)


def check_stock_availability(branch_id: int, items: list[dict]) -> list[str]:
    """items = [{"barcode_no": ..., "quantity": ...}]. Returns list of shortage messages."""
    shortages = []
    with DBContext() as (conn, cur):
        for item in items:
            cur.execute(
                "SELECT stock_count FROM BranchStock WHERE branch_id = %s AND barcode_no = %s",
                (branch_id, item["barcode_no"]),
            )
            row = cur.fetchone()
            if not row or row["stock_count"] < item["quantity"]:
                current = row["stock_count"] if row else 0
                shortages.append(
                    f"Insufficient stock for {item['barcode_no']}: need {item['quantity']}, have {current}"
                )
    return shortages


def deduct_stock(branch_id: int, barcode_no: str, quantity: int):
    with DBContext() as (conn, cur):
        cur.execute(
            """
            UPDATE BranchStock
            SET stock_count = GREATEST(0, stock_count - %s)
            WHERE branch_id = %s AND barcode_no = %s
            """,
            (quantity, branch_id, barcode_no),
        )
    logger.debug("Deducted %d of %s from branch %d", quantity, barcode_no, branch_id)


def get_low_stock(branch_id: int) -> list:
    with DBContext() as (conn, cur):
        cur.execute(
            "SELECT * FROM LowStockAlert WHERE branch_id = %s ORDER BY deficit DESC",
            (branch_id,),
        )
        return cur.fetchall()
