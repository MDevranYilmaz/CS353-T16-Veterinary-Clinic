import logging
from flask import Blueprint, request, g
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from database.connection import DBContext
from utils.response import success, error
from utils.validators import require_fields, valid_email
from middleware.auth_middleware import require_auth

logger = logging.getLogger(__name__)
bp = Blueprint("auth", __name__, url_prefix="/auth")

VALID_ROLES = ("pet_owner", "veterinarian", "manager")


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["full_name", "email", "password", "role"])
    if missing:
        return error(f"Missing required fields: {', '.join(missing)}", 400)

    if not valid_email(data["email"]):
        return error("Invalid email address", 400)

    role = data["role"]
    if role not in VALID_ROLES:
        return error(f"Role must be one of: {', '.join(VALID_ROLES)}", 400)

    try:
        with DBContext() as (conn, cur):
            cur.execute("SELECT user_id FROM User WHERE email = %s", (data["email"],))
            if cur.fetchone():
                return error("Email already registered", 409)

            pw_hash = generate_password_hash(data["password"])
            cur.execute(
                "INSERT INTO User (full_name, email, phone, password_hash) VALUES (%s,%s,%s,%s)",
                (data["full_name"], data["email"], data.get("phone"), pw_hash),
            )
            user_id = cur.lastrowid

            if role == "pet_owner":
                cur.execute(
                    "INSERT INTO Pet_Owner (user_id, address) VALUES (%s,%s)",
                    (user_id, data.get("address")),
                )
                branch_id = None

            elif role == "veterinarian":
                missing_vet = require_fields(data, ["specialization", "license_number", "branch_id"])
                if missing_vet:
                    return error(f"Missing vet fields: {', '.join(missing_vet)}", 400)
                cur.execute(
                    "INSERT INTO Veterinarian (user_id, specialization, license_number, branch_id) VALUES (%s,%s,%s,%s)",
                    (user_id, data["specialization"], data["license_number"], data["branch_id"]),
                )
                branch_id = data["branch_id"]

            elif role == "manager":
                missing_mgr = require_fields(data, ["branch_id"])
                if missing_mgr:
                    return error("branch_id required for manager", 400)
                cur.execute(
                    "INSERT INTO Clinic_Manager (user_id, experience, branch_id) VALUES (%s,%s,%s)",
                    (user_id, data.get("experience", 0), data["branch_id"]),
                )
                branch_id = data["branch_id"]

        token = create_access_token(
            identity=str(user_id),
            additional_claims={"user_id": user_id, "role": role, "branch_id": branch_id},
        )
        return success({"user_id": user_id, "role": role, "token": token, "full_name": data["full_name"], "email": data["email"], "branch_id": branch_id}, "User registered successfully", 201)

    except Exception as exc:
        logger.error("Register error: %s", exc)
        return error("Registration failed", 500)


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["email", "password"])
    if missing:
        return error(f"Missing required fields: {', '.join(missing)}", 400)

    try:
        with DBContext() as (conn, cur):
            cur.execute(
                "SELECT user_id, full_name, email, password_hash FROM User WHERE email = %s",
                (data["email"],),
            )
            user = cur.fetchone()

        if not user or not check_password_hash(user["password_hash"], data["password"]):
            return error("Invalid email or password", 401)

        user_id = user["user_id"]

        with DBContext() as (conn, cur):
            cur.execute("SELECT 'pet_owner' AS role, NULL AS branch_id FROM Pet_Owner WHERE user_id = %s", (user_id,))
            role_row = cur.fetchone()
            if not role_row:
                cur.execute("SELECT 'veterinarian' AS role, branch_id FROM Veterinarian WHERE user_id = %s", (user_id,))
                role_row = cur.fetchone()
            if not role_row:
                cur.execute("SELECT 'manager' AS role, branch_id FROM Clinic_Manager WHERE user_id = %s", (user_id,))
                role_row = cur.fetchone()

        if not role_row:
            return error("User has no role assigned", 500)

        role = role_row["role"]
        branch_id = role_row.get("branch_id")

        token = create_access_token(
            identity=str(user_id),
            additional_claims={"user_id": user_id, "role": role, "branch_id": branch_id},
        )
        return success(
            {"user_id": user_id, "full_name": user["full_name"], "email": user["email"], "role": role, "branch_id": branch_id, "token": token},
            "Login successful",
        )

    except Exception as exc:
        logger.error("Login error: %s", exc)
        return error("Login failed", 500)


@bp.route("/me", methods=["GET"])
@require_auth
def me():
    try:
        user_id = g.user["user_id"]
        with DBContext() as (conn, cur):
            cur.execute(
                "SELECT user_id, full_name, email, phone FROM User WHERE user_id = %s",
                (user_id,),
            )
            user = cur.fetchone()
        if not user:
            return error("User not found", 404)
        user["role"] = g.user["role"]
        user["branch_id"] = g.user["branch_id"]
        return success(user)
    except Exception as exc:
        logger.error("Me error: %s", exc)
        return error("Could not fetch user info", 500)
