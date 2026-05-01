import logging
from flask import Blueprint, request, g
from models.medicine import WasteLogModel, BranchStockModel
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_date, parse_pagination
from utils.pagination import paginate

logger = logging.getLogger(__name__)
bp = Blueprint("waste_logs", __name__, url_prefix="/waste-logs")


@bp.route("/<int:branch_id>", methods=["GET"])
@require_auth
def list_waste_logs(branch_id):
    try:
        from_date = request.args.get("from")
        to_date = request.args.get("to")
        page, per_page = parse_pagination(request.args)
        logs = WasteLogModel.list_by_branch(branch_id, from_date=from_date, to_date=to_date)
        return success(paginate(logs, page, per_page))
    except Exception as exc:
        logger.error("list_waste_logs error: %s", exc)
        return error("Failed to fetch waste logs", 500)


@bp.route("", methods=["POST"])
@require_role("manager")
def log_waste():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["quantity", "waste_date", "barcode_no"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    if not valid_date(data["waste_date"]):
        return error("waste_date must be YYYY-MM-DD", 400)

    try:
        from database.connection import DBContext
        with DBContext() as (conn, cur):
            cur.execute("SELECT branch_id FROM Clinic_Manager WHERE user_id = %s", (g.user["user_id"],))
            row = cur.fetchone()
            branch_id = row["branch_id"] if row else None

        log_id = WasteLogModel.create(
            data["quantity"],
            data["waste_date"],
            data.get("reason"),
            g.user["user_id"],
            data["barcode_no"],
        )

        if branch_id:
            BranchStockModel.deduct(branch_id, data["barcode_no"], data["quantity"])

        return success({"log_id": log_id}, "Waste logged and stock deducted", 201)
    except Exception as exc:
        logger.error("log_waste error: %s", exc)
        return error("Failed to log waste", 500)
