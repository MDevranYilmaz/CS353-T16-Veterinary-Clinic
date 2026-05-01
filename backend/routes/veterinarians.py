import logging
from flask import Blueprint, request
from models.user import VeterinarianModel
from models.evaluation import EvaluationModel
from services.appointment_service import get_available_slots
from database.connection import DBContext
from utils.response import success, error
from utils.validators import parse_pagination
from utils.pagination import paginate

logger = logging.getLogger(__name__)
bp = Blueprint("veterinarians", __name__, url_prefix="/vets")


@bp.route("", methods=["GET"])
def list_vets():
    try:
        branch_id = request.args.get("branch_id")
        specialization = request.args.get("specialization")
        page, per_page = parse_pagination(request.args)

        vets = VeterinarianModel.list_all(branch_id=branch_id, specialization=specialization)

        # Optional availability filter by date+time
        date_filter = request.args.get("date")
        time_filter = request.args.get("time")
        if date_filter and time_filter:
            dt = f"{date_filter} {time_filter}:00"
            with DBContext() as (conn, cur):
                filtered = []
                for v in vets:
                    cur.execute(
                        "SELECT COUNT(*) AS cnt FROM Appointment WHERE vet_id=%s AND date_time=%s AND status!='Cancelled'",
                        (v["user_id"], dt),
                    )
                    if cur.fetchone()["cnt"] == 0:
                        filtered.append(v)
                vets = filtered

        return success(paginate(vets, page, per_page))
    except Exception as exc:
        logger.error("list_vets error: %s", exc)
        return error("Failed to fetch veterinarians", 500)


@bp.route("/<int:vet_id>", methods=["GET"])
def get_vet(vet_id):
    try:
        vet = VeterinarianModel.find_by_id(vet_id)
        if not vet:
            return error("Veterinarian not found", 404)
        return success(vet)
    except Exception as exc:
        logger.error("get_vet error: %s", exc)
        return error("Failed to fetch veterinarian", 500)


@bp.route("/<int:vet_id>/schedule", methods=["GET"])
def vet_schedule(vet_id):
    try:
        date = request.args.get("date")
        if not date:
            return error("date query parameter required (YYYY-MM-DD)", 400)
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT a.*, p.name AS pet_name, p.breed
                FROM Appointment a
                JOIN Pet p ON p.pet_id = a.pet_id
                WHERE a.vet_id = %s AND DATE(a.date_time) = %s
                ORDER BY a.date_time
                """,
                (vet_id, date),
            )
            appointments = cur.fetchall()
        return success({"date": date, "appointments": appointments})
    except Exception as exc:
        logger.error("vet_schedule error: %s", exc)
        return error("Failed to fetch schedule", 500)


@bp.route("/<int:vet_id>/available-slots", methods=["GET"])
def available_slots(vet_id):
    try:
        date = request.args.get("date")
        if not date:
            return error("date query parameter required (YYYY-MM-DD)", 400)
        slots = get_available_slots(vet_id, date)
        return success({"date": date, "vet_id": vet_id, "available_slots": slots})
    except Exception as exc:
        logger.error("available_slots error: %s", exc)
        return error("Failed to fetch available slots", 500)


@bp.route("/<int:vet_id>/rating", methods=["GET"])
def vet_rating(vet_id):
    try:
        rating = EvaluationModel.avg_rating(vet_id)
        reviews = EvaluationModel.list_by_vet(vet_id, limit=10)
        return success({"rating": rating, "reviews": reviews})
    except Exception as exc:
        logger.error("vet_rating error: %s", exc)
        return error("Failed to fetch rating", 500)


@bp.route("/specialists", methods=["GET"])
def specialists():
    try:
        specialization = request.args.get("specialization", "")
        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT v.user_id, u.full_name, v.specialization, v.branch_id, b.name AS branch_name
                FROM Veterinarian v
                JOIN User u ON u.user_id = v.user_id
                LEFT JOIN Branch b ON b.branch_id = v.branch_id
                WHERE v.specialization LIKE %s
                ORDER BY u.full_name
                """,
                (f"%{specialization}%",),
            )
            vets = cur.fetchall()
        return success(vets)
    except Exception as exc:
        logger.error("specialists error: %s", exc)
        return error("Failed to fetch specialists", 500)
