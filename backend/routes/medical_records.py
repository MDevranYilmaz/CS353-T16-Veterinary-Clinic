import logging
from flask import Blueprint, request
from models.pet import MedicalHistoryModel
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_datetime, parse_pagination
from utils.pagination import paginate

logger = logging.getLogger(__name__)
bp = Blueprint("medical_records", __name__, url_prefix="/medical-records")


@bp.route("", methods=["POST"])
@require_role("veterinarian", "manager")
def create_record():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["pet_id", "date_time", "diagnosis"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    if not valid_datetime(data["date_time"]):
        return error("date_time must be YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD HH:MM:SS", 400)

    try:
        MedicalHistoryModel.create(
            data["pet_id"],
            data["date_time"],
            data.get("diagnosis"),
            data.get("symptoms"),
            data.get("treatments"),
            data.get("notes"),
        )
        return success(None, "Medical record created", 201)
    except Exception as exc:
        logger.error("create_record error: %s", exc)
        return error("Failed to create medical record", 500)


@bp.route("/<int:pet_id>", methods=["GET"])
@require_auth
def list_records(pet_id):
    try:
        page, per_page = parse_pagination(request.args)
        records = MedicalHistoryModel.list_by_pet(pet_id)
        return success(paginate(records, page, per_page))
    except Exception as exc:
        logger.error("list_records error: %s", exc)
        return error("Failed to fetch medical records", 500)
