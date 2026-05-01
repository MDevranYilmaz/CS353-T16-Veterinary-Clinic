import logging
from flask import Blueprint, request, g
from models.evaluation import EvaluationModel
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_date, valid_int_range

logger = logging.getLogger(__name__)
bp = Blueprint("evaluations", __name__, url_prefix="/evaluations")


@bp.route("", methods=["POST"])
@require_role("pet_owner")
def create_evaluation():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["points", "date", "vet_id"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    if not valid_int_range(data["points"], 1, 5):
        return error("points must be between 1 and 5", 400)

    if not valid_date(data["date"]):
        return error("date must be YYYY-MM-DD", 400)

    try:
        eval_id = EvaluationModel.create(
            data["points"],
            data["date"],
            data.get("comment"),
            g.user["user_id"],
            data["vet_id"],
            data.get("man_id"),
        )
        return success({"eval_id": eval_id}, "Evaluation submitted", 201)
    except Exception as exc:
        logger.error("create_evaluation error: %s", exc)
        return error("Failed to submit evaluation", 500)


@bp.route("/vet/<int:vet_id>", methods=["GET"])
@require_auth
def vet_evaluations(vet_id):
    try:
        rating = EvaluationModel.avg_rating(vet_id)
        reviews = EvaluationModel.list_by_vet(vet_id, limit=10)
        return success({"rating": rating, "reviews": reviews})
    except Exception as exc:
        logger.error("vet_evaluations error: %s", exc)
        return error("Failed to fetch evaluations", 500)
