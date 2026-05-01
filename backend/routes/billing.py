import logging
from flask import Blueprint, request, g
from models.appointment import BillModel
from services.billing_service import mark_paid, create_bill
from middleware.auth_middleware import require_auth
from middleware.role_guard import require_role
from utils.response import success, error
from utils.validators import require_fields, valid_date, parse_pagination
from utils.pagination import paginate
from database.connection import DBContext

logger = logging.getLogger(__name__)
bp = Blueprint("billing", __name__, url_prefix="/billing")


@bp.route("", methods=["GET"])
@require_auth
def list_bills():
    try:
        role = g.user.get("role")
        owner_id = request.args.get("owner_id") or (
            g.user["user_id"] if role == "pet_owner" else None
        )
        page, per_page = parse_pagination(request.args)
        if role in ("manager", "veterinarian") and not owner_id:
            bills = BillModel.list_all()
        elif owner_id:
            bills = BillModel.list_by_owner(owner_id)
        else:
            return error("owner_id is required", 400)
        return success(paginate(bills, page, per_page))
    except Exception as exc:
        logger.error("list_bills error: %s", exc)
        return error("Failed to fetch bills", 500)


@bp.route("/<int:bill_id>", methods=["GET"])
@require_auth
def get_bill(bill_id):
    try:
        bill = BillModel.find_by_id(bill_id)
        if not bill:
            return error("Bill not found", 404)

        with DBContext() as (conn, cur):
            cur.execute(
                """
                SELECT pm.*, m.med_name, m.unit_cost,
                       (pm.dosage * m.unit_cost) AS line_total
                FROM Appointment a
                JOIN Prescription pr ON pr.pet_id = a.pet_id AND pr.vet_id = a.vet_id
                                     AND DATE(pr.date_time) = DATE(a.date_time)
                JOIN PresMed pm ON pm.prescription_id = pr.prescription_id
                JOIN Medicine m ON m.barcode_no = pm.medicine_id
                WHERE a.appointment_id = %s
                """,
                (bill["appointment_id"],),
            )
            bill["medication_breakdown"] = cur.fetchall()
        return success(bill)
    except Exception as exc:
        logger.error("get_bill error: %s", exc)
        return error("Failed to fetch bill", 500)


@bp.route("/<int:bill_id>/pay", methods=["PUT"])
@require_auth
def pay_bill(bill_id):
    try:
        bill = BillModel.find_by_id(bill_id)
        if not bill:
            return error("Bill not found", 404)
        if bill["payment_status"] == "Paid":
            return error("Bill is already paid", 409)
        mark_paid(bill_id)
        return success({"bill_id": bill_id, "payment_status": "Paid"}, "Bill marked as paid")
    except Exception as exc:
        logger.error("pay_bill error: %s", exc)
        return error("Failed to process payment", 500)


@bp.route("", methods=["POST"])
@require_role("manager", "veterinarian")
def manual_create_bill():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["appointment_id", "total_amount"])
    if missing:
        return error(f"Missing fields: {', '.join(missing)}", 400)
    try:
        bill_id = BillModel.create(
            data.get("generated_date") or __import__("datetime").date.today().isoformat(),
            data["total_amount"],
            data["appointment_id"],
        )
        return success({"bill_id": bill_id}, "Bill created", 201)
    except Exception as exc:
        logger.error("manual_create_bill error: %s", exc)
        return error("Failed to create bill", 500)
