import logging
from flask import Blueprint, request, g
from models.vaccination import VaccinationModel
from services.vaccination_service import get_vaccination_status, get_overdue, get_analytics
from services.inventory_service import deduct_stock
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_date

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
        from database.connection import DBContext
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
