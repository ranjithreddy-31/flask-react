from flask import Blueprint, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, ChatMessage, User, Group

chat_bp = Blueprint('chat', __name__)
socketio = SocketIO()

def init_socketio(app):
    socketio.init_app(app, cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000"])

@socketio.on('connect')
def handle_connect():
    try:
        return True
    except Exception as e:
        print(f"Connection rejected: {str(e)}")
        return False

@socketio.on('join')
def on_join(data):
    try:
        room = data['groupCode']
        join_room(room)
        print(f"User joined room: {room}")
    except Exception as e:
        print(f"Error in on_join: {str(e)}")

@socketio.on('leave')
def on_leave(data):
    room = data['groupCode']
    leave_room(room)
    print(f"User left room: {room}")

@socketio.on('message')
def handle_message(data):
    emit('message', data, broadcast=True)
    try:
        user_id = get_jwt_identity()
        group_code = data['groupCode']
        message_content = data['text']
        
        group = Group.query.filter_by(code=group_code).first()
        if not group:
            return
        
        message = ChatMessage(user_id=user_id, group_id=group.id, message=message_content)
        db.session.add(message)
        db.session.commit()
        
        user = User.query.get(user_id)
        
        emit('message', {
            'user': user.username,
            'text': message.message,
            'timestamp': message.timestamp.isoformat(),
            'groupCode': group_code
        }, room=group_code)
    except Exception as e:
        print(f"Error in handle_message: {str(e)}")

@chat_bp.route('/group/<groupCode>/messages', methods=['GET'])
@jwt_required()
def get_group_messages(groupCode):
    group = Group.query.filter_by(code=groupCode).first()
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    
    messages = ChatMessage.query.filter_by(group_id=group.id).order_by(ChatMessage.timestamp.asc()).all()
    return jsonify({'messages': [{'user': User.query.get(msg.user_id).username, 'text': msg.message, 'timestamp': msg.timestamp.isoformat()} for msg in messages]})

@chat_bp.route('/group/<groupCode>/messages', methods=['POST'])
@jwt_required()
def send_group_message(groupCode):
    try:
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
            'text': message.message,
            'timestamp': message.timestamp.isoformat(),
            'groupCode': groupCode
        }, room=groupCode)
        
        return jsonify({'status': 'Message sent'})
    except Exception as e:
        return jsonify({'status': f'Failed sending message with error:{e}'}), 500