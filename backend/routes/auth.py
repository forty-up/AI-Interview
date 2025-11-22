from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import bcrypt
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    db = current_app.config['db']
    data = request.get_json()

    # Validate required fields
    required_fields = ['email', 'password', 'name']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    # Check if user already exists
    if db.users.find_one({'email': data['email']}):
        return jsonify({'error': 'Email already registered'}), 400

    # Hash password
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())

    # Create user document
    user = {
        'email': data['email'],
        'password': hashed_password.decode('utf-8'),
        'name': data['name'],
        'profile': {
            'phone': data.get('phone', ''),
            'college': data.get('college', ''),
            'degree': data.get('degree', ''),
            'graduation_year': data.get('graduation_year', 0),
            'skills': data.get('skills', []),
            'target_companies': data.get('target_companies', [])
        },
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'settings': {
            'dark_mode': False,
            'notifications': True
        }
    }

    result = db.users.insert_one(user)

    # Create access token
    access_token = create_access_token(identity=str(result.inserted_id))

    return jsonify({
        'message': 'User registered successfully',
        'access_token': access_token,
        'user': {
            'id': str(result.inserted_id),
            'email': user['email'],
            'name': user['name']
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    db = current_app.config['db']
    data = request.get_json()

    # Validate required fields
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    # Find user
    user = db.users.find_one({'email': data['email']})
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Verify password
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Create access token
    access_token = create_access_token(identity=str(user['_id']))

    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'profile': user.get('profile', {}),
            'settings': user.get('settings', {})
        }
    }), 200


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    db = current_app.config['db']
    user_id = get_jwt_identity()

    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'id': str(user['_id']),
        'email': user['email'],
        'name': user['name'],
        'profile': user.get('profile', {}),
        'settings': user.get('settings', {}),
        'created_at': user.get('created_at', '').isoformat() if user.get('created_at') else None
    }), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    update_data = {
        'updated_at': datetime.utcnow()
    }

    if 'name' in data:
        update_data['name'] = data['name']

    if 'profile' in data:
        for key, value in data['profile'].items():
            update_data[f'profile.{key}'] = value

    if 'settings' in data:
        for key, value in data['settings'].items():
            update_data[f'settings.{key}'] = value

    result = db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': update_data}
    )

    if result.modified_count == 0:
        return jsonify({'error': 'Failed to update profile'}), 400

    return jsonify({'message': 'Profile updated successfully'}), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new passwords are required'}), 400

    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Verify current password
    if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Current password is incorrect'}), 401

    # Hash new password
    hashed_password = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt())

    db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {
            'password': hashed_password.decode('utf-8'),
            'updated_at': datetime.utcnow()
        }}
    )

    return jsonify({'message': 'Password changed successfully'}), 200
