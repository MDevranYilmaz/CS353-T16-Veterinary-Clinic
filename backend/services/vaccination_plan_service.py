from database.connection import DBContext
import logging

logger = logging.getLogger(__name__)


def get_applicable_plans(species: str, breed: str = None):
    """Get vaccination plans applicable to a pet species and breed"""
    with DBContext() as (conn, cur):
        if breed:
            cur.execute(
                """
                SELECT *
                FROM VaccinationPlan
                WHERE species = %s AND (breed = %s OR breed IS NULL)
                ORDER BY breed DESC, plan_name
                """,
                (species, breed),
            )
        else:
            cur.execute(
                """
                SELECT *
                FROM VaccinationPlan
                WHERE species = %s AND breed IS NULL
                ORDER BY plan_name
                """,
                (species,),
            )
        return cur.fetchall()


def generate_vaccination_schedule(pet_id: int, plan_id: int):
    """
    Generate a vaccination schedule for a pet based on applied plan.
    Queries the PetVaccinationSchedule view which handles all schedule logic:
    - Date calculations (birth date + age weeks)
    - Gender-based filtering
    - Booster scheduling
    - Status determination (Administered, Overdue, Due Soon, Upcoming)
    
    Returns list of vaccinations with recommended dates and status.
    """
    with DBContext() as (conn, cur):
        cur.execute(
            """
            SELECT 
                pet_id, vaccine_barcode, vaccine_name, vac_type,
                age_weeks, sequence_number, repeat_every_months, notes,
                recommended_date, last_admin_date, next_due_date, 
                vaccination_status
            FROM PetVaccinationSchedule
            WHERE pet_id = %s AND plan_id = %s
            ORDER BY age_weeks ASC, sequence_number ASC
            """,
            (pet_id, plan_id),
        )
        return cur.fetchall()


def get_pet_schedule(pet_id: int):
    """Get the complete vaccination schedule for a pet based on its applied plan"""
    with DBContext() as (conn, cur):
        # Get pet's applied plan
        cur.execute(
            """
            SELECT pv.plan_id, p.*
            FROM PetVaccinationPlan pv
            JOIN VaccinationPlan p ON p.plan_id = pv.plan_id
            WHERE pv.pet_id = %s
            LIMIT 1
            """,
            (pet_id,),
        )
        plan_row = cur.fetchone()

        if not plan_row:
            return None

        plan_id = plan_row["plan_id"]
        
        # Get the computed schedule from the view
        cur.execute(
            """
            SELECT * FROM PetVaccinationSchedule
            WHERE pet_id = %s AND plan_id = %s
            ORDER BY age_weeks ASC, sequence_number ASC
            """,
            (pet_id, plan_id),
        )
        schedule = cur.fetchall()

        return {
            "plan": plan_row,
            "schedule": schedule,
        }


def get_overdue_for_plan(pet_id: int):
    """Get overdue vaccinations for a pet"""
    with DBContext() as (conn, cur):
        cur.execute(
            """
            SELECT * FROM PetOverdueVaccinations
            WHERE pet_id = %s
            ORDER BY days_overdue DESC
            """,
            (pet_id,),
        )
        return cur.fetchall()


def get_upcoming_for_plan(pet_id: int, days_ahead: int = 30):
    """Get vaccinations due soon (within next N days)"""
    with DBContext() as (conn, cur):
        cur.execute(
            """
            SELECT * FROM PetUpcomingVaccinations
            WHERE pet_id = %s AND days_until_due <= %s
            ORDER BY days_until_due ASC
            """,
            (pet_id, days_ahead),
        )
        return cur.fetchall()


def get_compliance(pet_id: int):
    """Get vaccination compliance for a pet"""
    with DBContext() as (conn, cur):
        cur.execute(
            """
            SELECT
                p.pet_id,
                p.name AS pet_name,
                COUNT(pvs.vaccine_barcode) AS total_vaccines,
                SUM(CASE WHEN pvs.vaccination_status = 'Administered' THEN 1 ELSE 0 END) AS administered,
                SUM(CASE WHEN pvs.vaccination_status IN ('Overdue', 'Due Soon') THEN 1 ELSE 0 END) AS due,
                ROUND(
                    SUM(CASE WHEN pvs.vaccination_status = 'Administered' THEN 1 ELSE 0 END) * 100.0 / COUNT(pvs.vaccine_barcode),
                    1
                ) AS compliance_percentage
            FROM Pet p
            LEFT JOIN PetVaccinationSchedule pvs ON pvs.pet_id = p.pet_id
            WHERE p.pet_id = %s
            GROUP BY p.pet_id, p.name
            """,
            (pet_id,),
        )
        return cur.fetchone()
