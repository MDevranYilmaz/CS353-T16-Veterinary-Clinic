import logging
from flask import Blueprint, request
from models.branch import BranchModel
from utils.response import success, error

logger = logging.getLogger(__name__)
bp = Blueprint("branches", __name__, url_prefix="/branches")


@bp.route("", methods=["GET"])
def list_branches():
    try:
        address_filter = request.args.get("address")
        branches = BranchModel.list_all(address_filter)
        return success(branches)
    except Exception as exc:
        logger.error("list_branches error: %s", exc)
        return error("Failed to fetch branches", 500)


@bp.route("/<int:branch_id>", methods=["GET"])
def get_branch(branch_id):
    try:
        branch = BranchModel.find_by_id(branch_id)
        if not branch:
            return error("Branch not found", 404)
        return success(branch)
    except Exception as exc:
        logger.error("get_branch error: %s", exc)
        return error("Failed to fetch branch", 500)
