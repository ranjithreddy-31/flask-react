from flask import Blueprint, jsonify, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Group, User, db
from utils import generate_random_code
from socketio_module import socketio

group_bp = Blueprint('group', __name__)


def emit_delete_group(groupCode):
    socketio.emit('delete_group', {'groupCode': groupCode}, room=groupCode)

def emit_leave_group(groupCode):
    socketio.emit('leave_group', {'groupCode': groupCode}, room=groupCode)

def emit_update_group(group, group_code):
    print(f"Update Group emit {group_code}")
    socketio.emit('update_group', {
        'id': group.id,
        'name': group.name,
        'code': group.code,
        'description': group.description,
        'created_by': User.query.get(group.created_by).username,
    }, room=group_code)

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
        groups = [{'id': group.id, 'name': group.name, 'code': group.code, 'description': group.description, 'created_by': User.query.get(group.created_by).username} for group in user_groups] 
        return jsonify({"groups": groups}), 200
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

@group_bp.route('/group/<string:groupCode>', methods = ["PUT"])
@jwt_required()
def update_group(groupCode):
    if not groupCode:
        return jsonify({'message': 'groupCode is required'}), 400

    try:
        group = Group.query.filter_by(code=groupCode).first()
        if not group:
            return jsonify({'message': 'Group not found'}), 404

        data = request.get_json()
        newGroupName = data.get('groupName')
        if not newGroupName:
            return jsonify({'error': 'New group name is missing'}), 400

        group.name = newGroupName
        db.session.commit()
        emit_update_group(group, groupCode)
        return jsonify({'message': 'Group updated successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Group updation failed with {e}'}), 500


@group_bp.route('/leaveGroup', methods = ["POST"])
@jwt_required()
def leave_group():
    data = request.get_json()
    group_code = data.get('groupCode')
    user_id = get_jwt_identity()
    if not group_code:
            return jsonify({'error': 'Group code is missing'}), 400
    try:
        user = User.query.get(user_id)
        group = Group.query.filter_by(code=group_code).first()
        user.groups.remove(group)
        db.session.commit()
        emit_leave_group(group_code)
        return jsonify({"message": "User left the group successfully"}), 200
    except Exception as e:
        return jsonify({"message": f"Failed to remove user from the group with {e}"}), 500


@group_bp.route('/group/<string:group_code>', methods = ["DELETE"])
@jwt_required()
def delete_group(group_code):
    if not group_code:
            return jsonify({'error': 'Group code is missing'}), 400
    try:
        group = Group.query.filter_by(code=group_code).first()
        db.session.delete(group)
        db.session.commit()
        emit_delete_group(group_code)
        return jsonify({"message": "Deleted the group successfully"}), 200
    except Exception as e:
        return jsonify({"message": f"Failed to delete the group with {e}"}), 500

@group_bp.route('/about/<string:group_code>', methods=['GET'])
@jwt_required()
def about_group(group_code):
    try:
        group = Group.query.filter_by(code=group_code).first()
        if not group:
            return jsonify({"error": "Group not found"}), 404

        members = [{"id": member.id, "username": member.username} for member in group.members]
        
        group_info = {
            'id': group.id,
            'name': group.name,
            'code': group.code,
            'description': group.description,
            'created_by': User.query.get(group.created_by).username,
            'created_at': group.created_at,
            'members': members
        }
        return jsonify({"group": group_info}), 200
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500