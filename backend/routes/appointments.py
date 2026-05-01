import logging
from flask import Blueprint, request, g
from services.appointment_service import book_appointment
from models.appointment import AppointmentModel
from middleware.auth_middleware import require_auth
from utils.response import success, error
from utils.validators import require_fields, valid_datetime, valid_enum, parse_pagination
from utils.pagination import paginate

logger = logging.getLogger(__name__)
bp = Blueprint("appointments", __name__, url_prefix="/appointments")


@bp.route("", methods=["POST"])
@require_auth
def create_appointment():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["date_time", "pet_id", "vet_id"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    if not valid_datetime(data["date_time"]):
        return error("date_time must be YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD HH:MM:SS", 400)

    try:
        result = book_appointment(data["date_time"], data["pet_id"], data["vet_id"])
        return success(result, "Appointment booked successfully", 201)
    except ValueError as exc:
        return error(str(exc), 409)
    except Exception as exc:
        logger.error("create_appointment error: %s", exc)
        return error("Failed to book appointment", 500)


@bp.route("", methods=["GET"])
@require_auth
def list_appointments():
    try:
        owner_id = request.args.get("owner_id")
        page, per_page = parse_pagination(request.args)

        if not owner_id:
            owner_id = g.user.get("user_id") if g.user.get("role") == "pet_owner" else None

        if not owner_id:
            return error("owner_id is required", 400)

        appointments = AppointmentModel.list_by_owner(owner_id)
        return success(paginate(appointments, page, per_page))
    except Exception as exc:
        logger.error("list_appointments error: %s", exc)
        return error("Failed to fetch appointments", 500)


@bp.route("/vet", methods=["GET"])
@require_auth
def vet_appointments():
    try:
        vet_id = request.args.get("vet_id") or g.user.get("user_id")
        date = request.args.get("date")
        if not date:
            return error("date parameter required (YYYY-MM-DD)", 400)
        appointments = AppointmentModel.list_by_vet_date(vet_id, date)
        return success(appointments)
    except Exception as exc:
        logger.error("vet_appointments error: %s", exc)
        return error("Failed to fetch vet appointments", 500)


@bp.route("/<int:appointment_id>", methods=["GET"])
@require_auth
def get_appointment(appointment_id):
    try:
        appt = AppointmentModel.find_by_id(appointment_id)
        if not appt:
            return error("Appointment not found", 404)
        return success(appt)
    except Exception as exc:
        logger.error("get_appointment error: %s", exc)
        return error("Failed to fetch appointment", 500)


@bp.route("/<int:appointment_id>/status", methods=["PUT"])
@require_auth
def update_status(appointment_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if not valid_enum(status, ["Scheduled", "Completed", "Cancelled"]):
        return error("status must be Scheduled, Completed, or Cancelled", 400)
    try:
        appt = AppointmentModel.find_by_id(appointment_id)
        if not appt:
            return error("Appointment not found", 404)
        AppointmentModel.update_status(appointment_id, status)
        return success({"appointment_id": appointment_id, "status": status}, "Status updated")
    except Exception as exc:
        logger.error("update_status error: %s", exc)
        return error("Failed to update appointment status", 500)
