import logging
from flask import Blueprint, request, g
from models.prescription import PrescriptionModel
from services.inventory_service import check_stock_availability, deduct_stock
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_date

logger = logging.getLogger(__name__)
bp = Blueprint("prescriptions", __name__, url_prefix="/prescriptions")


@bp.route("", methods=["POST"])
@require_role("veterinarian")
def create_prescription():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["pet_id", "date_time", "medicines"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)

    medicines = data.get("medicines", [])
    if not isinstance(medicines, list) or len(medicines) == 0:
        return error("medicines must be a non-empty list", 400)

    for med in medicines:
        if not med.get("barcode_no") or not med.get("quantity"):
            return error("Each medicine requires barcode_no and quantity", 400)

    try:
        from database.connection import DBContext
        with DBContext() as (conn, cur):
            cur.execute("SELECT branch_id FROM Veterinarian WHERE user_id = %s", (g.user["user_id"],))
            row = cur.fetchone()
            branch_id = row["branch_id"] if row else None

        if branch_id:
            items = [{"barcode_no": m["barcode_no"], "quantity": m["quantity"]} for m in medicines]
            shortages = check_stock_availability(branch_id, items)
            if shortages:
                return error("Insufficient stock: " + "; ".join(shortages), 409)

        prescription_id = PrescriptionModel.create(
            data["pet_id"],
            data["date_time"],
            data.get("expiration_date"),
            g.user["user_id"],
        )
        for med in medicines:
            PrescriptionModel.add_medicine(
                prescription_id,
                med["barcode_no"],
                med.get("quantity", 1),
                1,
            )

        if branch_id:
            for med in medicines:
                deduct_stock(branch_id, med["barcode_no"], med.get("quantity", 1))

        return success({"prescription_id": prescription_id}, "Prescription created", 201)
    except Exception as exc:
        logger.error("create_prescription error: %s", exc)
        return error("Failed to create prescription", 500)


@bp.route("/<int:prescription_id>", methods=["GET"])
@require_auth
def get_prescription(prescription_id):
    try:
        prescription = PrescriptionModel.find_by_id(prescription_id)
        if not prescription:
            return error("Prescription not found", 404)
        return success(prescription)
    except Exception as exc:
        logger.error("get_prescription error: %s", exc)
        return error("Failed to fetch prescription", 500)
