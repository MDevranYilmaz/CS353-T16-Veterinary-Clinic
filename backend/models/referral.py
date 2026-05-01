from database.connection import DBContext


class ReferralModel:
    @staticmethod
    def create(reason, referral_date, sender_vet_id, receiver_vet_id, pet_id) -> int:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                INSERT INTO Referral (reason, referral_date, status, sender_vet_id, receiver_vet_id, pet_id)
                VALUES (%s,%s,'Pending',%s,%s,%s)
                """,
                (reason, referral_date, sender_vet_id, receiver_vet_id, pet_id),
            )
            return cur.lastrowid

    @staticmethod
    def find_by_id(referral_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT r.*,
                       us.full_name AS sender_name, vs.specialization AS sender_spec,
                       ur.full_name AS receiver_name, vr.specialization AS receiver_spec,
                       p.name AS pet_name
                FROM Referral r
                JOIN Veterinarian vs ON vs.user_id = r.sender_vet_id
                JOIN User us ON us.user_id = vs.user_id
                JOIN Veterinarian vr ON vr.user_id = r.receiver_vet_id
                JOIN User ur ON ur.user_id = vr.user_id
                JOIN Pet p ON p.pet_id = r.pet_id
                WHERE r.referral_id = %s
                """,
                (referral_id,),
            )
            return cur.fetchone()

    @staticmethod
    def update_status(referral_id: int, status: str):
        with DBContext() as (conn, cur):
            cur.execute(
                "UPDATE Referral SET status = %s WHERE referral_id = %s",
                (status, referral_id),
            )

    @staticmethod
    def list_filtered(vet_id=None, pet_id=None):
        with DBContext() as (conn, cur):
            conditions = []
            params = []
            if vet_id:
                conditions.append("(r.sender_vet_id = %s OR r.receiver_vet_id = %s)")
                params.extend([vet_id, vet_id])
            if pet_id:
                conditions.append("r.pet_id = %s")
                params.append(pet_id)
            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(
                f"""
                SELECT r.*,
                       us.full_name AS sender_name, vs.specialization AS sender_spec,
                       ur.full_name AS receiver_name, vr.specialization AS receiver_spec,
                       p.name AS pet_name
                FROM Referral r
                JOIN Veterinarian vs ON vs.user_id = r.sender_vet_id
                JOIN User us ON us.user_id = vs.user_id
                JOIN Veterinarian vr ON vr.user_id = r.receiver_vet_id
                JOIN User ur ON ur.user_id = vr.user_id
                JOIN Pet p ON p.pet_id = r.pet_id
                {where}
                ORDER BY r.referral_date DESC
                """,
                params,
            )
            return cur.fetchall()
