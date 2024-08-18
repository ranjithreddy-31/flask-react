# chat.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ChatMessage, User, Group
from socketio_module import socketio

chat_bp = Blueprint('chat', __name__)

def emit_message(message, group_code):
    socketio.emit('message', message, room=group_code)

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
        message_content = data.get('content','').strip()
        group = Group.query.filter_by(code=groupCode).first()
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        if message_content.startswith('#anonymous'):
            message_content = message_content.lstrip('#anonymous')
            user = User.query.filter_by(username='anonymous').first()
        else:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

        message = ChatMessage(user_id=user.id, group_id=group.id, message=message_content)
        db.session.add(message)
        db.session.commit()
        message = {
        'user': user.username,
        'text': message.message,
        'timestamp': message.timestamp.isoformat(),
        'groupCode': groupCode
        }
        
        emit_message(message, groupCode)
        
        return jsonify({'status': 'Message sent'})
    except Exception as e:
        print(e)
        return jsonify({'status': f'Failed sending message with error:{e}'}), 500