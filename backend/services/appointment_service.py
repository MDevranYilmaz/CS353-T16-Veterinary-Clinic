import logging
from database.connection import DBContext

logger = logging.getLogger(__name__)

SLOT_HOURS = [9, 10, 11, 12, 14, 15, 16, 17]


def check_daily_limit(vet_id: int, date_time: str) -> bool:
    """Return True if vet has fewer than 15 non-cancelled appointments on the given day."""
    with DBContext() as (conn, cur):
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM Appointment "
            "WHERE vet_id = %s AND DATE(date_time) = DATE(%s) AND status != 'Cancelled'",
            (vet_id, date_time),
        )
        row = cur.fetchone()
        return row["cnt"] < 15


def check_vet_available(vet_id: int, date_time: str) -> bool:
    """Return True if no non-cancelled appointment exists at the exact date_time."""
    with DBContext() as (conn, cur):
        cur.execute(
            """
            SELECT COUNT(*) AS cnt FROM Appointment
            WHERE vet_id = %s AND date_time = %s AND status != 'Cancelled'
            """,
            (vet_id, date_time),
        )
        row = cur.fetchone()
        return row["cnt"] == 0


def get_available_slots(vet_id: int, date: str) -> list:
    """Return list of available hour-slots (as HH:00 strings) for a given date."""
    with DBContext() as (conn, cur):
        cur.execute(
            """
            SELECT HOUR(date_time) AS booked_hour FROM Appointment
            WHERE vet_id = %s AND DATE(date_time) = %s AND status != 'Cancelled'
            """,
            (vet_id, date),
        )
        booked = {row["booked_hour"] for row in cur.fetchall()}
    return [f"{h:02d}:00" for h in SLOT_HOURS if h not in booked]


def book_appointment(date_time: str, pet_id: int, vet_id: int) -> dict:
    """Validate limits/conflicts and create appointment. Returns dict with appointment_id."""
    if not check_daily_limit(vet_id, date_time):
        raise ValueError("Veterinarian has reached the daily appointment limit (15).")
    if not check_vet_available(vet_id, date_time):
        raise ValueError("The selected time slot is already booked.")

    with DBContext() as (conn, cur):
        cur.execute(
            "INSERT INTO Appointment (date_time, status, pet_id, vet_id) VALUES (%s,'Scheduled',%s,%s)",
            (date_time, pet_id, vet_id),
        )
        appointment_id = cur.lastrowid
    logger.info("Booked appointment_id=%d vet=%d pet=%d at %s", appointment_id, vet_id, pet_id, date_time)
    return {"appointment_id": appointment_id}
