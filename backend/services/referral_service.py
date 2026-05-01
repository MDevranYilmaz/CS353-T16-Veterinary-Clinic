import logging
from database.connection import DBContext

logger = logging.getLogger(__name__)


def create_referral(reason: str, referral_date: str, sender_vet_id: int, receiver_vet_id: int, pet_id: int) -> int:
    if sender_vet_id == receiver_vet_id:
        raise ValueError("Sender and receiver veterinarian cannot be the same.")
    with DBContext() as (conn, cur):
        cur.execute(
            """
            INSERT INTO Referral (reason, referral_date, status, sender_vet_id, receiver_vet_id, pet_id)
            VALUES (%s,%s,'Pending',%s,%s,%s)
            """,
            (reason, referral_date, sender_vet_id, receiver_vet_id, pet_id),
        )
        referral_id = cur.lastrowid
    logger.info("Created referral_id=%d from vet %d to vet %d", referral_id, sender_vet_id, receiver_vet_id)
    return referral_id


def update_status(referral_id: int, status: str):
    if status not in ("Accepted", "Rejected"):
        raise ValueError("Status must be Accepted or Rejected.")
    with DBContext() as (conn, cur):
        cur.execute(
            "UPDATE Referral SET status = %s WHERE referral_id = %s",
            (status, referral_id),
        )
    logger.info("Referral %d updated to %s", referral_id, status)


def list_specialists(specialization: str) -> list:
    with DBContext() as (conn, cur):
        cur.execute(
            """
            SELECT v.user_id, u.full_name, v.specialization, v.branch_id, b.name AS branch_name
            FROM Veterinarian v
            JOIN User u ON u.user_id = v.user_id
            LEFT JOIN Branch b ON b.branch_id = v.branch_id
            WHERE v.specialization LIKE %s
            ORDER BY u.full_name
            """,
            (f"%{specialization}%",),
        )
        return cur.fetchall()
