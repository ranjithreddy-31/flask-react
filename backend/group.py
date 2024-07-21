from flask import Blueprint, jsonify, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Group, User, db
from utils import generate_random_code

group_bp = Blueprint('group', __name__)

@group_bp.route('/createGroup', methods=['POST'])
@jwt_required()
def createGroup():
    data = request.get_json()
    groupName = data.get('groupName')
    aboutGroup = data.get('aboutGroup')
    code = generate_random_code(6)
    user_id = get_jwt_identity()

    if not groupName or not aboutGroup:
        return jsonify({'message': 'groupName and aboutGroup are required'}), 400

    try:
        new_group = Group(name=groupName, code=code, description=aboutGroup, created_by=user_id)
        db.session.add(new_group)
        db.session.flush()

        user = User.query.get(user_id)
        user.groups.append(new_group)

        db.session.commit()
        return jsonify({'message': 'Group created successfully', 'newGroupCode': code}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating group: {str(e)}")
        return jsonify({'message': 'Failed to create the group'}), 500
        
@group_bp.route("/joinGroup", methods=["POST"])
@jwt_required()
def joinGroup():
    data = request.get_json()
    group_code = data.get('groupCode')
    user_id = get_jwt_identity()

    if not group_code:
        return jsonify({'message': 'groupCode is required'}), 400

    group = Group.query.filter_by(code=group_code).first()

    if group:
        user = User.query.get(user_id)
        if group not in user.groups:
            user.groups.append(group)
            db.session.commit()
            return jsonify({'message': 'Successfully joined the group', 'group': {'name': group.name, 'description': group.description}}), 200
        else:
            return jsonify({'message': 'You are already a member of this group', 'group': {'name': group.name, 'description': group.description}}), 200
    else:
        return jsonify({'message': 'Group not found'}), 404

@group_bp.route('/user/groups', methods=['GET'])
@jwt_required()
def get_user_groups():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_groups = user.groups.all()
        groups = [{'id': group.id, 'name': group.name, 'code': group.code, 'description': group.description} for group in user_groups] 
        return jsonify({"groups": groups}), 200
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500
