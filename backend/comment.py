from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Comment, Feed, db

comment_bp = Blueprint('comment', __name__)

@comment_bp.route("/addComment", methods=["POST"])
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

@comment_bp.route("/deleteComment", methods=["DELETE"])
@jwt_required()
def deleteComment():
    data = request.get_json()
    commentId = data["commentId"]
    current_user = get_jwt_identity()
    comment = Comment.query.get(commentId)
    if not comment:
        return jsonify({"message": "Comment not found"}), 404
    if comment.user_id != current_user:
        return jsonify({"message": "Unauthorized"}), 403
    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Comment deleted successfully"}), 200
