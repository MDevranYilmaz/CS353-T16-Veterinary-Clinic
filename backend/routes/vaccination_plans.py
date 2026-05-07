import logging
from flask import Blueprint, request, g
from services.vaccination_plan_service import (
    get_applicable_plans,
    get_pet_schedule,
    get_overdue_for_plan,
    get_upcoming_for_plan,
)
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields

logger = logging.getLogger(__name__)
bp = Blueprint("vaccination_plans", __name__, url_prefix="/vaccination-plans")


# ============================================================================
# Plan Management (DISABLED - using per-pet vaccination plans instead)
# ============================================================================
# These routes for managing predefined vaccination plan templates are disabled
# Vets now define vaccination schedules directly for each pet via PetVaccinationPlan

# @bp.route("", methods=["POST"])
# @require_role("veterinarian")
# def create_plan():
#     """Create a new vaccination plan"""
#     ...

# @bp.route("/<int:plan_id>", methods=["GET"])
# @require_auth
# def get_plan(plan_id: int):
#     """Get a specific vaccination plan with items"""
#     ...

# @bp.route("", methods=["GET"])
# @require_auth
# def list_plans():
#     """List vaccination plans by species"""
#     ...

# @bp.route("/<int:plan_id>", methods=["PUT"])
# @require_role("veterinarian")
# def update_plan(plan_id: int):
#     """Update a vaccination plan"""
#     ...

# @bp.route("/<int:plan_id>", methods=["DELETE"])
# @require_role("veterinarian")
# def delete_plan(plan_id: int):
#     """Delete a vaccination plan"""
#     ...

# ============================================================================
# Plan Items (DISABLED - using per-pet vaccination plans instead)
# ============================================================================

# @bp.route("/<int:plan_id>/items", methods=["POST"])
# @require_role("veterinarian")
# def add_plan_item(plan_id: int):
#     """Add a vaccine to a plan"""
#     ...

# @bp.route("/items/<int:item_id>", methods=["DELETE"])
# @require_role("veterinarian")
# def remove_plan_item(item_id: int):
#     """Remove a vaccine from a plan"""
#     ...



# ============================================================================
# Apply Plans to Pets (Veterinarian only)
# ============================================================================


@bp.route("/pets/<int:pet_id>/apply", methods=["POST"])
@require_role("veterinarian")
def apply_plan_to_pet(pet_id: int):
    """Apply a vaccine to a pet (assign specific vaccine with schedule)"""
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["plan_id"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    try:
        vaccine_barcode = str(data["plan_id"])  # barcode_no is the plan_id
        age_weeks = int(data.get("age_weeks", 0))
        sequence_number = data.get("sequence_number")
        repeat_every_months = data.get("repeat_every_months")
        gender_applicable = data.get("gender_applicable")

        from database.connection import DBContext
        with DBContext() as (conn, cur):
            # Verify vaccine exists
            cur.execute("SELECT barcode_no FROM Vaccine WHERE barcode_no = %s", (vaccine_barcode,))
            if not cur.fetchone():
                return error("Vaccine not found", 404)

            # Create pet vaccination plan assignment
            cur.execute("""
                INSERT INTO PetVaccinationPlan 
                (pet_id, vaccine_barcode, age_weeks, sequence_number, repeat_every_months, gender_applicable, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (pet_id, vaccine_barcode, age_weeks, sequence_number, repeat_every_months, gender_applicable, g.user["user_id"]))

        return success(
            {"pet_id": pet_id, "vaccine_barcode": vaccine_barcode}, "Vaccine assigned to pet"
        )
    except Exception as exc:
        logger.error("apply_plan_to_pet error: %s", exc)
        return error("Failed to assign vaccine", 500)


@bp.route("/pets/<int:pet_id>/remove", methods=["POST"])
@require_role("veterinarian")
def remove_plan_from_pet(pet_id: int):
    """Remove a vaccine assignment from a pet"""
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["plan_id"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    try:
        vaccine_barcode = str(data["plan_id"])
        from database.connection import DBContext
        with DBContext() as (conn, cur):
            cur.execute(
                "DELETE FROM PetVaccinationPlan WHERE pet_id = %s AND vaccine_barcode = %s",
                (pet_id, vaccine_barcode)
            )

        return success({}, "Vaccine assignment removed")
    except Exception as exc:
        logger.error("remove_plan_from_pet error: %s", exc)
        return error("Failed to remove vaccine assignment", 500)


# ============================================================================
# Get Pet Vaccination Schedule & Status
# ============================================================================


@bp.route("/pets/<int:pet_id>/schedule", methods=["GET"])
@require_auth
def get_schedule(pet_id: int):
    """Get the vaccination schedule for a pet"""
    try:
        schedule_data = get_pet_schedule(pet_id)
        return success({"schedule": schedule_data or []})
    except Exception as exc:
        logger.error("get_schedule error: %s", exc)
        return error("Failed to fetch schedule", 500)


@bp.route("/pets/<int:pet_id>/applicable", methods=["GET"])
@require_auth
def get_applicable(pet_id: int):
    """Get available vaccines that can be assigned to this pet"""
    from database.connection import DBContext

    try:
        # Get all vaccines and return them as applicable options
        with DBContext() as (conn, cur):
            # Verify pet exists
            cur.execute("SELECT species, breed FROM Pet WHERE pet_id = %s", (pet_id,))
            pet_row = cur.fetchone()

            if not pet_row:
                return error("Pet not found", 404)

            # Return all vaccines as options to assign to this specific pet
            cur.execute("""
                SELECT v.barcode_no as plan_id, m.med_name as plan_name, v.vac_type, m.unit_cost
                FROM Vaccine v
                JOIN Medicine m ON m.barcode_no = v.barcode_no
                ORDER BY m.med_name
            """)
            vaccines = cur.fetchall()

        return success({"plans": vaccines or []})
    except Exception as exc:
        logger.error("get_applicable error: %s", exc)
        return error("Failed to fetch applicable plans", 500)


@bp.route("/pets/<int:pet_id>/overdue", methods=["GET"])
@require_auth
def get_overdue(pet_id: int):
    """Get overdue vaccinations for a pet"""
    try:
        overdue = get_overdue_for_plan(pet_id)
        return success({"overdue": overdue})
    except Exception as exc:
        logger.error("get_overdue error: %s", exc)
        return error("Failed to fetch overdue vaccinations", 500)


@bp.route("/pets/<int:pet_id>/upcoming", methods=["GET"])
@require_auth
def get_upcoming(pet_id: int):
    """Get upcoming vaccinations for a pet"""
    days_ahead = request.args.get("days", 30, type=int)

    try:
        upcoming = get_upcoming_for_plan(pet_id, days_ahead)
        return success({"upcoming": upcoming})
    except Exception as exc:
        logger.error("get_upcoming error: %s", exc)
        return error("Failed to fetch upcoming vaccinations", 500)
