from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity, unset_jwt_cookies
from flask_bcrypt import Bcrypt
from models import User, db
from blacklist import blacklist
from constants import FRONTEND_SERVER

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth_bp.route("/register", methods=['POST'])
def register():
    data = request.get_json()
    existing_user = User.query.filter((User.username == data['username']) | (User.email == data['email'])).first()
    if existing_user:
        return jsonify({'message': 'Username or email already exists'}), 400
    
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(username=data['username'], email=data['email'], password=hashed_password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully!'}), 201

@auth_bp.route("/login", methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.id)
        response = jsonify(access_token=access_token)
        response.headers.add("Access-Control-Allow-Origin", FRONTEND_SERVER)
        return response, 200
    else:
        return jsonify({'message': 'Invalid credentials'}), 401

@auth_bp.route("/logout", methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt()['jti']
    blacklist.add(jti)
    response = jsonify({"message": "Successfully logged out"})
    unset_jwt_cookies(response)
    return response, 200

@auth_bp.route("/getCurrentUser", methods=["GET"])
@jwt_required()
def getCurrentUser():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if user:
        return jsonify({"message": "successfully fetched the user", "username": user.username}), 200
    else:
        return jsonify({"message": "User not found"}), 404

@auth_bp.route("/getUser/<username>", methods=["GET"])
@jwt_required()
def get_user(username):
    user = User.query.filter_by(username=username).first()
    if user:
        user_data = {
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at
        }
        return jsonify(user_data), 200
    else:
        return jsonify({'message': 'User not found'}), 404

def create_anonymous_user():
    anonymous_user = User(
        username='anonymous',
        email='anonymous@example.com',
        password=bcrypt.generate_password_hash('anonymous_password').decode('utf-8')
        )
    db.session.add(anonymous_user)
    db.session.commit()
