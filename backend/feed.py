from flask import Blueprint, jsonify, request, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Feed, Comment, User, Group, Like, db
import os
from io import BytesIO
from werkzeug.utils import secure_filename
import base64
from socketio_module import socketio
from constants import AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_BUCKET, AWS_FILE_FOLDER, AWS_REGION
from utils import get_s3_client, upload_file_to_s3, get_file_from_s3, delete_file_from_s3, beautifyContent

feed_bp = Blueprint('feed', __name__)
s3_client = get_s3_client(AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION)

def emit_new_feed(feed, group_code):
    socketio.emit('new_feed', {
        'id': feed.id,
        'heading': feed.heading,
        'content': feed.content,
        'picture': feed.picture,
        'created_by': User.query.get(feed.created_by).username,
        'created_at': feed.created_at.isoformat(),
        'comments': feed.comments,
        'groupCode': group_code
    }, room=group_code)

def emit_delete_feed(feed_id, group_code):
    socketio.emit('delete_feed', {'feed_id': feed_id}, room=group_code)

def emit_update_feed(feed, group_code):
    serialized_comments = [serialize_comment(comment) for comment in feed.comments]

    socketio.emit('update_feed', {
        'id': feed.id,
        'heading': feed.heading,
        'content': feed.content,
        'picture': feed.picture,
        'created_by': User.query.get(feed.created_by).username,
        'created_at': feed.created_at.isoformat(),
        'comments': serialized_comments,
        'groupCode': group_code
    }, room=group_code)

def emit_like(feed_id, like_count, group_code):
    socketio.emit('like_feed', {
        'feed_id': feed_id,
        'like_count': like_count,
        'groupCode': group_code
    }, room=group_code)


@feed_bp.route('/addFeed', methods=['POST'])
@jwt_required()
def add_feed():
    data = request.get_json()
    heading = data.get('heading')
    content = data.get('content')
    photo_base64 = data.get('photo')
    group_code = data.get('groupCode')
    user_id = get_jwt_identity()

    if not heading or not content:
        return jsonify({'message': 'Heading and content are required'}), 400

    try:
        group = Group.query.filter_by(code=group_code).first()
        new_feed = Feed(heading=heading, content=content, created_by=user_id, group_id=group.id)

        db.session.add(new_feed)
        db.session.flush()  # Ensure the feed ID is generated before committing

        if photo_base64:
            # Remove the "data:image/jpeg;base64," part
            photo_data = photo_base64.split(',')[1]
            photo_binary = base64.b64decode(photo_data)
            filename = f"feed_photo_{new_feed.id}.jpg"
            s3_file_name = f"feed_photos/{filename}"
            s3_url = upload_file_to_s3(s3_client, photo_binary, AWS_BUCKET, s3_file_name)
            if s3_url:
                new_feed.picture = filename  # Assuming `picture_url` is a field in Feed model
            else:
                return jsonify({'message': 'Failed to upload image to S3'}), 500

        db.session.commit()

        # Emit the new feed to all clients in the group
        emit_new_feed(new_feed, group_code)

        return jsonify({'message': 'Feed added successfully', 'feed_id': new_feed.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to add the feed due to error : {e}'}), 500

@feed_bp.route("/getAllFeeds", methods=["GET"])
@jwt_required()
def get_all_feeds():
    page = request.args.get('page', default=1, type=int)
    group_code = request.args.get('groupCode')
    per_page = 10  # You can adjust this value as needed

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not group_code:
        return jsonify({'message': 'Group code is required'}), 400

    try:
        # Get the group by code
        group = Group.query.filter_by(code=group_code).first()
        if not group:
            return jsonify({'message': 'Group not found'}), 404
        
        if user not in group.members:
            return jsonify({'message': 'You are not a member of this group'}), 403

        pagination = Feed.query.filter_by(group_id=group.id).join(User).order_by(Feed.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        return jsonify_feeds(pagination)
    except Exception as e:
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500

@feed_bp.route("/deleteFeed", methods=["DELETE"])
@jwt_required()
def delete_feed():
    data = request.get_json()
    FeedId = data["postId"]
    try:
        feed = Feed.query.get(FeedId)
        group_code = Group.query.get(feed.group_id).code
        db.session.delete(feed)
        db.session.commit()

        filename = f"feed_photo_{feed.id}.jpg"
        s3_file_name = f"feed_photos/{filename}"
        response = delete_file_from_s3(s3_client, AWS_BUCKET, s3_file_name)
        if not response:
            print('Failed to delete file')

        emit_delete_feed(FeedId, group_code)

        return jsonify({"message": "Feed deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@feed_bp.route('/updateFeed/<int:feedId>', methods=["PUT"])
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
    if 'photo' in request.files:
        photo = request.files['photo']
        if photo:
            photo_binary = photo.read()
            filename = f"feed_photo_{feed.id}.jpg"
            s3_file_name = f"feed_photos/{filename}"
            # Below code is not required at the moment
            # response = delete_file_from_s3(s3_client, AWS_BUCKET, s3_file_name)
            # if not response:
            #     print('Failed to delete file')
            s3_url = upload_file_to_s3(s3_client, photo_binary, AWS_BUCKET, s3_file_name)
            if s3_url:
                feed.picture = filename  
            else:
                return jsonify({'message': 'Failed to upload image to S3'}), 500

    db.session.commit()

    # Emit the feed update to all clients in the group
    emit_update_feed(feed, Group.query.get(feed.group_id).code)

    return jsonify({'message': 'Feed updated successfully'}), 200

@feed_bp.route('/uploads/<filename>', methods=["GET"])
def uploaded_file(filename):
    try:
        s3_file_name = f"feed_photos/{filename}"
        image_data =  get_file_from_s3(s3_client, AWS_BUCKET, s3_file_name)
        return send_file(BytesIO(image_data), mimetype='image/jpeg', as_attachment=True, download_name=filename)
    except Exception as e:
        return jsonify({'message': f'Failed to fetch feed picture from s3: {e}'}), 500

@feed_bp.route("/getUserData", methods=["GET"])
@jwt_required()
def getUserData():
    username = request.args.get('username')
    group_code = request.args.get('groupCode')
    
    try:
        user = User.query.filter_by(username=username).first()
        group = Group.query.filter_by(code=group_code).first() if group_code else None
        if not user:
            return jsonify({'message': 'User not found'}), 404
        current_user = get_jwt_identity()
        page = 1
        per_page = 10  # Adjust per_page to your needs
        if current_user == user.id:
            pagination = Feed.query.filter_by(created_by=user.id).paginate(page=page, per_page=per_page, error_out=False)
        elif group:
            pagination = Feed.query.filter_by(created_by=user.id, group_id=group.id).paginate(page=page, per_page=per_page, error_out=False)
        else:
            return jsonify({'message': 'Unauthorized access'}), 403
        
        feeds_response = jsonify_feeds(pagination)
        feeds_data = feeds_response.get_json()
        
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
        return jsonify({'message': f'Failed to fetch user data: {e}'}), 500

@feed_bp.route('/toggleLike', methods=['POST'])
@jwt_required()
def toggle_like():
    current_user = get_jwt_identity()
    data = request.get_json()
    feed_id = data.get('feed_id')
    group_code = data.get('group_code')
    like = Like.query.filter_by(user_id=current_user, feed_id=feed_id).first()
    
    if like:
        db.session.delete(like)
    else:
        new_like = Like(user_id=current_user, feed_id=feed_id)
        db.session.add(new_like)
    
    db.session.commit()
    
    like_count = Like.query.filter_by(feed_id=feed_id).count()
    emit_like(feed_id, like_count, group_code)
    return jsonify({'success': True, 'likeCount': like_count})

@feed_bp.route("/getBeautifiedContent", methods = ["GET"])
@jwt_required()
def getBeautifiedContent():
    content = request.args.get('content')
    print(content)
    try:
        beautifiedContent = beautifyContent(content)
        return jsonify({'mesaage': 'successfully beautified the content', 'content': beautifiedContent}), 200
    except:
        return jsonify({'message': f'Failed to fetch beautified content: {e}'}), 500

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
            'likes': Like.query.filter_by(feed_id=feed.id).count(),
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

def serialize_comment(comment):
    return {
        'id': comment.id,
        'comment': comment.comment,
        'added_by': comment.author.username,
        'added_at': comment.added_at.isoformat()
    }