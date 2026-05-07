import logging
from flask import Blueprint, request
from models.medicine import BranchStockModel, MedicineModel
from services.inventory_service import get_low_stock
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_date, parse_pagination
from utils.pagination import paginate

from database.connection import get_db_connection

def log_supply(medicine_id, batch_number, quantity, expiry_date):
    """Log new supply (INSERT stock entry with batch number, expiry)"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO stock_entry (medicine_id, batch_number, quantity, expiry_date) 
            VALUES (%s, %s, %s, %s)
        """, (medicine_id, batch_number, quantity, expiry_date))
        
        # This update triggers 'check_low_stock' if falls below min_stock
        cur.execute("""
            UPDATE medicine SET current_stock = current_stock + %s WHERE id = %s
        """, (quantity, medicine_id))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def delete_expired_stocks():
    """DELETE expired stock entries"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM stock_entry WHERE expiry_date < CURRENT_DATE RETURNING id")
        deleted = cur.rowcount
        conn.commit()
        return deleted
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()