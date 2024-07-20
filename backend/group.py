from flask import Blueprint, jsonify, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Group, db
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
        new_group = Group(name=groupName, code=code, description = aboutGroup, created_by=user_id)

        db.session.add(new_group)
        db.session.flush()  
        db.session.commit()

        return jsonify({'message': 'Feed added successfully', 'newGroupCode': code}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding feed: {str(e)}")
        return jsonify({'message': 'Failed to add the feed'}), 500
        
@group_bp.route("/isGroupInDB", methods=["GET"])
@jwt_required()
def isGroupInDB():
    group_code = request.args.get('groupCode')
    
    if not group_code:
        return jsonify({'message': 'groupCode is required'}), 400

    group = Group.query.filter_by(code=group_code).first()

    if group:
        return jsonify({'message': 'Group exists', 'group': {'name': group.name, 'description': group.description}}), 200
    else:
        return jsonify({'message': 'Group not found'}), 404