import logging
import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import get_config
from database.connection import init_pool

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    cfg = get_config()
    app.config.from_object(cfg)

    # CORS
    origins = cfg.CORS_ORIGINS if cfg.CORS_ORIGINS != "*" else "*"
    CORS(app, resources={r"/*": {"origins": origins}}, supports_credentials=True)

    # JWT
    JWTManager(app)

    # DB pool
    init_pool()

    # Register blueprints
    from routes.auth          import bp as auth_bp
    from routes.branches      import bp as branches_bp
    from routes.veterinarians import bp as vets_bp
    from routes.appointments  import bp as appointments_bp
    from routes.pets          import bp as pets_bp
    from routes.medical_records import bp as medical_records_bp
    from routes.prescriptions import bp as prescriptions_bp
    from routes.vaccinations  import bp as vaccinations_bp
    from routes.inventory     import bp as inventory_bp
    from routes.billing       import bp as billing_bp
    from routes.referrals     import bp as referrals_bp
    from routes.evaluations   import bp as evaluations_bp
    from routes.waste_logs    import bp as waste_logs_bp
    from routes.reports       import bp as reports_bp

    for bp in (
        auth_bp, branches_bp, vets_bp, appointments_bp, pets_bp,
        medical_records_bp, prescriptions_bp, vaccinations_bp,
        inventory_bp, billing_bp, referrals_bp, evaluations_bp,
        waste_logs_bp, reports_bp,
    ):
        app.register_blueprint(bp)

    @app.route("/health", methods=["GET"])
    def health():
        return {"success": True, "message": "Veterinary Clinic API is running"}, 200

    logger.info("Flask app created — environment: %s", os.getenv("FLASK_ENV", "development"))
    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=app.config.get("DEBUG", True))
