from flask import Blueprint, jsonify, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Feed, Comment, User, db
import os
from werkzeug.utils import secure_filename
import base64

feed_bp = Blueprint('feed', __name__)

@feed_bp.route('/addFeed', methods=['POST'])
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
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
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
        
@feed_bp.route("/getAllFeeds", methods=["POST"])
@jwt_required()
def get_all_feeds():
    data = request.get_json()
    page = data.get('page', 1)
    per_page = 10**9
    
    pagination = Feed.query.join(User).order_by(Feed.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify_feeds(pagination)

@feed_bp.route("/deleteFeed", methods=["DELETE"])
@jwt_required()
def delete_feed():
    data = request.get_json()
    FeedId = data["postId"]
    try:
        feed = Feed.query.get(FeedId)
        db.session.delete(feed)
        db.session.commit()

        return jsonify({"message": "Fedd deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@feed_bp.route('/updateFeed/<int:feedId>', methods=['PUT'])
@jwt_required()
def update_feed(feedId):
    current_user = get_jwt_identity()

    feed = Feed.query.get(feedId)
    if not feed:
        return jsonify({'error': 'Feed not found'}), 404

    if feed.created_by != current_user:
        return jsonify({'error': 'Unauthorized'}), 403

    heading = request.form.get('heading')
    content = request.form.get('content')

    if not heading or not content:
        return jsonify({'error': 'Heading and content are required'}), 400

    feed.heading = heading
    feed.content = content
    print(request.files)
    if 'photo' in request.files:
        photo = request.files['photo']
        if photo:
            filename = secure_filename(f"feed_photo_{feed.id}_{photo.filename}")
            photo.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
            feed.picture = filename

    db.session.commit()

    return jsonify({'message': 'Feed updated successfully'}), 200


@feed_bp.route('/uploads/<filename>', methods=["GET"])
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@feed_bp.route("/getUserData", methods=["POST"])
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