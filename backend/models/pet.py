from database.connection import DBContext


class PetModel:
    @staticmethod
    def create(name, breed, birth_date, allergies, owner_id, species=None, gender=None) -> int:
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO Pet (name, species, breed, gender, birth_date, allergies, owner_id) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                (name, species, breed, gender, birth_date, allergies, owner_id),
            )
            return cur.lastrowid

    @staticmethod
    def find_by_id(pet_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT p.*, u.full_name AS owner_name, u.email AS owner_email, u.phone AS owner_phone, po.address
                FROM Pet p
                JOIN Pet_Owner po ON po.user_id = p.owner_id
                JOIN User u ON u.user_id = po.user_id
                WHERE p.pet_id = %s
                """,
                (pet_id,),
            )
            return cur.fetchone()

    @staticmethod
    def list_by_owner(owner_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                "SELECT * FROM Pet WHERE owner_id = %s ORDER BY name",
                (owner_id,),
            )
            return cur.fetchall()


class MedicalHistoryModel:
    @staticmethod
    def create(pet_id, date_time, diagnosis, symptoms, treatments, notes):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                INSERT INTO Medical_History (pet_id, date_time, diagnosis, symptoms, treatments, notes)
                VALUES (%s,%s,%s,%s,%s,%s)
                """,
                (pet_id, date_time, diagnosis, symptoms, treatments, notes),
            )

    @staticmethod
    def list_by_pet(pet_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                "SELECT * FROM Medical_History WHERE pet_id = %s ORDER BY date_time DESC",
                (pet_id,),
            )
            return cur.fetchall()
