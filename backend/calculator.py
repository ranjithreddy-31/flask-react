from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

calculator_bp = Blueprint('calculator', __name__)

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


@calculator_bp.route("/getResultForExpression", methods = ['POST'])
@jwt_required()
def get_result_for_expression():
    data = request.get_json()
    expression = data.get('expression', '')
    try:
        result = calculate(expression)
        return jsonify({'message': 'Successfully calculated the result', 'result': result}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to calculate the result: {e}'}), 400
