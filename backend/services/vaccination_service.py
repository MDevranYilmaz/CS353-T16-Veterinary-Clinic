import logging
from database.connection import DBContext

logger = logging.getLogger(__name__)


def get_vaccination_status(pet_id: int) -> list:
    with DBContext() as (conn, cur):
        cur.execute(
            "SELECT * FROM VaccinationStatus WHERE pet_id = %s ORDER BY vac_date DESC",
            (pet_id,),
        )
        return cur.fetchall()


def get_overdue(branch_id=None) -> list:
    with DBContext() as (conn, cur):
        if branch_id:
            cur.execute(
                "SELECT * FROM OverdueVaccinations WHERE branch_id = %s ORDER BY days_overdue DESC",
                (branch_id,),
            )
        else:
            cur.execute("SELECT * FROM OverdueVaccinations ORDER BY days_overdue DESC")
        return cur.fetchall()


def get_analytics() -> dict:
    with DBContext() as (conn, cur):
        cur.execute(
            """
            SELECT
                COUNT(*) AS total_vaccinations,
                SUM(CASE WHEN next_due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue,
                SUM(CASE WHEN next_due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS due_soon,
                SUM(CASE WHEN next_due_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS upcoming
            FROM Vaccination
            WHERE next_due_date IS NOT NULL
            """
        )
        summary = cur.fetchone()

        cur.execute(
            """
            SELECT p.breed,
                   COUNT(*) AS total,
                   SUM(CASE WHEN v.next_due_date >= CURDATE() THEN 1 ELSE 0 END) AS up_to_date,
                   ROUND(SUM(CASE WHEN v.next_due_date >= CURDATE() THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS compliance_rate
            FROM Vaccination v
            JOIN Pet p ON p.pet_id = v.pet_id
            WHERE v.next_due_date IS NOT NULL
            GROUP BY p.breed
            ORDER BY compliance_rate DESC
            """
        )
        by_breed = cur.fetchall()

    return {"summary": summary, "by_breed": by_breed}
