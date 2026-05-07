import logging
from flask import Blueprint, request, g
from models.branch import BoardingUnitModel
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_date

logger = logging.getLogger(__name__)
bp = Blueprint("boarding", __name__, url_prefix="/boarding")


@bp.route("", methods=["GET"])
@require_auth
def list_boarding():
    """List all units for a branch (manager) or available units (owner)."""
    try:
        branch_id = request.args.get("branch_id")
        size = request.args.get("size")
        available_only = request.args.get("available") == "true"
        check_in = request.args.get("check_in")
        check_out = request.args.get("check_out")

        if not branch_id:
            return error("branch_id is required", 400)

        if available_only:
            units = BoardingUnitModel.list_available(int(branch_id), size, check_in, check_out)
        else:
            units = BoardingUnitModel.list_by_branch(int(branch_id))

        result = []
        for u in units:
            status = "available"
            if u["is_occupied"] and u.get("pet_id"):
                status = "occupied"
            elif u["is_occupied"] and not u.get("pet_id"):
                status = "maintenance"

            result.append({
                "id": u["boarding_unit_id"],
                "size": u["size"],
                "status": status,
                "branch_id": u["branch_id"],
                "branch_name": u.get("branch_name", ""),
                "pet_id": u.get("pet_id"),
                "pet_name": u.get("pet_name"),
                "owner_name": u.get("owner_name"),
                "check_in_date": str(u["check_in_date"]) if u.get("check_in_date") else None,
                "check_out_date": str(u["check_out_date"]) if u.get("check_out_date") else None,
                "feeding_instructions": u.get("feeding_instructions"),
            })

        return success(result)
    except Exception as exc:
        logger.error("list_boarding error: %s", exc)
        return error("Failed to fetch boarding units", 500)


@bp.route("/my-reservations", methods=["GET"])
@require_role("pet_owner")
def my_reservations():
    try:
        owner_id = g.user["user_id"]
        units = BoardingUnitModel.list_by_owner(owner_id)
        result = [{
            "id": u["boarding_unit_id"],
            "size": u["size"],
            "branch_name": u.get("branch_name", ""),
            "pet_name": u.get("pet_name", ""),
            "check_in_date": str(u["check_in_date"]) if u.get("check_in_date") else None,
            "check_out_date": str(u["check_out_date"]) if u.get("check_out_date") else None,
            "feeding_instructions": u.get("feeding_instructions"),
        } for u in units]
        return success(result)
    except Exception as exc:
        logger.error("my_reservations error: %s", exc)
        return error("Failed to fetch reservations", 500)


@bp.route("/my-past-stays", methods=["GET"])
@require_role("pet_owner")
def my_past_stays():
    try:
        owner_id = g.user["user_id"]
        rows = BoardingUnitModel.past_stays_by_owner(owner_id)
        result = [{
            "history_id": r["history_id"],
            "boarding_unit_id": r["boarding_unit_id"],
            "size": r["size"],
            "branch_name": r.get("branch_name", ""),
            "pet_name": r.get("pet_name", ""),
            "check_in_date": str(r["check_in_date"]) if r.get("check_in_date") else None,
            "check_out_date": str(r["check_out_date"]) if r.get("check_out_date") else None,
            "feeding_instructions": r.get("feeding_instructions"),
            "checked_out_at": str(r["checked_out_at"]) if r.get("checked_out_at") else None,
        } for r in rows]
        return success(result)
    except Exception as exc:
        logger.error("my_past_stays error: %s", exc)
        return error("Failed to fetch past stays", 500)


@bp.route("/book", methods=["POST"])
@require_role("pet_owner")
def book_unit():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["boarding_unit_id", "pet_id", "check_in_date", "check_out_date"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    if not valid_date(data["check_in_date"]) or not valid_date(data["check_out_date"]):
        return error("Dates must be YYYY-MM-DD", 400)

    if data["check_in_date"] >= data["check_out_date"]:
        return error("check_out_date must be after check_in_date", 400)

    try:
        if BoardingUnitModel.pet_has_overlapping_booking(int(data["pet_id"]), data["check_in_date"], data["check_out_date"]):
            return error("This pet already has a booking for those dates", 409)

        booked = BoardingUnitModel.book(
            boarding_unit_id=int(data["boarding_unit_id"]),
            pet_id=int(data["pet_id"]),
            check_in_date=data["check_in_date"],
            check_out_date=data["check_out_date"],
            feeding_instructions=data.get("feeding_instructions"),
        )
        if not booked:
            return error("Unit is no longer available", 409)
        return success({"boarding_unit_id": data["boarding_unit_id"]}, "Booking confirmed", 201)
    except Exception as exc:
        logger.error("book_unit error: %s", exc)
        return error("Failed to book unit", 500)


@bp.route("/<int:boarding_unit_id>/checkout", methods=["PUT"])
@require_role("manager")
def checkout_unit(boarding_unit_id):
    try:
        done = BoardingUnitModel.checkout(boarding_unit_id)
        if not done:
            return error("Unit not found", 404)
        return success({"boarding_unit_id": boarding_unit_id}, "Checked out")
    except Exception as exc:
        logger.error("checkout_unit error: %s", exc)
        return error("Failed to checkout", 500)


@bp.route("/<int:boarding_unit_id>/maintenance", methods=["PUT"])
@require_role("manager")
def toggle_maintenance(boarding_unit_id):
    data = request.get_json(silent=True) or {}
    under_maintenance = bool(data.get("under_maintenance", True))
    try:
        done = BoardingUnitModel.set_maintenance(boarding_unit_id, under_maintenance)
        if not done:
            return error("Unit not found or already occupied by a pet", 400)
        msg = "Marked as under maintenance" if under_maintenance else "Removed from maintenance"
        return success({"boarding_unit_id": boarding_unit_id}, msg)
    except Exception as exc:
        logger.error("toggle_maintenance error: %s", exc)
        return error("Failed to update maintenance status", 500)
