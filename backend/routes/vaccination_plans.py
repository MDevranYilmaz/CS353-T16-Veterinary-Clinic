import logging
from flask import Blueprint, request, g
from models.vaccination_plan import VaccinationPlanModel
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
# Plan Management (Veterinarian only)
# ============================================================================


@bp.route("", methods=["POST"])
@require_role("veterinarian")
def create_plan():
    """Create a new vaccination plan"""
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["plan_name", "species"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    try:
        plan_id = VaccinationPlanModel.create(
            plan_name=data["plan_name"],
            species=data["species"],
            breed=data.get("breed"),
            description=data.get("description"),
            created_by=g.user["user_id"],
        )

        return success({"plan_id": plan_id}, "Vaccination plan created", 201)
    except Exception as exc:
        logger.error("create_plan error: %s", exc)
        return error("Failed to create vaccination plan", 500)


@bp.route("/<int:plan_id>", methods=["GET"])
@require_auth
def get_plan(plan_id: int):
    """Get a specific vaccination plan with items"""
    try:
        plan = VaccinationPlanModel.find_by_id(plan_id)
        if not plan:
            return error("Plan not found", 404)

        items = VaccinationPlanModel.get_plan_items(plan_id)

        return success({"plan": plan, "items": items})
    except Exception as exc:
        logger.error("get_plan error: %s", exc)
        return error("Failed to fetch plan", 500)


@bp.route("", methods=["GET"])
@require_auth
def list_plans():
    """List vaccination plans by species"""
    species = request.args.get("species")
    breed = request.args.get("breed")

    try:
        if species:
            plans = VaccinationPlanModel.list_by_species_and_breed(species, breed)
        else:
            plans = VaccinationPlanModel.list_all()

        return success({"plans": plans})
    except Exception as exc:
        logger.error("list_plans error: %s", exc)
        return error("Failed to fetch plans", 500)


@bp.route("/<int:plan_id>", methods=["PUT"])
@require_role("veterinarian")
def update_plan(plan_id: int):
    """Update a vaccination plan"""
    data = request.get_json(silent=True) or {}

    try:
        VaccinationPlanModel.update(
            plan_id,
            plan_name=data.get("plan_name"),
            description=data.get("description"),
        )

        return success({"plan_id": plan_id}, "Plan updated")
    except Exception as exc:
        logger.error("update_plan error: %s", exc)
        return error("Failed to update plan", 500)


@bp.route("/<int:plan_id>", methods=["DELETE"])
@require_role("veterinarian")
def delete_plan(plan_id: int):
    """Delete a vaccination plan"""
    try:
        VaccinationPlanModel.delete(plan_id)
        return success({}, "Plan deleted")
    except Exception as exc:
        logger.error("delete_plan error: %s", exc)
        return error("Failed to delete plan", 500)


# ============================================================================
# Plan Items (Veterinarian only)
# ============================================================================


@bp.route("/<int:plan_id>/items", methods=["POST"])
@require_role("veterinarian")
def add_plan_item(plan_id: int):
    """Add a vaccine to a plan"""
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["vaccine_barcode", "age_weeks"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    if data.get("gender_applicable") and data["gender_applicable"] not in ["M", "F"]:
        return error("gender_applicable must be 'M', 'F', or null", 400)

    try:
        item_id = VaccinationPlanModel.add_item(
            plan_id=plan_id,
            vaccine_barcode=data["vaccine_barcode"],
            age_weeks=int(data["age_weeks"]),
            sequence_number=data.get("sequence_number"),
            repeat_every_months=data.get("repeat_every_months"),
            gender_applicable=data.get("gender_applicable"),
            notes=data.get("notes"),
        )

        return success({"item_id": item_id}, "Vaccine added to plan", 201)
    except Exception as exc:
        logger.error("add_plan_item error: %s", exc)
        return error("Failed to add vaccine to plan", 500)


@bp.route("/items/<int:item_id>", methods=["DELETE"])
@require_role("veterinarian")
def remove_plan_item(item_id: int):
    """Remove a vaccine from a plan"""
    try:
        VaccinationPlanModel.delete_item(item_id)
        return success({}, "Item removed from plan")
    except Exception as exc:
        logger.error("remove_plan_item error: %s", exc)
        return error("Failed to remove item", 500)


# ============================================================================
# Apply Plans to Pets (Veterinarian only)
# ============================================================================


@bp.route("/pets/<int:pet_id>/apply", methods=["POST"])
@require_role("veterinarian")
def apply_plan_to_pet(pet_id: int):
    """Apply a vaccination plan to a pet"""
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["plan_id"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    try:
        plan_id = int(data["plan_id"])

        # Verify plan exists
        plan = VaccinationPlanModel.find_by_id(plan_id)
        if not plan:
            return error("Plan not found", 404)

        VaccinationPlanModel.apply_plan_to_pet(pet_id, plan_id, g.user["user_id"])

        return success(
            {"pet_id": pet_id, "plan_id": plan_id}, "Plan applied to pet"
        )
    except Exception as exc:
        logger.error("apply_plan_to_pet error: %s", exc)
        return error("Failed to apply plan", 500)


@bp.route("/pets/<int:pet_id>/remove", methods=["POST"])
@require_role("veterinarian")
def remove_plan_from_pet(pet_id: int):
    """Remove a plan from a pet"""
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["plan_id"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    try:
        plan_id = int(data["plan_id"])
        VaccinationPlanModel.remove_plan_from_pet(pet_id, plan_id)

        return success({}, "Plan removed from pet")
    except Exception as exc:
        logger.error("remove_plan_from_pet error: %s", exc)
        return error("Failed to remove plan", 500)


# ============================================================================
# Get Pet Vaccination Schedule & Status
# ============================================================================


@bp.route("/pets/<int:pet_id>/schedule", methods=["GET"])
@require_auth
def get_schedule(pet_id: int):
    """Get the vaccination schedule for a pet"""
    try:
        schedule_data = get_pet_schedule(pet_id)
        if not schedule_data:
            return success(
                {"plan": None, "schedule": []},
                "No plan assigned to pet",
            )

        return success(schedule_data)
    except Exception as exc:
        logger.error("get_schedule error: %s", exc)
        return error("Failed to fetch schedule", 500)


@bp.route("/pets/<int:pet_id>/applicable", methods=["GET"])
@require_auth
def get_applicable(pet_id: int):
    """Get applicable vaccination plans for a pet"""
    from database.connection import DBContext

    try:
        # Get pet's species and breed
        with DBContext() as (conn, cur):
            cur.execute("SELECT species, breed FROM Pet WHERE pet_id = %s", (pet_id,))
            pet_row = cur.fetchone()

        if not pet_row:
            return error("Pet not found", 404)

        species = pet_row["species"]
        breed = pet_row.get("breed")

        plans = get_applicable_plans(species, breed)

        return success({"plans": plans, "species": species, "breed": breed})
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
