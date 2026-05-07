import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from database.connection import DBContext

logger = logging.getLogger(__name__)

SLOT_HOURS = [9, 10, 11, 12, 14, 15, 16, 17]
IST_ZONE = ZoneInfo("Europe/Istanbul")
UTC_ZONE = ZoneInfo("UTC")


def _local_to_utc_str(local_dt_str: str) -> str:
    """Convert a local (Europe/Istanbul) datetime string 'YYYY-MM-DD HH:MM:SS' to UTC datetime string."""
    # parse without timezone
    d = datetime.strptime(local_dt_str, "%Y-%m-%d %H:%M:%S")
    d = d.replace(tzinfo=IST_ZONE)
    utc = d.astimezone(UTC_ZONE)
    return utc.strftime("%Y-%m-%d %H:%M:%S")


def _utc_range_for_local_date(date_str: str) -> tuple[str, str]:
    """Given local date YYYY-MM-DD, return (utc_start_str, utc_end_str) covering that local day."""
    y, m, day = map(int, date_str.split("-"))
    local_start = datetime(y, m, day, 0, 0, 0, tzinfo=IST_ZONE)
    local_end = datetime(y, m, day, 23, 59, 59, tzinfo=IST_ZONE)
    utc_start = local_start.astimezone(UTC_ZONE)
    utc_end = local_end.astimezone(UTC_ZONE)
    return utc_start.strftime("%Y-%m-%d %H:%M:%S"), utc_end.strftime("%Y-%m-%d %H:%M:%S")


def check_daily_limit(vet_id: int, local_date_str: str) -> bool:
    """Return True if vet has fewer than 15 non-cancelled appointments on the given local day."""
    utc_start, utc_end = _utc_range_for_local_date(local_date_str)
    with DBContext() as (conn, cur):
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM Appointment "
            "WHERE vet_id = %s AND date_time BETWEEN %s AND %s AND status != 'Cancelled'",
            (vet_id, utc_start, utc_end),
        )
        row = cur.fetchone()
        return row["cnt"] < 15


def check_vet_available(vet_id: int, local_dt_str: str) -> bool:
    """Return True if no non-cancelled appointment exists at the exact local date_time."""
    utc_dt = _local_to_utc_str(local_dt_str)
    with DBContext() as (conn, cur):
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM Appointment WHERE vet_id = %s AND date_time = %s AND status != 'Cancelled'",
            (vet_id, utc_dt),
        )
        row = cur.fetchone()
        return row["cnt"] == 0


def get_available_slots(vet_id: int, local_date_str: str) -> list:
    """Return list of available hour-slots (as HH:00 strings) for a given local date (Istanbul).
    We query stored UTC datetimes and convert them to Istanbul local hours to compute booked slots.
    """
    utc_start, utc_end = _utc_range_for_local_date(local_date_str)
    with DBContext() as (conn, cur):
        cur.execute(
            "SELECT date_time FROM Appointment WHERE vet_id = %s AND date_time BETWEEN %s AND %s AND status != 'Cancelled'",
            (vet_id, utc_start, utc_end),
        )
        rows = cur.fetchall()
    booked_hours = set()
    for r in rows:
        # r['date_time'] is a datetime object (UTC) from connector; convert to IST and get hour
        dt_utc = r['date_time']
        if dt_utc.tzinfo is None:
            dt_utc = dt_utc.replace(tzinfo=UTC_ZONE)
        dt_local = dt_utc.astimezone(IST_ZONE)
        booked_hours.add(dt_local.hour)
    return [f"{h:02d}:00" for h in SLOT_HOURS if h not in booked_hours]


def check_outstanding_bills(pet_id: int) -> bool:
    """Return True if the pet has no outstanding (unpaid) bills."""
    with DBContext() as (conn, cur):
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM OutstandingBills WHERE pet_id = %s",
            (pet_id,),
        )
        row = cur.fetchone()
        return row["cnt"] == 0


def book_appointment(date_time: str, pet_id: int, vet_id: int, appt_type: str = 'checkup', notes: str | None = None) -> dict:
    """Validate limits/conflicts and create appointment. Expects `date_time` in local Istanbul 'YYYY-MM-DD HH:MM:SS'.
    Stores datetimes in UTC in DB.
    Returns dict with appointment_id.
    """
    # date_time here is local string like '2026-05-03 16:00:00'
    local_date = date_time.split(' ')[0]
    if not check_daily_limit(vet_id, local_date):
        raise ValueError("Veterinarian has reached the daily appointment limit (15).")
    if not check_vet_available(vet_id, date_time):
        raise ValueError("The selected time slot is already booked.")
    if not check_outstanding_bills(pet_id):
        raise ValueError("This pet has outstanding unpaid bills. Please settle them before booking a new appointment.")

    utc_dt = _local_to_utc_str(date_time)
    with DBContext() as (conn, cur):
        cur.execute(
            "INSERT INTO Appointment (date_time, status, type, notes, pet_id, vet_id) VALUES (%s,'Scheduled',%s,%s,%s,%s)",
            (utc_dt, appt_type, notes, pet_id, vet_id),
        )
        appointment_id = cur.lastrowid
    logger.info("Booked appointment_id=%d vet=%d pet=%d at %s (local %s)", appointment_id, vet_id, pet_id, utc_dt, date_time)
    return {"appointment_id": appointment_id}
