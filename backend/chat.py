from flask_socketio import SocketIO, emit

socketio = SocketIO()

def init_socketio(app):
    socketio.init_app(app, cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000"])

@socketio.on('message')
def handle_message(data):
    emit('message', data, broadcast=True)
