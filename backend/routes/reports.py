import logging
from flask import Blueprint, request
from database.connection import DBContext
from middleware.role_guard import require_role
from utils.response import success, error

logger = logging.getLogger(__name__)
bp = Blueprint("reports", __name__, url_prefix="/reports")


@bp.route("/stock-consumption/<int:branch_id>", methods=["GET"])
@require_role("manager", "veterinarian")
def stock_consumption(branch_id):
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    try:
        conditions = ["wl.manager_id IN (SELECT user_id FROM Clinic_Manager WHERE branch_id = %s)"]
        params = [branch_id]
        if from_date:
            conditions.append("wl.waste_date >= %s")
            params.append(from_date)
        if to_date:
            conditions.append("wl.waste_date <= %s")
            params.append(to_date)
        where = " AND ".join(conditions)

        with DBContext() as (conn, cur):
            cur.execute(
                f"""
                SELECT m.barcode_no, m.med_name, m.med_type,
                       COALESCE(SUM(pm.dosage), 0) AS prescribed_qty,
                       COALESCE(SUM(wl.quantity), 0) AS wasted_qty,
                       COALESCE(SUM(pm.dosage) + SUM(wl.quantity), 0) AS total_consumed,
                       m.unit_cost,
                       ROUND((COALESCE(SUM(pm.dosage), 0) + COALESCE(SUM(wl.quantity), 0)) * m.unit_cost, 2) AS total_cost
                FROM Medicine m
                LEFT JOIN PresMed pm ON pm.medicine_id = m.barcode_no
                LEFT JOIN WasteLog wl ON wl.barcode_no = m.barcode_no AND {where}
                WHERE m.barcode_no IN (SELECT barcode_no FROM BranchStock WHERE branch_id = %s)
                GROUP BY m.barcode_no, m.med_name, m.med_type, m.unit_cost
                ORDER BY total_consumed DESC
                """,
                params + [branch_id],
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("stock_consumption error: %s", exc)
        return error("Failed to generate stock consumption report", 500)


@bp.route("/waste-stats/<int:branch_id>", methods=["GET"])
@require_role("manager")
def waste_stats(branch_id):
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    try:
        conditions = ["cm.branch_id = %s"]
        params = [branch_id]
        if from_date:
            conditions.append("wl.waste_date >= %s")
            params.append(from_date)
        if to_date:
            conditions.append("wl.waste_date <= %s")
            params.append(to_date)
        where = " AND ".join(conditions)
        with DBContext() as (conn, cur):
            cur.execute(
                f"""
                SELECT m.med_type,
                       COUNT(*) AS log_count,
                       SUM(wl.quantity) AS total_units_wasted,
                       ROUND(SUM(wl.quantity * m.unit_cost), 2) AS total_value_wasted
                FROM WasteLog wl
                JOIN Clinic_Manager cm ON cm.user_id = wl.manager_id
                JOIN Medicine m ON m.barcode_no = wl.barcode_no
                WHERE {where}
                GROUP BY m.med_type
                ORDER BY total_value_wasted DESC
                """,
                params,
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("waste_stats error: %s", exc)
        return error("Failed to generate waste stats report", 500)


@bp.route("/cost-breakdown/<int:branch_id>", methods=["GET"])
@require_role("manager")
def cost_breakdown(branch_id):
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT m.med_type,
                       COUNT(*) AS distinct_medicines,
                       SUM(bs.stock_count) AS total_units,
                       ROUND(SUM(bs.stock_count * m.unit_cost), 2) AS inventory_value
                FROM BranchStock bs
                JOIN Medicine m ON m.barcode_no = bs.barcode_no
                WHERE bs.branch_id = %s
                GROUP BY m.med_type
                ORDER BY inventory_value DESC
                """,
                (branch_id,),
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("cost_breakdown error: %s", exc)
        return error("Failed to generate cost breakdown", 500)


@bp.route("/vaccination-compliance", methods=["GET"])
@require_role("manager", "veterinarian")
def vaccination_compliance():
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT p.breed,
                       COUNT(DISTINCT p.pet_id) AS total_pets,
                       COUNT(v.vac_id) AS total_vaccinations,
                       SUM(CASE WHEN v.next_due_date >= CURDATE() OR v.next_due_date IS NULL THEN 1 ELSE 0 END) AS up_to_date,
                       ROUND(
                           SUM(CASE WHEN v.next_due_date >= CURDATE() OR v.next_due_date IS NULL THEN 1 ELSE 0 END)
                           * 100.0 / NULLIF(COUNT(v.vac_id), 0),
                           1
                       ) AS compliance_pct
                FROM Pet p
                LEFT JOIN Vaccination v ON v.pet_id = p.pet_id
                GROUP BY p.breed
                ORDER BY compliance_pct DESC
                """
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("vaccination_compliance error: %s", exc)
        return error("Failed to generate compliance report", 500)


@bp.route("/vaccination-trends", methods=["GET"])
@require_role("manager", "veterinarian")
def vaccination_trends():
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT DATE_FORMAT(vac_date, '%Y-%m') AS month,
                       COUNT(*) AS total_vaccinations,
                       COUNT(DISTINCT pet_id) AS unique_pets_vaccinated,
                       COUNT(DISTINCT vet_id) AS vets_administered
                FROM Vaccination
                WHERE vac_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(vac_date, '%Y-%m')
                ORDER BY month DESC
                """
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("vaccination_trends error: %s", exc)
        return error("Failed to generate vaccination trends", 500)


@bp.route("/vaccination-most-administered", methods=["GET"])
@require_role("manager", "veterinarian")
def vaccination_most_administered():
    try:
        branch_id = request.args.get("branch_id")
        params = []
        where = ""
        if branch_id:
            where = "WHERE br.branch_id = %s"
            params.append(branch_id)

        with DBContext() as (conn, cur):
            cur.execute(
                f"""
                SELECT m.med_name AS vaccine_name,
                       vc.vac_type,
                       br.branch_id,
                       br.name AS branch_name,
                       COUNT(*) AS total_administered,
                       COUNT(DISTINCT vac.pet_id) AS unique_pets,
                       MIN(vac.vac_date) AS first_administered,
                       MAX(vac.vac_date) AS last_administered
                FROM Vaccination vac
                JOIN Vaccine vc ON vc.barcode_no = vac.barcode_no
                JOIN Medicine m ON m.barcode_no = vc.barcode_no
                JOIN Veterinarian vet ON vet.user_id = vac.vet_id
                JOIN Branch br ON br.branch_id = vet.branch_id
                {where}
                GROUP BY m.med_name, vc.vac_type, br.branch_id, br.name
                ORDER BY total_administered DESC, m.med_name ASC
                """,
                params,
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("vaccination_most_administered error: %s", exc)
        return error("Failed to generate most-administered vaccine report", 500)


@bp.route("/vaccination-overdue-rates", methods=["GET"])
@require_role("manager", "veterinarian")
def vaccination_overdue_rates():
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT br.branch_id,
                       br.name AS branch_name,
                       COUNT(DISTINCT ov.pet_id) AS pets_with_overdue,
                       COUNT(ov.vac_id) AS total_overdue_vaccinations,
                       AVG(ov.days_overdue) AS avg_days_overdue,
                       MAX(ov.days_overdue) AS max_days_overdue,
                       SUM(CASE WHEN ov.days_overdue > 90 THEN 1 ELSE 0 END) AS critical_overdue,
                       SUM(CASE WHEN ov.days_overdue > 30 AND ov.days_overdue <= 90 THEN 1 ELSE 0 END) AS high_priority_overdue
                FROM Branch br
                LEFT JOIN OverdueVaccinations ov ON ov.branch_id = br.branch_id
                GROUP BY br.branch_id, br.name
                ORDER BY total_overdue_vaccinations DESC
                """
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("vaccination_overdue_rates error: %s", exc)
        return error("Failed to generate overdue-rate report", 500)


@bp.route("/vaccination-coverage", methods=["GET"])
@require_role("manager", "veterinarian")
def vaccination_coverage():
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT p.breed,
                       vc.vac_type,
                       m.med_name AS vaccine_name,
                       COUNT(DISTINCT vac.pet_id) AS pets_vaccinated,
                       COUNT(*) AS total_doses
                FROM Vaccination vac
                JOIN Pet p ON p.pet_id = vac.pet_id
                JOIN Vaccine vc ON vc.barcode_no = vac.barcode_no
                JOIN Medicine m ON m.barcode_no = vc.barcode_no
                GROUP BY p.breed, vc.vac_type, m.med_name
                ORDER BY p.breed ASC, total_doses DESC
                """
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("vaccination_coverage error: %s", exc)
        return error("Failed to generate vaccination coverage report", 500)


@bp.route("/veterinarian-vaccination-performance", methods=["GET"])
@require_role("manager", "veterinarian")
def veterinarian_vaccination_performance():
    try:
        months = request.args.get("months", default=6, type=int)
        if months is None or months < 1 or months > 60:
            return error("months must be between 1 and 60", 400)

        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT vet.user_id,
                       u.full_name AS vet_name,
                       vet.specialization,
                       br.name AS branch_name,
                       COUNT(vac.vac_id) AS total_vaccinations,
                       COUNT(DISTINCT vac.pet_id) AS unique_pets,
                       COUNT(DISTINCT DATE(vac.vac_date)) AS days_worked,
                       ROUND(
                           COUNT(vac.vac_id) / NULLIF(COUNT(DISTINCT DATE(vac.vac_date)), 0),
                           2
                       ) AS avg_vaccinations_per_day
                FROM Veterinarian vet
                JOIN User u ON u.user_id = vet.user_id
                JOIN Branch br ON br.branch_id = vet.branch_id
                LEFT JOIN Vaccination vac
                    ON vac.vet_id = vet.user_id
                   AND vac.vac_date >= DATE_SUB(CURDATE(), INTERVAL %s MONTH)
                GROUP BY vet.user_id, u.full_name, vet.specialization, br.name
                ORDER BY total_vaccinations DESC, vet.user_id ASC
                """,
                (months,),
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("veterinarian_vaccination_performance error: %s", exc)
        return error("Failed to generate veterinarian performance report", 500)


@bp.route("/branch-performance", methods=["GET"])
@require_role("manager")
def branch_performance():
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT b.branch_id, b.name AS branch_name,
                       COUNT(v.vac_id) AS total_vaccinations,
                       SUM(CASE WHEN v.next_due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue_count,
                       SUM(CASE WHEN v.next_due_date >= CURDATE() OR v.next_due_date IS NULL THEN 1 ELSE 0 END) AS up_to_date_count,
                       ROUND(
                           SUM(CASE WHEN v.next_due_date >= CURDATE() OR v.next_due_date IS NULL THEN 1 ELSE 0 END)
                           * 100.0 / NULLIF(COUNT(v.vac_id), 0),
                           1
                       ) AS compliance_pct
                FROM Branch b
                LEFT JOIN Veterinarian vt ON vt.branch_id = b.branch_id
                LEFT JOIN Vaccination v ON v.vet_id = vt.user_id
                GROUP BY b.branch_id, b.name
                ORDER BY compliance_pct DESC
                """
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("branch_performance error: %s", exc)
        return error("Failed to generate branch performance report", 500)
