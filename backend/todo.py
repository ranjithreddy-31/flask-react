from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import TodoItem, db

todo_bp = Blueprint('todo', __name__)

@todo_bp.route("/addTodoItem", methods=['POST'])
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


@todo_bp.route("/updateTodoItem", methods=['PUT'])
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


@todo_bp.route("/clearTodoList", methods=['DELETE'])
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

@todo_bp.route("/getAllItems", methods=['GET'])
@jwt_required()
def get_all_items():
    all_items = TodoItem.query.all()
    all_items_list = [{'id': i.id, 'task': i.task, 'completed': i.completed, 'created_at': i.created_at} for i in all_items]
    return jsonify({'message': 'Successfully retrieved items', 'items': all_items_list}), 200