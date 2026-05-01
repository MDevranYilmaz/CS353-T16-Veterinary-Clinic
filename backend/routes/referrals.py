import logging
from flask import Blueprint, request, g
from models.referral import ReferralModel
from services.referral_service import create_referral, update_status, list_specialists
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_date, valid_enum, parse_pagination
from utils.pagination import paginate

logger = logging.getLogger(__name__)
bp = Blueprint("referrals", __name__, url_prefix="/referrals")


@bp.route("", methods=["GET"])
@require_auth
def list_referrals():
    try:
        vet_id = request.args.get("vet_id")
        pet_id = request.args.get("pet_id")
        page, per_page = parse_pagination(request.args)
        referrals = ReferralModel.list_filtered(vet_id=vet_id, pet_id=pet_id)
        return success(paginate(referrals, page, per_page))
    except Exception as exc:
        logger.error("list_referrals error: %s", exc)
        return error("Failed to fetch referrals", 500)


@bp.route("", methods=["POST"])
@require_role("veterinarian")
def create_referral_route():
    import datetime
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["reason", "receiver_vet_id", "pet_id"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    referral_date = data.get("referral_date") or datetime.date.today().isoformat()
    if not valid_date(referral_date):
        return error("referral_date must be YYYY-MM-DD", 400)

    try:
        referral_id = create_referral(
            data["reason"],
            referral_date,
            g.user["user_id"],
            data["receiver_vet_id"],
            data["pet_id"],
        )
        return success({"referral_id": referral_id}, "Referral created", 201)
    except ValueError as exc:
        return error(str(exc), 400)
    except Exception as exc:
        logger.error("create_referral error: %s", exc)
        return error("Failed to create referral", 500)


@bp.route("/<int:referral_id>/status", methods=["PUT"])
@require_role("veterinarian")
def update_referral_status(referral_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if not valid_enum(status, ["Accepted", "Rejected"]):
        return error("status must be Accepted or Rejected", 400)
    try:
        referral = ReferralModel.find_by_id(referral_id)
        if not referral:
            return error("Referral not found", 404)
        update_status(referral_id, status)
        return success({"referral_id": referral_id, "status": status}, "Referral status updated")
    except ValueError as exc:
        return error(str(exc), 400)
    except Exception as exc:
        logger.error("update_referral_status error: %s", exc)
        return error("Failed to update referral status", 500)
