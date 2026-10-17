from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..serializers import full_state
from ..utils import current_user_id

bp = Blueprint('state', __name__)


@bp.get('')
@jwt_required()
def get_state():
    return jsonify(full_state(current_user_id()))
