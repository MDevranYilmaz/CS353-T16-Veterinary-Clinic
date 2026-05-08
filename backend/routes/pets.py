import logging
from flask import Blueprint, request, g
from models.pet import PetModel, MedicalHistoryModel
from models.prescription import PrescriptionModel
from models.vaccination import VaccinationModel
from models.referral import ReferralModel
from middleware.auth_middleware import require_auth
from utils.response import success, error
from utils.validators import require_fields, valid_date, parse_pagination
from utils.pagination import paginate

logger = logging.getLogger(__name__)
bp = Blueprint("pets", __name__, url_prefix="/pets")


@bp.route("", methods=["GET"])
@require_auth
def list_pets():
    try:
        owner_id = request.args.get("owner_id") or (
            g.user["user_id"] if g.user.get("role") == "pet_owner" else None
        )
        if not owner_id:
            return error("owner_id is required", 400)
        page, per_page = parse_pagination(request.args)
        pets = PetModel.list_by_owner(owner_id)
        return success(paginate(pets, page, per_page))
    except Exception as exc:
        logger.error("list_pets error: %s", exc)
        return error("Failed to fetch pets", 500)


@bp.route("", methods=["POST"])
@require_auth
def create_pet():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["name", "owner_id", "gender"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    if data.get("birth_date") and not valid_date(data["birth_date"]):
        return error("birth_date must be YYYY-MM-DD", 400)

    if data["gender"] not in ["M", "F"]:
        return error("gender must be 'M' or 'F'", 400)

    try:
        pet_id = PetModel.create(
            data["name"],
            data.get("breed"),
            data.get("birth_date"),
            data.get("allergies"),
            data["owner_id"],
            data.get("species"),
            data.get("gender"),
        )
        return success({"pet_id": pet_id}, "Pet registered successfully", 201)
    except Exception as exc:
        logger.error("create_pet error: %s", exc)
        return error("Failed to register pet", 500)


@bp.route("/<int:pet_id>", methods=["GET"])
@require_auth
def get_pet(pet_id):
    try:
        pet = PetModel.find_by_id(pet_id)
        if not pet:
            return error("Pet not found", 404)
        return success(pet)
    except Exception as exc:
        logger.error("get_pet error: %s", exc)
        return error("Failed to fetch pet", 500)


@bp.route("/<int:pet_id>", methods=["DELETE"])
@require_auth
def delete_pet(pet_id):
    try:
        if g.user.get("role") != "pet_owner":
            return error("Only pet owners can remove pets", 403)
        owner_id = g.user["user_id"]
        deleted = PetModel.soft_delete(pet_id, owner_id)
        if not deleted:
            return error("Pet not found or you do not own this pet", 404)
        return success({}, "Pet removed from your profile")
    except Exception as exc:
        logger.error("delete_pet error: %s", exc)
        return error("Failed to remove pet", 500)


@bp.route("/<int:pet_id>/medical-history", methods=["GET"])
@require_auth
def pet_medical_history(pet_id):
    try:
        page, per_page = parse_pagination(request.args)
        records = MedicalHistoryModel.list_by_pet(pet_id)
        return success(paginate(records, page, per_page))
    except Exception as exc:
        logger.error("pet_medical_history error: %s", exc)
        return error("Failed to fetch medical history", 500)


@bp.route("/<int:pet_id>/prescriptions", methods=["GET"])
@require_auth
def pet_prescriptions(pet_id):
    try:
        page, per_page = parse_pagination(request.args)
        prescriptions = PrescriptionModel.list_by_pet(pet_id)
        return success(paginate(prescriptions, page, per_page))
    except Exception as exc:
        logger.error("pet_prescriptions error: %s", exc)
        return error("Failed to fetch prescriptions", 500)


@bp.route("/<int:pet_id>/vaccinations", methods=["GET"])
@require_auth
def pet_vaccinations(pet_id):
    try:
        page, per_page = parse_pagination(request.args)
        vaccinations = VaccinationModel.list_by_pet(pet_id)
        return success(paginate(vaccinations, page, per_page))
    except Exception as exc:
        logger.error("pet_vaccinations error: %s", exc)
        return error("Failed to fetch vaccinations", 500)


@bp.route("/<int:pet_id>/referrals", methods=["GET"])
@require_auth
def pet_referrals(pet_id):
    try:
        page, per_page = parse_pagination(request.args)
        referrals = ReferralModel.list_filtered(pet_id=pet_id)
        return success(paginate(referrals, page, per_page))
    except Exception as exc:
        logger.error("pet_referrals error: %s", exc)
        return error("Failed to fetch referrals", 500)
