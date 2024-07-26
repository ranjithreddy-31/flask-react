# socketio_module.py
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import get_jwt_identity
from models import db, ChatMessage, User, Group

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
