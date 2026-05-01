import logging
from flask import Blueprint, request
from models.medicine import BranchStockModel, MedicineModel
from services.inventory_service import get_low_stock
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_date, parse_pagination
from utils.pagination import paginate

logger = logging.getLogger(__name__)
bp = Blueprint("inventory", __name__, url_prefix="/inventory")


@bp.route("/medicines", methods=["GET"])
@require_auth
def list_medicines():
    try:
        medicines = MedicineModel.list_all()
        return success(medicines)
    except Exception as exc:
        logger.error("list_medicines error: %s", exc)
        return error("Failed to fetch medicines", 500)


@bp.route("/<int:branch_id>", methods=["GET"])
@require_auth
def list_stock(branch_id):
    try:
        name_filter = request.args.get("name")
        type_filter = request.args.get("type")
        page, per_page = parse_pagination(request.args)
        stock = BranchStockModel.list_by_branch(branch_id, name_filter=name_filter, type_filter=type_filter)
        return success(paginate(stock, page, per_page))
    except Exception as exc:
        logger.error("list_stock error: %s", exc)
        return error("Failed to fetch inventory", 500)


@bp.route("/<int:branch_id>", methods=["POST"])
@require_role("manager")
def add_stock(branch_id):
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["barcode_no", "stock_count"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    if data.get("expiration_date") and not valid_date(data["expiration_date"]):
        return error("expiration_date must be YYYY-MM-DD", 400)

    try:
        BranchStockModel.upsert(
            branch_id,
            data["barcode_no"],
            data["stock_count"],
            data.get("min_threshold", 10),
            data.get("batch_number"),
            data.get("expiration_date"),
        )
        return success(None, "Stock updated successfully")
    except Exception as exc:
        logger.error("add_stock error: %s", exc)
        return error("Failed to update stock", 500)


@bp.route("/low-stock/<int:branch_id>", methods=["GET"])
@require_auth
def low_stock(branch_id):
    try:
        alerts = get_low_stock(branch_id)
        return success(alerts)
    except Exception as exc:
        logger.error("low_stock error: %s", exc)
        return error("Failed to fetch low stock alerts", 500)


@bp.route("/<int:branch_id>/<barcode_no>/threshold", methods=["PUT"])
@require_role("manager")
def update_threshold(branch_id, barcode_no):
    data = request.get_json(silent=True) or {}
    if "min_threshold" not in data:
        return error("min_threshold is required", 400)
    try:
        BranchStockModel.update_threshold(branch_id, barcode_no, data["min_threshold"])
        return success(None, "Threshold updated")
    except Exception as exc:
        logger.error("update_threshold error: %s", exc)
        return error("Failed to update threshold", 500)
