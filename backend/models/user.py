from database.connection import DBContext


class UserModel:
    @staticmethod
    def find_by_email(email: str):
        with DBContext() as (conn, cur):
            cur.execute(
                "SELECT * FROM User WHERE email = %s",
                (email,),
            )
            return cur.fetchone()

    @staticmethod
    def find_by_id(user_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                "SELECT user_id, full_name, email, phone FROM User WHERE user_id = %s",
                (user_id,),
            )
            return cur.fetchone()

    @staticmethod
    def create(full_name: str, email: str, phone: str, password_hash: str) -> int:
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO User (full_name, email, phone, password_hash) VALUES (%s,%s,%s,%s)",
                (full_name, email, phone, password_hash),
            )
            return cur.lastrowid


class PetOwnerModel:
    @staticmethod
    def create(user_id: int, address: str):
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO Pet_Owner (user_id, address) VALUES (%s,%s)",
                (user_id, address),
            )

    @staticmethod
    def find_by_id(user_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT u.user_id, u.full_name, u.email, u.phone, po.address
                FROM User u JOIN Pet_Owner po ON po.user_id = u.user_id
                WHERE u.user_id = %s
                """,
                (user_id,),
            )
            return cur.fetchone()


class VeterinarianModel:
    @staticmethod
    def create(user_id: int, specialization: str, license_number: str, branch_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO Veterinarian (user_id, specialization, license_number, branch_id) VALUES (%s,%s,%s,%s)",
                (user_id, specialization, license_number, branch_id),
            )

    @staticmethod
    def find_by_id(user_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT u.user_id, u.full_name, u.email, u.phone,
                       v.specialization, v.license_number, v.branch_id,
                       b.name AS branch_name,
                       ROUND(AVG(e.points), 2) AS avg_rating,
                       COUNT(e.eval_id) AS review_count
                FROM User u
                JOIN Veterinarian v ON v.user_id = u.user_id
                LEFT JOIN Branch b ON b.branch_id = v.branch_id
                LEFT JOIN Evaluation e ON e.vet_id = v.user_id
                WHERE u.user_id = %s
                GROUP BY u.user_id
                """,
                (user_id,),
            )
            return cur.fetchone()

    @staticmethod
    def list_all(branch_id=None, specialization=None):
        with DBContext() as (conn, cur):
            conditions = []
            params = []
            if branch_id:
                conditions.append("v.branch_id = %s")
                params.append(branch_id)
            if specialization:
                conditions.append("v.specialization LIKE %s")
                params.append(f"%{specialization}%")
            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(
                f"""
                SELECT u.user_id, u.full_name, u.email, u.phone,
                       v.specialization, v.license_number, v.branch_id,
                       b.name AS branch_name,
                       ROUND(AVG(e.points), 2) AS avg_rating
                FROM User u
                JOIN Veterinarian v ON v.user_id = u.user_id
                LEFT JOIN Branch b ON b.branch_id = v.branch_id
                LEFT JOIN Evaluation e ON e.vet_id = v.user_id
                {where}
                GROUP BY u.user_id, u.full_name, u.email, u.phone,
                         v.specialization, v.license_number, v.branch_id, b.name
                """,
                params,
            )
            return cur.fetchall()


class ClinicManagerModel:
    @staticmethod
    def create(user_id: int, experience: int, branch_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO Clinic_Manager (user_id, experience, branch_id) VALUES (%s,%s,%s)",
                (user_id, experience, branch_id),
            )

    @staticmethod
    def find_by_id(user_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT u.user_id, u.full_name, u.email, u.phone,
                       cm.experience, cm.branch_id, b.name AS branch_name
                FROM User u
                JOIN Clinic_Manager cm ON cm.user_id = u.user_id
                LEFT JOIN Branch b ON b.branch_id = cm.branch_id
                WHERE u.user_id = %s
                """,
                (user_id,),
            )
            return cur.fetchone()
