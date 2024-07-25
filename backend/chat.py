from flask import Blueprint, jsonify, request
from flask_socketio import SocketIO, emit, join_room
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime
from models import db, ChatMessage, User, Group

chat_bp = Blueprint('chat', __name__)
socketio = SocketIO()

def init_socketio(app):
    socketio.init_app(app, cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000"])

@socketio.on('connect')
def handle_connect():
    try:
        verify_jwt_in_request()
    except Exception as e:
        return False  # Reject the connection if JWT is invalid

@socketio.on('message')
def handle_message(data):
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        group_code = data['groupCode']
        message_content = data['content']
        
        # Find the group by code
        group = Group.query.filter_by(code=group_code).first()
        if not group:
            return
        
        # Save the message to the database
        message = ChatMessage(user_id=user_id, group_id=group.id, message=message_content)
        db.session.add(message)
        db.session.commit()
        
        # Fetch the username of the sender
        user = User.query.get(user_id)
        
        # Broadcast the message to all clients in the same group
        emit('message', {
            'user': user.username,
            'content': message.message,
            'timestamp': message.timestamp.isoformat(),
            'groupCode': group_code
        }, room=group_code)
    except Exception as e:
        print(f"Error in handle_message: {str(e)}")

@socketio.on('join')
def on_join(data):
    try:
        verify_jwt_in_request()
        room = data['groupCode']
        join_room(room)
    except Exception as e:
        print(f"Error in on_join: {str(e)}")

@chat_bp.route('/group/<groupCode>/messages', methods=['GET'])
@jwt_required()
def get_group_messages(groupCode):
    group = Group.query.filter_by(code=groupCode).first()
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    
    messages = ChatMessage.query.filter_by(group_id=group.id).order_by(ChatMessage.timestamp.asc()).all()
    return jsonify({'messages': [{'user': User.query.get(msg.user_id).username, 'content': msg.message, 'timestamp': msg.timestamp.isoformat()} for msg in messages]})

@chat_bp.route('/group/<groupCode>/messages', methods=['POST'])
@jwt_required()
def send_group_message(groupCode):
    data = request.json
    user_id = get_jwt_identity()
    
    group = Group.query.filter_by(code=groupCode).first()
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    
    message = ChatMessage(user_id=user_id, group_id=group.id, message=data['content'])
    db.session.add(message)
    db.session.commit()
    
    user = User.query.get(user_id)
    
    socketio.emit('message', {
        'user': user.username,
        'content': message.message,
        'timestamp': message.timestamp.isoformat(),
        'groupCode': groupCode
    }, room=groupCode)
    
    return jsonify({'status': 'Message sent'})