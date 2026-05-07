from database.connection import DBContext
import logging

logger = logging.getLogger(__name__)


def get_applicable_plans(species: str, breed: str = None):
    """Get all vaccines available to assign to a pet"""
    with DBContext() as (conn, cur):
        # Return all vaccines as applicable options
        cur.execute("""
            SELECT v.barcode_no, m.med_name, v.vac_type, m.unit_cost
            FROM Vaccine v
            JOIN Medicine m ON m.barcode_no = v.barcode_no
            ORDER BY m.med_name
        """)
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
    """Get the complete vaccination schedule for a pet"""
    with DBContext() as (conn, cur):
        # Get the pet's vaccination schedule (custom plan)
        cur.execute(
            """
            SELECT pvp.pet_vaccination_plan_id, pvp.pet_id, pvp.vaccine_barcode, 
                   pvp.age_weeks, pvp.sequence_number, pvp.repeat_every_months, 
                   pvp.gender_applicable, pvp.notes,
                   m.med_name as vaccine_name, v.vac_type, m.unit_cost
            FROM PetVaccinationPlan pvp
            JOIN Vaccine v ON v.barcode_no = pvp.vaccine_barcode
            JOIN Medicine m ON m.barcode_no = v.barcode_no
            WHERE pvp.pet_id = %s
            ORDER BY pvp.age_weeks ASC, pvp.sequence_number ASC
            """,
            (pet_id,),
        )
        schedule = cur.fetchall()

        return schedule


def get_overdue_for_plan(pet_id: int):
    """Get overdue vaccinations for a pet (based on schedule)"""
    with DBContext() as (conn, cur):
        # Get all scheduled vaccines with next_due_date that has passed
        cur.execute(
            """
            SELECT v.*, m.med_name, p.name as pet_name, p.birth_date,
                   DATEDIFF(CURDATE(), 
                            DATE_ADD(p.birth_date, INTERVAL pvp.age_weeks WEEK)
                   ) as days_overdue
            FROM Vaccination v
            JOIN Pet p ON p.pet_id = v.pet_id
            JOIN Vaccine vc ON vc.barcode_no = v.barcode_no
            JOIN Medicine m ON m.barcode_no = v.barcode_no
            LEFT JOIN PetVaccinationPlan pvp ON pvp.pet_id = p.pet_id AND pvp.vaccine_barcode = v.barcode_no
            WHERE v.pet_id = %s AND v.next_due_date IS NOT NULL AND v.next_due_date < CURDATE()
            ORDER BY v.next_due_date ASC
            """,
            (pet_id,),
        )
        return cur.fetchall()


def get_upcoming_for_plan(pet_id: int, days_ahead: int = 30):
    """Get vaccinations due soon (within next N days)"""
    with DBContext() as (conn, cur):
        # Get scheduled vaccines that are coming up
        cur.execute(
            """
            SELECT v.*, m.med_name, p.name as pet_name,
                   DATEDIFF(v.next_due_date, CURDATE()) as days_until_due
            FROM Vaccination v
            JOIN Pet p ON p.pet_id = v.pet_id
            JOIN Vaccine vc ON vc.barcode_no = v.barcode_no
            JOIN Medicine m ON m.barcode_no = v.barcode_no
            WHERE v.pet_id = %s 
              AND v.next_due_date IS NOT NULL 
              AND v.next_due_date >= CURDATE() 
              AND v.next_due_date <= DATE_ADD(CURDATE(), INTERVAL %s DAY)
            ORDER BY v.next_due_date ASC
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
                COUNT(DISTINCT pvp.vaccine_barcode) AS total_vaccines,
                COUNT(DISTINCT v.vac_id) AS administered,
                ROUND(
                    COUNT(DISTINCT v.vac_id) * 100.0 / NULLIF(COUNT(DISTINCT pvp.vaccine_barcode), 0),
                    1
                ) AS compliance_percentage
            FROM Pet p
            LEFT JOIN PetVaccinationPlan pvp ON pvp.pet_id = p.pet_id
            LEFT JOIN Vaccination v ON v.pet_id = p.pet_id AND v.barcode_no = pvp.vaccine_barcode
            WHERE p.pet_id = %s
            GROUP BY p.pet_id, p.name
            """,
            (pet_id,),
        )
        return cur.fetchone()
