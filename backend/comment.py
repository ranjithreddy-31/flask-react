from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Comment, Feed, Group, db
from socketio_module import socketio

comment_bp = Blueprint('comment', __name__)

def emit_new_comment(feed_id, comment, group_code):
    socketio.emit('new_comment', {'feed_id': feed_id, 'comment': {
            'id': comment.id,
            'comment': comment.comment,
            'added_by': comment.author.username,
            'added_at': comment.added_at.isoformat()
    }}, room=group_code)

def emit_delete_comment(feed_id, comment_id, group_code):
    socketio.emit('delete_comment', {'feed_id': feed_id, 'comment_id': comment_id}, room=group_code)

def emit_update_comment(feed_id, comment, group_code):
    socketio.emit('update_comment', {'feed_id': feed_id, 'comment': {
            'id': comment.id,
            'comment': comment.comment,
            'added_by': comment.author.username,
            'added_at': comment.added_at.isoformat()
    }}, room=group_code)

@comment_bp.route("/addComment", methods=["POST"])
@jwt_required()
def addComment():
    data = request.get_json()
    feed_id = data['feed_id']
    comment = data['comment']
    user_id = get_jwt_identity() 
    groupId = Feed.query.get(feed_id).group_id
    groupCode = Group.query.get(groupId).code
    try:
        new_comment = Comment(feed_id=feed_id, comment=comment, user_id=user_id)
        db.session.add(new_comment)
        db.session.commit()
        emit_new_comment(feed_id, new_comment, groupCode)

        return jsonify({'message': 'Comment added successfully', 'comment_id': new_comment.id}), 201
    except Exception as e:
        db.session.rollback() 
        print(f'Failed to add the Comment:{e}')
        return jsonify({'message': f'Failed to add the Comment:{e}'}), 401

@comment_bp.route("/deleteComment", methods=["DELETE"])
@jwt_required()
def deleteComment():
    data = request.get_json()
    commentId = data["commentId"]

    try:
        current_user = get_jwt_identity()
        comment = Comment.query.get(commentId)
        
        if not comment:
            return jsonify({"message": "Comment not found"}), 404
        if comment.user_id != current_user:
            return jsonify({"message": "Unauthorized"}), 403

        feedId = comment.feed_id
        groupId = Feed.query.get(feedId).group_id
        groupCode = Group.query.get(groupId).code
        db.session.delete(comment)
        db.session.commit()
        emit_delete_comment(feedId, commentId, groupCode)
        return jsonify({"message": "Comment deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": f"Failed deleting Comment with {e}"}), 500

@comment_bp.route("/updateComment", methods=["PUT"])
@jwt_required()
def updateComment():
    data = request.get_json()
    comment_id = data.get("commentId")
    new_comment = data.get("newComment")

    if not comment_id or not new_comment:
        return jsonify({"message": "Comment ID and new comment text are required"}), 400

    try:
        comment = Comment.query.get(comment_id)
        if not comment:
            return jsonify({"message": "Comment not found"}), 404

        comment.comment = new_comment
        db.session.commit()

        feedId = comment.feed_id
        groupId = Feed.query.get(feedId).group_id
        groupCode = Group.query.get(groupId).code
        emit_update_comment(feedId, comment, groupCode)
        return jsonify({"message": "Comment updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed updating comment: {e}"}), 500

    