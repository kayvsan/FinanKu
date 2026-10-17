from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Goal
from ..serializers import goal_to_dict
from ..utils import ApiError, current_user_id, get_json, get_owned, parse_date, parse_int, parse_text

bp = Blueprint('goals', __name__)

NOT_FOUND = 'Target tabungan tidak ditemukan.'


@bp.post('')
@jwt_required()
def create_goal():
    data = get_json()
    target = parse_int(data.get('target'), 'Nominal target harus berupa angka.')
    if target <= 0:
        raise ApiError('Nominal target harus lebih dari Rp 0.')
    goal = Goal(
        user_id=current_user_id(),
        name=parse_text(data.get('name'), 'Nama target', 80),
        target=target,
        saved=0,
        deadline=parse_date(data.get('deadline'), required=False),
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify(goal_to_dict(goal)), 201


@bp.patch('/<goal_id>/adjust')
@jwt_required()
def adjust_goal(goal_id):
    goal = get_owned(Goal, goal_id, NOT_FOUND)
    amount = parse_int(get_json().get('amount'), 'Nominal harus berupa angka.')
    if amount == 0:
        raise ApiError('Nominal tidak boleh 0.')
    goal.saved = max(0, goal.saved + amount)
    db.session.commit()
    return jsonify(goal_to_dict(goal))


@bp.delete('/<goal_id>')
@jwt_required()
def delete_goal(goal_id):
    goal = get_owned(Goal, goal_id, NOT_FOUND)
    db.session.delete(goal)
    db.session.commit()
    return jsonify(ok=True)
