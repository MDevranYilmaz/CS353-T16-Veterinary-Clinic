import logging
from datetime import date
from database.connection import DBContext

logger = logging.getLogger(__name__)

CONSULTATION_FEE = 100.00


def calculate_bill(appointment_id: int) -> float:
    """Calculate total bill = consultation fee + medicine costs for all prescriptions on same day/vet."""
    with DBContext() as (conn, cur):
        cur.execute(
            "SELECT pet_id, vet_id, date_time FROM Appointment WHERE appointment_id = %s",
            (appointment_id,),
        )
        appt = cur.fetchone()
        if not appt:
            return CONSULTATION_FEE

        cur.execute(
            """
            SELECT COALESCE(SUM(m.unit_cost * pm.dosage), 0) AS med_total
            FROM Prescription pr
            JOIN PresMed pm ON pm.prescription_id = pr.prescription_id
            JOIN Medicine m  ON m.barcode_no = pm.medicine_id
            WHERE pr.pet_id = %s
              AND pr.vet_id = %s
              AND DATE(pr.date_time) = DATE(%s)
            """,
            (appt["pet_id"], appt["vet_id"], appt["date_time"]),
        )
        row = cur.fetchone()
        med_total = float(row["med_total"]) if row else 0.0
    return CONSULTATION_FEE + med_total


def create_bill(appointment_id: int) -> int:
    """Create a Bill record and return bill_id."""
    total = calculate_bill(appointment_id)
    with DBContext() as (conn, cur):
        cur.execute(
            "SELECT bill_id FROM Bill WHERE appointment_id = %s",
            (appointment_id,),
        )
        existing = cur.fetchone()
        if existing:
            return existing["bill_id"]
        cur.execute(
            "INSERT INTO Bill (generated_date, payment_status, total_amount, appointment_id) VALUES (%s,'Unpaid',%s,%s)",
            (date.today().isoformat(), total, appointment_id),
        )
        bill_id = cur.lastrowid
    logger.info("Created bill_id=%d for appointment_id=%d total=%.2f", bill_id, appointment_id, total)
    return bill_id


def mark_paid(bill_id: int):
    with DBContext() as (conn, cur):
        cur.execute(
            "UPDATE Bill SET payment_status='Paid' WHERE bill_id = %s",
            (bill_id,),
        )
    logger.info("Bill %d marked as Paid", bill_id)
