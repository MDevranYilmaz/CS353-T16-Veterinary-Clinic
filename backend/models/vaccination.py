from datetime import datetime, timedelta
from database.connection import DBContext


class VaccinationModel:
    @staticmethod
    def create(vac_date, pet_id, vet_id, pet_vaccination_plan_id) -> int:
        """
        Create a vaccination record. next_due_date is auto-calculated from the plan's repeat_every_months.
        
        Args:
            vac_date: Date vaccine was administered (YYYY-MM-DD)
            pet_id: Pet ID
            vet_id: Veterinarian ID
            pet_vaccination_plan_id: Reference to the PetVaccinationPlan (enforces plan requirement)
            
        Returns:
            vac_id of the created record
        """
        with DBContext() as (conn, cur):
            # Fetch the plan to get repeat_every_months and barcode
            cur.execute(
                """
                SELECT repeat_every_months, vaccine_barcode
                FROM PetVaccinationPlan
                WHERE pet_vaccination_plan_id = %s AND pet_id = %s
                """,
                (pet_vaccination_plan_id, pet_id),
            )
            plan = cur.fetchone()
            
            if not plan:
                raise ValueError(f"PetVaccinationPlan {pet_vaccination_plan_id} not found for pet {pet_id}")
            
            repeat_months = plan["repeat_every_months"]
            barcode_no = plan["vaccine_barcode"]
            
            # Calculate next_due_date
            vac_date_obj = datetime.strptime(vac_date, "%Y-%m-%d")
            if repeat_months:
                # Add months using approximate calculation (30 days per month)
                next_due_date_obj = vac_date_obj + timedelta(days=repeat_months * 30)
                next_due_date = next_due_date_obj.strftime("%Y-%m-%d")
            else:
                next_due_date = None
            
            # Insert vaccination record
            cur.execute(
                """
                INSERT INTO Vaccination 
                (vac_date, next_due_date, pet_id, vet_id, barcode_no, pet_vaccination_plan_id) 
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (vac_date, next_due_date, pet_id, vet_id, barcode_no, pet_vaccination_plan_id),
            )
            return cur.lastrowid

    @staticmethod
    def list_by_pet(pet_id: int):
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT vs.*, vac.vet_id, v.branch_id
                FROM VaccinationStatus vs
                JOIN Vaccination vac ON vac.vac_id = vs.vac_id
                JOIN Veterinarian v ON v.user_id = vac.vet_id
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
