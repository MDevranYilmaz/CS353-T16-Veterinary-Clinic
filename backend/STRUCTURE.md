# Backend Structure — Veterinary Clinic Chain Management System

## Quick Start

```bash
# 1. Copy and fill in environment variables
cp .env.example .env

# 2. Activate the virtual environment
source venv/bin/activate

# 3. Install dependencies (already done if venv exists)
pip install -r requirements.txt

# 4. Initialise the database (run in order)
mysql -u root -p vetclinic < database/schema.sql
mysql -u root -p vetclinic < database/indexes.sql
mysql -u root -p vetclinic < database/views.sql
mysql -u root -p vetclinic < database/triggers.sql
mysql -u root -p vetclinic < database/procedures.sql
mysql -u root -p vetclinic < database/seed.sql   # optional demo data

# 5. Run the server
python app.py
```

---

## Folder & File Map

```
backend/
├── app.py
├── config.py
├── requirements.txt
├── .env.example
│
├── database/
│   ├── __init__.py
│   ├── connection.py
│   ├── schema.sql
│   ├── indexes.sql
│   ├── views.sql
│   ├── triggers.sql
│   ├── procedures.sql
│   └── seed.sql
│
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── pet.py
│   ├── appointment.py
│   ├── medicine.py
│   ├── prescription.py
│   ├── vaccination.py
│   ├── referral.py
│   ├── evaluation.py
│   └── branch.py
│
├── routes/
│   ├── __init__.py
│   ├── auth.py
│   ├── branches.py
│   ├── veterinarians.py
│   ├── appointments.py
│   ├── pets.py
│   ├── medical_records.py
│   ├── prescriptions.py
│   ├── vaccinations.py
│   ├── inventory.py
│   ├── billing.py
│   ├── referrals.py
│   ├── evaluations.py
│   ├── waste_logs.py
│   └── reports.py
│
├── services/
│   ├── __init__.py
│   ├── appointment_service.py
│   ├── billing_service.py
│   ├── inventory_service.py
│   ├── vaccination_service.py
│   └── referral_service.py
│
├── middleware/
│   ├── __init__.py
│   ├── auth_middleware.py
│   └── role_guard.py
│
└── utils/
    ├── __init__.py
    ├── response.py
    ├── validators.py
    └── pagination.py
```

---

## Root Files

| File | Purpose |
|------|---------|
| `app.py` | Flask application factory. Creates the app, registers all blueprints, sets up CORS and JWT, initialises the DB pool. Entry point when running directly. |
| `config.py` | `DevelopmentConfig` and `ProductionConfig` classes loaded from `.env`. Controls DB credentials, JWT expiry, CORS origins, and pool size. |
| `requirements.txt` | Pinned pip dependencies: Flask 3.0, Flask-CORS, Flask-JWT-Extended, mysql-connector-python, python-dotenv, Werkzeug. |
| `.env.example` | Template for `.env`. Copy to `.env` and fill in real credentials before running. Never commit `.env`. |

---

## `database/`

Handles schema definition and the runtime connection pool. All SQL uses `%s` placeholders — no string interpolation.

| File | Purpose |
|------|---------|
| `connection.py` | Creates a `MySQLConnectionPool` (size=10) on first call to `init_pool()`. Exports `get_connection()` and the `DBContext` context manager which auto-commits on success and rolls back on exception. **To add a new connection option** (e.g. SSL), edit the pool kwargs here. |
| `__init__.py` | Re-exports `init_pool`, `get_connection`, `DBContext` for clean imports. |
| `schema.sql` | Full `CREATE TABLE` DDL for all 17 tables with foreign keys, ENUMs, and `ON DELETE` rules. **To add a new table**, append here and re-run only this file against the DB. |
| `indexes.sql` | 22 `CREATE INDEX` statements for performance-critical lookup patterns (vet schedules, pet lookups, stock expiry, billing). **To add an index**, append here. |
| `views.sql` | 6 `CREATE OR REPLACE VIEW` statements: `PetMedicalTimeline`, `LowStockAlert`, `OutstandingBills`, `VetDailySchedule`, `VaccinationStatus`, `OverdueVaccinations`. **To add a view**, append here and reference it in the relevant model or service. |
| `triggers.sql` | 4 `DELIMITER //` triggers: stock deduction after prescription, bill generation after appointment completion, next-due-date auto-fill before vaccination insert, low-stock signal after stock update. **To add a trigger**, append a `DROP TRIGGER IF EXISTS … CREATE TRIGGER` block. |
| `procedures.sql` | `check_appointment_limit(vet_id, date_time, OUT can_book)` — returns TRUE if vet has fewer than 15 non-cancelled appointments on that day. **To add a procedure**, append a `DROP PROCEDURE IF EXISTS … CREATE PROCEDURE` block. |
| `seed.sql` | Demo data: 3 branches, 5 vets, 2 managers, 5 owners, 8 pets, 10 appointments, 5 prescriptions, 10 vaccinations, 7 medicines/vaccines, 4 evaluations, 2 referrals. Safe to re-run (truncates first). |

---

## `models/`

Each model file contains one or more static-method classes that execute raw parameterized SQL. Models do not contain business logic — that lives in `services/`. Every method opens its own `DBContext` (gets a connection from the pool, commits, closes).

| File | Classes | Tables touched |
|------|---------|----------------|
| `user.py` | `UserModel`, `PetOwnerModel`, `VeterinarianModel`, `ClinicManagerModel` | `User`, `Pet_Owner`, `Veterinarian`, `Clinic_Manager` |
| `pet.py` | `PetModel`, `MedicalHistoryModel` | `Pet`, `Medical_History` |
| `appointment.py` | `AppointmentModel`, `BillModel` | `Appointment`, `Bill` |
| `medicine.py` | `MedicineModel`, `VaccineModel`, `BranchStockModel`, `WasteLogModel` | `Medicine`, `Vaccine`, `BranchStock`, `WasteLog` |
| `prescription.py` | `PrescriptionModel` | `Prescription`, `PresMed` |
| `vaccination.py` | `VaccinationModel` | `Vaccination`, views `VaccinationStatus` / `OverdueVaccinations` |
| `referral.py` | `ReferralModel` | `Referral` |
| `evaluation.py` | `EvaluationModel` | `Evaluation` |
| `branch.py` | `BranchModel`, `BoardingUnitModel` | `Branch`, `BoardingUnit` |

**To add a new model**: create a new file (or add a class to an existing file), use `DBContext` for every method, never build SQL strings with f-strings.

---

## `routes/`

Each file is a Flask `Blueprint` registered in `app.py`. Every route has a `try/except` block and returns `utils/response.success()` or `utils/response.error()`. All list endpoints support `?page=&per_page=` pagination.

| File | Prefix | Key endpoints |
|------|--------|---------------|
| `auth.py` | `/auth` | `POST /register`, `POST /login`, `GET /me` |
| `branches.py` | `/branches` | `GET /branches`, `GET /branches/<id>` |
| `veterinarians.py` | `/vets` | `GET /vets` (filter by branch/spec/availability), `GET /vets/<id>`, `GET /vets/<id>/schedule`, `GET /vets/<id>/available-slots`, `GET /vets/<id>/rating`, `GET /vets/specialists` |
| `appointments.py` | `/appointments` | `POST /appointments`, `GET /appointments`, `GET /appointments/vet`, `GET /appointments/<id>`, `PUT /appointments/<id>/status` |
| `pets.py` | `/pets` | `GET /pets`, `POST /pets`, `GET /pets/<id>`, `GET /pets/<id>/medical-history`, `GET /pets/<id>/prescriptions`, `GET /pets/<id>/vaccinations`, `GET /pets/<id>/referrals` |
| `medical_records.py` | `/medical-records` | `POST /medical-records`, `GET /medical-records/<pet_id>` |
| `prescriptions.py` | `/prescriptions` | `POST /prescriptions` (checks stock), `GET /prescriptions/<id>` |
| `vaccinations.py` | `/vaccinations` | `POST /vaccinations`, `GET /vaccinations/status/<pet_id>`, `GET /vaccinations/overdue`, `GET /vaccinations/analytics` |
| `inventory.py` | `/inventory` | `GET /inventory/medicines`, `GET /inventory/<branch_id>`, `POST /inventory/<branch_id>`, `GET /inventory/low-stock/<branch_id>`, `PUT /inventory/<branch_id>/<barcode>/threshold` |
| `billing.py` | `/billing` | `GET /billing`, `GET /billing/<id>`, `PUT /billing/<id>/pay`, `POST /billing` |
| `referrals.py` | `/referrals` | `GET /referrals`, `POST /referrals`, `PUT /referrals/<id>/status` |
| `evaluations.py` | `/evaluations` | `POST /evaluations`, `GET /evaluations/vet/<vet_id>` |
| `waste_logs.py` | `/waste-logs` | `GET /waste-logs/<branch_id>`, `POST /waste-logs` |
| `reports.py` | `/reports` | `GET /reports/stock-consumption/<branch_id>`, `GET /reports/waste-stats/<branch_id>`, `GET /reports/cost-breakdown/<branch_id>`, `GET /reports/vaccination-compliance`, `GET /reports/vaccination-trends`, `GET /reports/branch-performance` |

**To add a new route file**: create the blueprint, add its endpoints, then import and register it in `app.py` inside the `create_app()` function.

---

## `services/`

Business logic layer. Services are called by routes and call models. They never return Flask responses — they return plain Python values or raise exceptions.

| File | Responsibility |
|------|---------------|
| `appointment_service.py` | Calls `check_appointment_limit` stored procedure, checks slot conflicts, computes available hour-slots, inserts the appointment. |
| `billing_service.py` | Calculates bill total (consultation fee + medicine costs), creates `Bill` records, marks bills paid. |
| `inventory_service.py` | Checks stock availability for a list of medicines, deducts stock, queries `LowStockAlert` view. |
| `vaccination_service.py` | Queries `VaccinationStatus` and `OverdueVaccinations` views, computes compliance analytics by breed. |
| `referral_service.py` | Validates sender ≠ receiver, creates referral records, updates referral status, lists specialists by specialization. |

**To add a new service**: create a plain Python file with functions (no Flask imports), import it from the relevant route.

---

## `middleware/`

| File | Purpose |
|------|---------|
| `auth_middleware.py` | `require_auth` decorator — calls `verify_jwt_in_request()`, extracts `user_id`, `role`, `branch_id` from JWT claims into `flask.g.user`. Returns 401 if token is missing or invalid. |
| `role_guard.py` | `require_role(*roles)` decorator — wraps `require_auth`, then checks `g.user["role"]` is in the allowed list. Returns 403 if not. Usage: `@require_role("manager")` or `@require_role("veterinarian", "manager")`. |

**To add a new role**: add it to `VALID_ROLES` in `routes/auth.py` and handle its table insert in the register endpoint. The `require_role` decorator works automatically.

---

## `utils/`

| File | What it provides |
|------|-----------------|
| `response.py` | `success(data, message, status)` and `error(message, status, errors)` — return consistent `{"success": bool, ...}` JSON responses. Use these in every route. |
| `validators.py` | `require_fields(data, fields)` — returns list of missing keys. `valid_date`, `valid_datetime`, `valid_email`, `valid_enum`, `valid_int_range` — boolean checks. `parse_pagination(args)` — extracts and clamps `page`/`per_page`. |
| `pagination.py` | `paginate(items, page, per_page)` — slices an in-memory list and returns `{items, pagination}`. `paginate_query(cursor, query, params, page, per_page)` — runs a COUNT then a LIMIT/OFFSET version of a query for DB-level pagination. |

---

## Authentication & Roles

JWT tokens are issued on login and must be sent as `Authorization: Bearer <token>`.

| Role | DB table | What they can do |
|------|----------|-----------------|
| `pet_owner` | `Pet_Owner` | View own pets/appointments/bills, submit evaluations |
| `veterinarian` | `Veterinarian` | Create prescriptions, vaccinations, medical records, referrals, view schedules |
| `manager` | `Clinic_Manager` | Manage inventory/stock, log waste, access all reports |

The JWT payload carries `{ user_id, role, branch_id }`. `branch_id` is `null` for pet owners.

---

## Adding New Features — Checklist

1. **New table** → add `CREATE TABLE` to `schema.sql`, add indexes to `indexes.sql`
2. **New model** → add a class to the relevant `models/` file (or create a new one)
3. **New business logic** → add a function to the relevant `services/` file (or create a new one)
4. **New endpoint** → add to the relevant `routes/` file; if a new file, register the blueprint in `app.py`
5. **New role-protected endpoint** → decorate with `@require_role("role_name")`
6. **New view or trigger** → append to `views.sql` or `triggers.sql` and re-run against the DB

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_ENV` | `development` | `development` or `production` |
| `SECRET_KEY` | *(insecure default)* | Flask session secret |
| `JWT_SECRET_KEY` | *(insecure default)* | JWT signing key |
| `JWT_EXPIRES_HOURS` | `12` | Token lifetime in hours |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `vetclinic` | Database name |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `DB_POOL_SIZE` | `10` | Connection pool size |
| `CORS_ORIGINS` | `*` | Allowed origins (comma-separated in production) |
