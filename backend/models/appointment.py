from database.connection import DBContext


class AppointmentModel:
    @staticmethod
    def create(date_time, pet_id, vet_id) -> int:
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO Appointment (date_time, status, pet_id, vet_id) VALUES (%s,'Scheduled',%s,%s)",
                (date_time, pet_id, vet_id),
            )
            return cur.lastrowid

    @staticmethod
    def find_by_id(appointment_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT a.*, p.name AS pet_name, p.breed,
                       uv.full_name AS vet_name, v.specialization,
                       b.bill_id, b.total_amount, b.payment_status, b.generated_date
                FROM Appointment a
                JOIN Pet p ON p.pet_id = a.pet_id
                JOIN Veterinarian v ON v.user_id = a.vet_id
                JOIN User uv ON uv.user_id = v.user_id
                LEFT JOIN Bill b ON b.appointment_id = a.appointment_id
                WHERE a.appointment_id = %s
                """,
                (appointment_id,),
            )
            return cur.fetchone()

    @staticmethod
    def list_by_owner(owner_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT a.*, p.name AS pet_name, uv.full_name AS vet_name, v.specialization
                FROM Appointment a
                JOIN Pet p ON p.pet_id = a.pet_id
                JOIN Pet_Owner po ON po.user_id = p.owner_id
                JOIN Veterinarian v ON v.user_id = a.vet_id
                JOIN User uv ON uv.user_id = v.user_id
                WHERE po.user_id = %s
                ORDER BY a.date_time DESC
                """,
                (owner_id,),
            )
            return cur.fetchall()

    @staticmethod
    def list_by_vet_date(vet_id: int, date: str):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT a.*, p.name AS pet_name, p.breed, p.allergies,
                       uo.full_name AS owner_name, uo.phone AS owner_phone
                FROM Appointment a
                JOIN Pet p ON p.pet_id = a.pet_id
                JOIN Pet_Owner po ON po.user_id = p.owner_id
                JOIN User uo ON uo.user_id = po.user_id
                WHERE a.vet_id = %s AND DATE(a.date_time) = %s
                ORDER BY a.date_time
                """,
                (vet_id, date),
            )
            return cur.fetchall()

    @staticmethod
    def update_status(appointment_id: int, status: str):
        with DBContext() as (conn, cur):
            cur.execute(
                "UPDATE Appointment SET status = %s WHERE appointment_id = %s",
                (status, appointment_id),
            )


class BillModel:
    @staticmethod
    def find_by_id(bill_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT b.*, a.date_time AS appointment_date,
                       p.name AS pet_name, uo.full_name AS owner_name,
                       uv.full_name AS vet_name
                FROM Bill b
                JOIN Appointment a ON a.appointment_id = b.appointment_id
                JOIN Pet p ON p.pet_id = a.pet_id
                JOIN Pet_Owner po ON po.user_id = p.owner_id
                JOIN User uo ON uo.user_id = po.user_id
                JOIN Veterinarian v ON v.user_id = a.vet_id
                JOIN User uv ON uv.user_id = v.user_id
                WHERE b.bill_id = %s
                """,
                (bill_id,),
            )
            return cur.fetchone()

    @staticmethod
    def list_by_owner(owner_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT b.*, a.date_time AS appointment_date, p.name AS pet_name
                FROM Bill b
                JOIN Appointment a ON a.appointment_id = b.appointment_id
                JOIN Pet p ON p.pet_id = a.pet_id
                WHERE p.owner_id = %s
                ORDER BY b.generated_date DESC
                """,
                (owner_id,),
            )
            return cur.fetchall()

    @staticmethod
    def list_all():
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT b.*, a.date_time AS appointment_date,
                       p.name AS pet_name, uo.full_name AS owner_name
                FROM Bill b
                JOIN Appointment a ON a.appointment_id = b.appointment_id
                JOIN Pet p ON p.pet_id = a.pet_id
                JOIN Pet_Owner po ON po.user_id = p.owner_id
                JOIN User uo ON uo.user_id = po.user_id
                ORDER BY b.generated_date DESC
                """
            )
            return cur.fetchall()

    @staticmethod
    def mark_paid(bill_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                "UPDATE Bill SET payment_status = 'Paid' WHERE bill_id = %s",
                (bill_id,),
            )

    @staticmethod
    def create(generated_date, total_amount, appointment_id) -> int:
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO Bill (generated_date, payment_status, total_amount, appointment_id) VALUES (%s,'Unpaid',%s,%s)",
                (generated_date, total_amount, appointment_id),
            )
            return cur.lastrowid
