from flask import Flask, jsonify, request, send_from_directory
from flask_jwt_extended import JWTManager, create_access_token, get_jwt, jwt_required, unset_jwt_cookies, get_jwt_identity
from flask_bcrypt import Bcrypt
from sqlalchemy import text
from models import User, TodoItem, Feed, Comment, db
from flask_cors import CORS
import requests
import json
from datetime import datetime
from bs4 import BeautifulSoup
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
import nltk
import base64
from werkzeug.utils import secure_filename
import os

from constants import WEATHER_API_KEY, SQLALCHEMY_DATABASE_URI, SECRET_KEY, JWT_SECRET_KEY

WEATHER_API_KEY = WEATHER_API_KEY

# Download the punkt tokenizer data
nltk.download('punkt')

def initialize_app():
    """Initialize the Flask application, set up configurations, and create the database."""
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}) # Enable CORS for localhost:3000

    app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
    app.config['SECRET_KEY'] = SECRET_KEY
    app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    db.init_app(app)

    with app.app_context():
        db.create_all()

    @app.before_request
    def enforce_foreign_keys():
        """Enforce foreign key constraints for SQLite."""
        if db.engine.dialect.name == "sqlite":
            db.session.execute(text("PRAGMA foreign_keys=ON"))

    return app

app = initialize_app()
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

blacklist = set()

@jwt.token_in_blocklist_loader
def check_if_token_in_blocklist(jwt_header, jwt_payload):
    """
    Check if a JWT token is in the blacklist.

    Args:
        jwt_header (dict): JWT header.
        jwt_payload (dict): JWT payload.

    Returns:
        bool: True if the token is blacklisted, False otherwise.
    """
    return jwt_payload["jti"] in blacklist

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    """
    Callback function for revoked tokens.

    Args:
        jwt_header (dict): JWT header.
        jwt_payload (dict): JWT payload.

    Returns:
        tuple: JSON response and HTTP status code.
    """
    return (
        jsonify({"description": "The token has been revoked.", "error": "token_revoked"}),
        401,
    )

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    """
    Callback function for expired tokens.

    Args:
        jwt_header (dict): JWT header.
        jwt_payload (dict): JWT payload.

    Returns:
        tuple: JSON response and HTTP status code.
    """
    return (
        jsonify({"message": "The token has expired.", "error": "token_expired"}),
        401,
    )

@jwt.invalid_token_loader
def invalid_token_callback(error):
    """
    Callback function for invalid tokens.

    Args:
        error (str): Error message.

    Returns:
        tuple: JSON response and HTTP status code.
    """
    return (
        jsonify({"message": "Signature verification failed.", "error": "invalid_token"}),
        401,
    )

@jwt.unauthorized_loader
def missing_token_callback(error):
    """
    Callback function for requests missing a token.

    Args:
        error (str): Error message.

    Returns:
        tuple: JSON response and HTTP status code.
    """
    return (
        jsonify({
            "description": "Request does not contain an access token.",
            "error": "authorization_required",
        }),
        401,
    )

@app.route("/register", methods=['POST'])
def register():
    """
    Register a new user.

    Returns:
        tuple: JSON response and HTTP status code.
    """
    data = request.get_json()
    existing_user = User.query.filter((User.username == data['username']) | (User.email == data['email'])).first()
    if existing_user:
        return jsonify({'message': 'Username or email already exists'}), 400
    
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(username=data['username'], email=data['email'], password=hashed_password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully!'}), 201

@app.route("/login", methods=['POST'])
def login():
    """
    Log in a user and return a JWT access token.

    Returns:
        tuple: JSON response and HTTP status code.
    """
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.id)
        response = jsonify(access_token=access_token)
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")  # Allow CORS for this response
        return response, 200
    else:
        return jsonify({'message': 'Invalid credentials'}), 401

@app.route("/getUser/<username>")
@jwt_required()
def get_user(username):
    """
    Get user information by username.

    Args:
        username (str): The username of the user.

    Returns:
        tuple: JSON response with user data and HTTP status code.
    """
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
    
@app.route("/", methods=['GET'])
@app.route("/home", methods=['GET'])
@jwt_required()
def home():
    """
    Home route, accessible only to authenticated users.

    Returns:
        str: Welcome message.
    """
    return "Welcome"

@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Log out a user by adding their JWT to the blacklist.

    Returns:
        tuple: JSON response and HTTP status code.
    """
    jti = get_jwt()['jti']
    blacklist.add(jti)
    response = jsonify({"message": "Successfully logged out"})
    unset_jwt_cookies(response)  # Unset JWT cookies upon logout
    return response, 200

def summarize(content):
    parser = PlaintextParser.from_string(content, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, sentences_count=3)  
    summary_text = ' '.join(str(sentence) for sentence in summary)
    return summary_text
    
def scrape_data(url):
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        paragraphs = soup.find_all('p')
        data = [paragraph.text for paragraph in paragraphs]
        full_text = ' '.join(data)
        summary = summarize(full_text)
        print(summary)
        return jsonify({'summary': summary}), 200
    else:
        return jsonify({'message': 'Failed to retrieve data'}), 404

@app.route("/getData", methods=["POST"])
@jwt_required()
def get_data_from_url():
    url = request.get_json().get("url")
    return scrape_data(url)

@app.route("/getAllItems", methods=['GET'])
@jwt_required()
def get_all_items():
    all_items = TodoItem.query.all()
    all_items_list = [{'id': i.id, 'task': i.task, 'completed': i.completed, 'created_at': i.created_at} for i in all_items]
    return jsonify({'message': 'Successfully retrieved items', 'items': all_items_list}), 200

@app.route("/addTodoItem", methods=['POST'])
@jwt_required()
def add_todo_item():
    """
    Add a new item to Todo List.

    Returns:
        tuple: JSON response and HTTP status code.
    """
    data = request.get_json()
    item = TodoItem(task=data['item'], completed=False)
    db.session.add(item)
    db.session.commit()
    item = TodoItem.query.filter_by(task=data['item']).first()
    return jsonify({'message': 'Successfully added the item', 'item': {'id': item.id, 'task': item.task, 'completed': item.completed, 'created_at': item.created_at}}), 201
    
@app.route("/clearTodoList", methods=['DELETE'])
@jwt_required()
def clear_todo_list():
    """
    Clears the Todo List.

    Returns:
        tuple: JSON response and HTTP status code.
    """
    try:
        db.session.query(TodoItem).delete()
        db.session.commit()
        return jsonify({'message': 'Successfully cleared the Todo List'}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to clear Todo List with error {e}'}), 400

@app.route("/updateTodoItem", methods=['PUT'])
@jwt_required()
def update_todo_item():
    """
    Update the completed status of a Todo item.

    Returns:
        tuple: JSON response and HTTP status code.
    """
    data = request.get_json()
    item = TodoItem.query.filter_by(id=data['item_id']).first()
    if item is None:
        return jsonify({"error": "Item not found"}), 404
    try:
        item.completed = not item.completed
        db.session.commit()
        item = TodoItem.query.filter_by(id=data['item_id']).first()
        return jsonify({'message': 'Successfully updated the item', 'item': {'id': item.id, 'task': item.task, 'completed': item.completed, 'created_at': item.created_at}}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to update the item with error {e}'}), 400

def calculate(expression: str) -> int:
    """
    Evaluates a simple arithmetic expression string containing non-negative integers, '+', '-', '*', '/', and spaces.
    
    :param expression: A string representing a mathematical expression.
    :return: The integer result of the expression.
    """
    previous_operator = '+'
    operand_stack = []
    current_number = 0
    
    for i, char in enumerate(expression):
        if char.isdigit():
            current_number = current_number * 10 + int(char)
        
        if char in ('+', '-', '*', '/') or i == len(expression) - 1:
            if previous_operator == '+':
                operand_stack.append(current_number)
            elif previous_operator == '-':
                operand_stack.append(-current_number)
            elif previous_operator == '*':
                operand_stack.append(operand_stack.pop() * current_number)
            elif previous_operator == '/':
                previous_operand = operand_stack.pop()
                operand_stack.append(int(previous_operand / current_number))
            
            previous_operator = char
            current_number = 0
    
    return sum(operand_stack)


@app.route("/getResultForExpression", methods = ['POST'])
@jwt_required()
def get_result_for_expression():
    data = request.get_json()
    expression = data.get('expression', '')
    try:
        result = calculate(expression)
        return jsonify({'message': 'Successfully calculated the result', 'result': result}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to calculate the result: {e}'}), 400

@app.route("/getWeather", methods = ['POST'])
@jwt_required()
def getWeather():
    data = request.get_json()
    city = '+'.join(data.get('city').split())
    url = f'http://api.openweathermap.org/data/2.5/weather?q={city}&units=imperial&appid={WEATHER_API_KEY}'
    try:
        response = requests.get(url).json()

        timezone_offset = response['timezone']
        local_time = datetime.utcfromtimestamp(response['dt'] + timezone_offset).strftime('%Y-%m-%d %H:%M:%S')
        sunrise_time = datetime.utcfromtimestamp(response['sys']['sunrise'] + timezone_offset).strftime('%H:%M:%S')
        sunset_time = datetime.utcfromtimestamp(response['sys']['sunset'] + timezone_offset).strftime('%H:%M:%S')

        city_weather = {
            'city': response['name'],
            'coordinates': f"Lat: {response['coord']['lat']}, Lon: {response['coord']['lon']}",
            'temperature': f"{response['main']['temp']} °F",
            'feels_like': f"{response['main']['feels_like']} °F",
            'temp_min': f"{response['main']['temp_min']} °F",
            'temp_max': f"{response['main']['temp_max']} °F",
            'pressure': f"{response['main']['pressure']} hPa",
            'humidity': f"{response['main']['humidity']} %",
            'visibility': f"{response['visibility']} meters",
            'wind_speed': f"{response['wind']['speed']} mph",
            'wind_degree': f"{response['wind']['deg']}°",
            'weather': response['weather'][0]['description'],
            'icon': f"http://openweathermap.org/img/w/{response['weather'][0]['icon']}.png",
            'local_time': local_time,
            'sunrise': sunrise_time,
            'sunset': sunset_time,
        }
        return jsonify({'message': 'Successfully calculated the result', 'weather': city_weather}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch weather information: {e}'}), 400


@app.route('/addFeed', methods=['POST'])
@jwt_required()
def add_feed():
    data = request.get_json()
    heading = data.get('heading')
    content = data.get('content')
    photo_base64 = data.get('photo')
    user_id = get_jwt_identity()

    if not heading or not content:
        return jsonify({'message': 'Heading and content are required'}), 400

    try:
        new_feed = Feed(heading=heading, content=content, created_by=user_id)

        db.session.add(new_feed)
        db.session.flush()  # Ensure the feed ID is generated before committing

        if photo_base64:
            # Remove the "data:image/jpeg;base64," part
            photo_data = photo_base64.split(',')[1]
            photo_binary = base64.b64decode(photo_data)
            
            filename = secure_filename(f"feed_photo_{new_feed.id}.jpg")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            print(filepath)
            
            with open(filepath, 'wb') as f:
                f.write(photo_binary)
            
            new_feed.picture = filename

        db.session.commit()

        return jsonify({'message': 'Feed added successfully', 'feed_id': new_feed.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding feed: {str(e)}")
        return jsonify({'message': 'Failed to add the feed'}), 500

@app.route("/getAllFeeds", methods=["POST"])
@jwt_required()
def getAllFeeds():
    data = request.get_json()
    page = data.get('page', 1)
    per_page = 10**9
    
    pagination = Feed.query.join(User).order_by(Feed.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify_feeds(pagination)



@app.route("/addComment", methods=["POST"])
@jwt_required()
def addComment():
    data = request.get_json()
    feed_id = data['feed_id']
    comment = data['comment']
    user_id = get_jwt_identity() 
    try:
        new_comment = Comment(feed_id=feed_id, comment=comment, user_id=user_id)
        db.session.add(new_comment)
        db.session.commit()

        return jsonify({'message': 'Comment added successfully', 'comment_id': new_comment.id}), 201
    except Exception as e:
        db.session.rollback() 
        return jsonify({'message': f'Failed to add the Comment:{e}'}), 401


@app.route("/getUserData", methods=["POST"])
@jwt_required()
def getUserData():
    data = request.get_json()
    try:
        user = User.query.filter_by(username=data["username"]).first()
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        page = 1
        per_page = 10  # Adjust per_page to your needs
        pagination = Feed.query.filter_by(created_by=user.id).paginate(page=page, per_page=per_page, error_out=False)
        
        # Get the feeds response using the jsonify_feeds function
        feeds_response = jsonify_feeds(pagination)
        feeds_data = feeds_response.get_json()
        
        # Construct the user data including ID, username, and email
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'feeds': feeds_data['feeds'],
            'total_feeds': feeds_data['total']
        }
        
        return jsonify({
            'message': 'Successfully retrieved user data',
            'user': user_data
        }), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch user data: {str(e)}'}), 500


@app.route("/getCurrentUser", methods=["GET"])
@jwt_required()
def getCurrentUser():
    user_id = get_jwt_identity()
    try:
        user = User.query.filter_by(id=user_id).first()
        if user:
            return jsonify({"message": "successfully fetched the user", "username": user.username}), 200
        else:
            return jsonify({"message": "User not found"}), 404
    except Exception as e:
        return jsonify({'message': f'Failed to fetch user data: {e}'}), 500

@app.route('/uploads/<filename>', methods=["GET"])
def uploaded_file(filename):
    print('Here')
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

def jsonify_feeds(pagination):
    all_feeds_list = []
    for feed in pagination.items:
        comments = Comment.query.filter_by(feed_id=feed.id).join(User).all()
        comment_list = [{
            'id': comment.id,
            'comment': comment.comment,
            'added_by': comment.author.username,
            'added_at': comment.added_at
        } for comment in comments]
        
        feed_data = {
            'id': feed.id,
            'heading': feed.heading,
            'content': feed.content,
            'picture': feed.picture,
            'created_by': feed.creator.username,
            'created_at': feed.created_at,
            'comments': comment_list
        }
        all_feeds_list.append(feed_data)
    return jsonify({
        'message': 'Successfully retrieved Feeds',
        'feeds': all_feeds_list,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': 1

    })

@app.route("/deleteFeed", methods = ["DELETE"])
@jwt_required()
def deleteFeed():
    data = request.get_json()
    postId = data["postId"]
    try:
        post = Feed.query.get(postId)
        db.session.delete(post)
        db.session.commit()

        return jsonify({"message": "Post deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500
if __name__ == '__main__':
    app.run(debug=True)
