from database.connection import DBContext


class PrescriptionModel:
    @staticmethod
    def create(pet_id, date_time, expiration_date, vet_id) -> int:
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO Prescription (pet_id, date_time, expiration_date, vet_id) VALUES (%s,%s,%s,%s)",
                (pet_id, date_time, expiration_date, vet_id),
            )
            return cur.lastrowid

    @staticmethod
    def add_medicine(prescription_id, medicine_id, dosage, frequency):
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO PresMed (prescription_id, medicine_id, dosage, frequency) VALUES (%s,%s,%s,%s)",
                (prescription_id, medicine_id, dosage, frequency),
            )

    @staticmethod
    def find_by_id(prescription_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT pr.*, p.name AS pet_name, uv.full_name AS vet_name
                FROM Prescription pr
                JOIN Pet p ON p.pet_id = pr.pet_id
                JOIN Veterinarian v ON v.user_id = pr.vet_id
                JOIN User uv ON uv.user_id = v.user_id
                WHERE pr.prescription_id = %s
                """,
                (prescription_id,),
            )
            header = cur.fetchone()
            if not header:
                return None
            cur.execute(
                """
                SELECT pm.*, m.med_name, m.med_type, m.unit_cost
                FROM PresMed pm JOIN Medicine m ON m.barcode_no = pm.medicine_id
                WHERE pm.prescription_id = %s
                """,
                (prescription_id,),
            )
            header["medicines"] = cur.fetchall()
            return header

    @staticmethod
    def list_by_pet(pet_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT pr.*, uv.full_name AS vet_name
                FROM Prescription pr
                JOIN Veterinarian v ON v.user_id = pr.vet_id
                JOIN User uv ON uv.user_id = v.user_id
                WHERE pr.pet_id = %s
                ORDER BY pr.date_time DESC
                """,
                (pet_id,),
            )
            return cur.fetchall()
