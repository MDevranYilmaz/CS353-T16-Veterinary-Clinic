import logging
from flask import Blueprint, request, g
from models.vaccination import VaccinationModel
from services.vaccination_service import get_vaccination_status, get_overdue, get_analytics
from services.inventory_service import deduct_stock
from database.connection import DBContext
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_date, parse_pagination
from utils.pagination import paginate

logger = logging.getLogger(__name__)
bp = Blueprint("vaccinations", __name__, url_prefix="/vaccinations")


@bp.route("", methods=["POST"])
@require_role("veterinarian")
def create_vaccination():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["vac_date", "pet_id", "barcode_no"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    if not valid_date(data["vac_date"]):
        return error("vac_date must be YYYY-MM-DD", 400)

    if data.get("next_due_date") and not valid_date(data["next_due_date"]):
        return error("next_due_date must be YYYY-MM-DD", 400)

    try:
        with DBContext() as (conn, cur):
            cur.execute("SELECT branch_id FROM Veterinarian WHERE user_id = %s", (g.user["user_id"],))
            row = cur.fetchone()
            branch_id = row["branch_id"] if row else None

        vac_id = VaccinationModel.create(
            data["vac_date"],
            data.get("next_due_date"),
            data["pet_id"],
            g.user["user_id"],
            data["barcode_no"],
        )

        if branch_id:
            deduct_stock(branch_id, data["barcode_no"], 1)

        return success({"vac_id": vac_id}, "Vaccination recorded", 201)
    except Exception as exc:
        logger.error("create_vaccination error: %s", exc)
        return error("Failed to record vaccination", 500)


@bp.route("/status/<int:pet_id>", methods=["GET"])
@require_auth
def vaccination_status(pet_id):
    try:
        statuses = get_vaccination_status(pet_id)
        return success(statuses)
    except Exception as exc:
        logger.error("vaccination_status error: %s", exc)
        return error("Failed to fetch vaccination status", 500)


@bp.route("/status/<int:pet_id>/overdue", methods=["GET"])
@require_auth
def vaccination_status_overdue(pet_id):
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT vac_id, pet_id, pet_name, breed, vaccine_name, vac_type,
                       vac_date AS last_administered, next_due_date,
                       ABS(DATEDIFF(CURDATE(), next_due_date)) AS days_overdue
                FROM VaccinationStatus
                WHERE pet_id = %s
                  AND vaccination_status = 'Overdue'
                ORDER BY next_due_date ASC
                """,
                (pet_id,),
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("vaccination_status_overdue error: %s", exc)
        return error("Failed to fetch overdue vaccination status", 500)


@bp.route("/status/<int:pet_id>/upcoming", methods=["GET"])
@require_auth
def vaccination_status_upcoming(pet_id):
    try:
        days = request.args.get("days", default=60, type=int)
        if days is None or days < 1 or days > 365:
            return error("days must be between 1 and 365", 400)

        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT vac_id, pet_id, pet_name, breed, vaccine_name, vac_type,
                       next_due_date, DATEDIFF(next_due_date, CURDATE()) AS days_until_due,
                       vaccination_status
                FROM VaccinationStatus
                WHERE pet_id = %s
                  AND vaccination_status IN ('Due Soon', 'Upcoming')
                  AND next_due_date IS NOT NULL
                  AND next_due_date <= DATE_ADD(CURDATE(), INTERVAL %s DAY)
                ORDER BY next_due_date ASC
                """,
                (pet_id, days),
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("vaccination_status_upcoming error: %s", exc)
        return error("Failed to fetch upcoming vaccination status", 500)


@bp.route("/pet-profile/<int:pet_id>/summary", methods=["GET"])
@require_auth
def pet_profile_vaccination_summary(pet_id):
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT p.pet_id, p.name, p.breed, p.birth_date, p.allergies,
                       TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age_years,
                       COUNT(DISTINCT vac.vac_id) AS total_vaccinations,
                       SUM(CASE WHEN vs.vaccination_status = 'Overdue' THEN 1 ELSE 0 END) AS overdue_count,
                       SUM(CASE WHEN vs.vaccination_status = 'Due Soon' THEN 1 ELSE 0 END) AS due_soon_count,
                       SUM(CASE WHEN vs.vaccination_status IN ('Upcoming', 'Up to Date') THEN 1 ELSE 0 END) AS up_to_date_count
                FROM Pet p
                LEFT JOIN Vaccination vac ON vac.pet_id = p.pet_id
                LEFT JOIN VaccinationStatus vs ON vs.vac_id = vac.vac_id
                WHERE p.pet_id = %s
                GROUP BY p.pet_id, p.name, p.breed, p.birth_date, p.allergies
                """,
                (pet_id,),
            )
            row = cur.fetchone()
        if not row:
            return error("Pet not found", 404)
        return success(row)
    except Exception as exc:
        logger.error("pet_profile_vaccination_summary error: %s", exc)
        return error("Failed to fetch pet vaccination summary", 500)


@bp.route("/overdue", methods=["GET"])
@require_auth
def overdue_vaccinations():
    try:
        branch_id = request.args.get("branch_id")
        records = get_overdue(branch_id=branch_id)
        return success(records)
    except Exception as exc:
        logger.error("overdue_vaccinations error: %s", exc)
        return error("Failed to fetch overdue vaccinations", 500)


@bp.route("/analytics", methods=["GET"])
@require_role("manager", "veterinarian")
def vaccination_analytics():
    try:
        data = get_analytics()
        return success(data)
    except Exception as exc:
        logger.error("vaccination_analytics error: %s", exc)
        return error("Failed to fetch vaccination analytics", 500)


@bp.route("/available-vaccines", methods=["GET"])
@require_auth
def available_vaccines():
    try:
        vet_id = request.args.get("vet_id") or (
            g.user.get("user_id") if g.user.get("role") == "veterinarian" else None
        )
        if not vet_id:
            return error("vet_id is required", 400)

        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT bs.barcode_no, m.med_name, v.vac_type, v.side_effect,
                       bs.stock_count, bs.batch_number, bs.expiration_date,
                       b.branch_id, b.name AS branch_name
                FROM BranchStock bs
                JOIN Medicine m ON m.barcode_no = bs.barcode_no
                JOIN Vaccine v ON v.barcode_no = m.barcode_no
                JOIN Veterinarian vet ON vet.branch_id = bs.branch_id
                JOIN Branch b ON b.branch_id = bs.branch_id
                WHERE vet.user_id = %s
                  AND bs.stock_count > 0
                  AND (bs.expiration_date IS NULL OR bs.expiration_date > CURDATE())
                ORDER BY m.med_name
                """,
                (vet_id,),
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("available_vaccines error: %s", exc)
        return error("Failed to fetch available vaccines", 500)


@bp.route("/recommendations", methods=["GET"])
@require_auth
def vaccine_recommendations():
    try:
        query = request.args.get("q", "").strip()
        if not query:
            return error("q query parameter is required", 400)

        like_term = f"%{query}%"
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT m.barcode_no, m.med_name AS vaccine_name, v.vac_type, v.side_effect, m.description
                FROM Vaccine v
                JOIN Medicine m ON m.barcode_no = v.barcode_no
                WHERE m.description LIKE %s
                   OR m.med_name LIKE %s
                   OR v.vac_type LIKE %s
                ORDER BY m.med_name
                """,
                (like_term, like_term, like_term),
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("vaccine_recommendations error: %s", exc)
        return error("Failed to fetch vaccine recommendations", 500)


@bp.route("/<int:vac_id>", methods=["GET"])
@require_auth
def get_vaccination(vac_id):
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT vac.vac_id, vac.vac_date, vac.next_due_date, vac.pet_id,
                       p.name AS pet_name, p.breed,
                       vac.vet_id, vet_user.full_name AS vet_name,
                       vet.specialization, br.branch_id, br.name AS branch_name,
                       vac.barcode_no, m.med_name AS vaccine_name,
                       v.vac_type, v.side_effect
                FROM Vaccination vac
                JOIN Pet p ON p.pet_id = vac.pet_id
                JOIN Veterinarian vet ON vet.user_id = vac.vet_id
                JOIN User vet_user ON vet_user.user_id = vet.user_id
                JOIN Branch br ON br.branch_id = vet.branch_id
                JOIN Vaccine v ON v.barcode_no = vac.barcode_no
                JOIN Medicine m ON m.barcode_no = v.barcode_no
                WHERE vac.vac_id = %s
                """,
                (vac_id,),
            )
            row = cur.fetchone()
        if not row:
            return error("Vaccination record not found", 404)
        return success(row)
    except Exception as exc:
        logger.error("get_vaccination error: %s", exc)
        return error("Failed to fetch vaccination record", 500)


@bp.route("/pet/<int:pet_id>/vaccine/<barcode_no>/latest", methods=["GET"])
@require_auth
def latest_pet_vaccine_record(pet_id, barcode_no):
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT vac.vac_id, vac.vac_date, vac.next_due_date,
                       vac.barcode_no, m.med_name AS vaccine_name,
                       DATEDIFF(vac.next_due_date, CURDATE()) AS days_until_due
                FROM Vaccination vac
                JOIN Vaccine v ON v.barcode_no = vac.barcode_no
                JOIN Medicine m ON m.barcode_no = v.barcode_no
                WHERE vac.pet_id = %s AND vac.barcode_no = %s
                ORDER BY vac.vac_date DESC
                LIMIT 1
                """,
                (pet_id, barcode_no),
            )
            row = cur.fetchone()
        if not row:
            return success(None, "No vaccination history found for this pet/vaccine")
        return success(row)
    except Exception as exc:
        logger.error("latest_pet_vaccine_record error: %s", exc)
        return error("Failed to fetch latest pet vaccine record", 500)


@bp.route("/recommended/<int:pet_id>", methods=["GET"])
@require_auth
def recommended_vaccination(pet_id):
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT vac.vac_id, vac.barcode_no, m.med_name AS vaccine_name,
                       vac.next_due_date, vac.vet_id AS recommended_vet_id,
                       vet_user.full_name AS recommended_vet_name,
                       vet.specialization, br.branch_id, br.name AS branch_name,
                       DATEDIFF(vac.next_due_date, CURDATE()) AS days_until_due
                FROM Vaccination vac
                JOIN Vaccine v ON v.barcode_no = vac.barcode_no
                JOIN Medicine m ON m.barcode_no = v.barcode_no
                JOIN Veterinarian vet ON vet.user_id = vac.vet_id
                JOIN User vet_user ON vet_user.user_id = vet.user_id
                JOIN Branch br ON br.branch_id = vet.branch_id
                WHERE vac.pet_id = %s
                  AND vac.next_due_date IS NOT NULL
                  AND vac.next_due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                ORDER BY vac.next_due_date ASC
                LIMIT 1
                """,
                (pet_id,),
            )
            row = cur.fetchone()
        if not row:
            return success(None, "No due-soon or overdue recommendation found")
        return success(row)
    except Exception as exc:
        logger.error("recommended_vaccination error: %s", exc)
        return error("Failed to fetch recommended vaccination", 500)


@bp.route("/availability", methods=["GET"])
@require_auth
def check_vaccine_availability():
    try:
        vet_id = request.args.get("vet_id")
        barcode_no = request.args.get("barcode_no")
        on_date = request.args.get("date")
        if not vet_id or not barcode_no:
            return error("vet_id and barcode_no are required", 400)
        if on_date and not valid_date(on_date):
            return error("date must be YYYY-MM-DD", 400)
        check_date = on_date or __import__("datetime").date.today().isoformat()

        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT bs.stock_count, bs.batch_number, bs.expiration_date
                FROM BranchStock bs
                JOIN Veterinarian v ON v.branch_id = bs.branch_id
                WHERE v.user_id = %s
                  AND bs.barcode_no = %s
                  AND bs.stock_count > 0
                  AND (bs.expiration_date IS NULL OR bs.expiration_date > %s)
                """,
                (vet_id, barcode_no, check_date),
            )
            row = cur.fetchone()
        return success(
            {
                "available": bool(row),
                "stock": row["stock_count"] if row else 0,
                "batch_number": row["batch_number"] if row else None,
                "expiration_date": row["expiration_date"] if row else None,
            }
        )
    except Exception as exc:
        logger.error("check_vaccine_availability error: %s", exc)
        return error("Failed to check vaccine availability", 500)


@bp.route("/upcoming-appointments/<int:pet_id>", methods=["GET"])
@require_auth
def upcoming_vaccination_appointments(pet_id):
    try:
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT a.appointment_id, a.date_time, a.status,
                       vet_user.full_name AS vet_name,
                       br.name AS branch_name,
                       vs.vaccine_name AS expected_vaccine,
                       vs.vaccination_status
                FROM Appointment a
                JOIN Veterinarian v ON v.user_id = a.vet_id
                JOIN User vet_user ON vet_user.user_id = v.user_id
                JOIN Branch br ON br.branch_id = v.branch_id
                LEFT JOIN (
                    SELECT vs1.pet_id, vs1.vaccine_name, vs1.vaccination_status, vs1.next_due_date
                    FROM VaccinationStatus vs1
                    JOIN (
                        SELECT pet_id, MIN(next_due_date) AS nearest_due_date
                        FROM VaccinationStatus
                        WHERE vaccination_status IN ('Overdue', 'Due Soon')
                        GROUP BY pet_id
                    ) nearest
                      ON nearest.pet_id = vs1.pet_id
                     AND nearest.nearest_due_date = vs1.next_due_date
                    WHERE vs1.vaccination_status IN ('Overdue', 'Due Soon')
                ) vs ON vs.pet_id = a.pet_id
                WHERE a.pet_id = %s
                  AND a.date_time >= CURRENT_TIMESTAMP
                  AND a.status = 'Scheduled'
                ORDER BY a.date_time ASC
                """,
                (pet_id,),
            )
            rows = cur.fetchall()
        return success(rows)
    except Exception as exc:
        logger.error("upcoming_vaccination_appointments error: %s", exc)
        return error("Failed to fetch upcoming vaccination appointments", 500)


@bp.route("/overdue-summary", methods=["GET"])
@require_auth
def overdue_summary():
    try:
        branch_id = request.args.get("branch_id") or g.user.get("branch_id")
        if not branch_id:
            return error("branch_id is required", 400)
        threshold_days = request.args.get("threshold_days")
        if threshold_days is not None:
            try:
                threshold_days = int(threshold_days)
                if threshold_days < 0:
                    return error("threshold_days must be >= 0", 400)
            except (TypeError, ValueError):
                return error("threshold_days must be an integer", 400)
        page, per_page = parse_pagination(request.args)

        with DBContext() as (conn, cur):
            list_query = """
                SELECT pet_id, pet_name, breed, owner_name, owner_email, owner_phone,
                       vaccine_name, days_overdue,
                       CASE
                         WHEN days_overdue > 90 THEN 'Critical'
                         WHEN days_overdue > 30 THEN 'High Priority'
                         ELSE 'Moderate'
                       END AS priority_level
                FROM OverdueVaccinations
                WHERE branch_id = %s
            """
            list_params = [branch_id]
            if threshold_days is not None:
                list_query += " AND days_overdue > %s"
                list_params.append(threshold_days)
            list_query += " ORDER BY days_overdue DESC"
            cur.execute(
                list_query,
                tuple(list_params),
            )
            rows = cur.fetchall()

            count_query = """
                SELECT COUNT(*) AS total_overdue,
                       SUM(CASE WHEN days_overdue > 90 THEN 1 ELSE 0 END) AS critical_count,
                       SUM(CASE WHEN days_overdue > 30 AND days_overdue <= 90 THEN 1 ELSE 0 END) AS high_priority_count,
                       SUM(CASE WHEN days_overdue <= 30 THEN 1 ELSE 0 END) AS moderate_count
                FROM OverdueVaccinations
                WHERE branch_id = %s
            """
            count_params = [branch_id]
            if threshold_days is not None:
                count_query += " AND days_overdue > %s"
                count_params.append(threshold_days)
            cur.execute(
                count_query,
                tuple(count_params),
            )
            counts = cur.fetchone()

        return success(
            {
                "counts": counts,
                "threshold_days": threshold_days,
                "overdue": paginate(rows, page, per_page),
            }
        )
    except Exception as exc:
        logger.error("overdue_summary error: %s", exc)
        return error("Failed to fetch overdue summary", 500)
