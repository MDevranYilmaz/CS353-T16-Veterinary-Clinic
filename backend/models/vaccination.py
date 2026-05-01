from database.connection import DBContext


class VaccinationModel:
    @staticmethod
    def create(vac_date, next_due_date, pet_id, vet_id, barcode_no) -> int:
        with DBContext() as (conn, cur):
            cur.execute(
                "INSERT INTO Vaccination (vac_date, next_due_date, pet_id, vet_id, barcode_no) VALUES (%s,%s,%s,%s,%s)",
                (vac_date, next_due_date, pet_id, vet_id, barcode_no),
            )
            return cur.lastrowid

    @staticmethod
    def list_by_pet(pet_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT vs.*
                FROM VaccinationStatus vs
                WHERE vs.pet_id = %s
                ORDER BY vs.vac_date DESC
                """,
                (pet_id,),
            )
            return cur.fetchall()

    @staticmethod
    def list_overdue(branch_id=None):
        with DBContext() as (conn, cur):
            if branch_id:
                cur.execute(
                    "SELECT * FROM OverdueVaccinations WHERE branch_id = %s ORDER BY days_overdue DESC",
                    (branch_id,),
                )
            else:
                cur.execute("SELECT * FROM OverdueVaccinations ORDER BY days_overdue DESC")
            return cur.fetchall()
