from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
import base64
import cv2
import numpy as np
from services.proctoring_service import ProctoringService

proctoring_bp = Blueprint('proctoring', __name__)
proctoring_service = ProctoringService()


@proctoring_bp.route('/analyze-frame', methods=['POST'])
@jwt_required()
def analyze_frame():
    """Analyze a single video frame for proctoring"""
    data = request.get_json()

    interview_id = data.get('interview_id')
    frame_data = data.get('frame')  # Base64 encoded image

    if not frame_data:
        return jsonify({'error': 'No frame data provided'}), 400

    try:
        # Decode base64 image
        img_data = base64.b64decode(frame_data.split(',')[1] if ',' in frame_data else frame_data)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Analyze frame
        analysis = proctoring_service.analyze_frame(frame)

        # Log violations if any
        if analysis.get('violations') and interview_id:
            log_proctoring_event(
                current_app.config['db'],
                interview_id,
                get_jwt_identity(),
                analysis['violations']
            )

        return jsonify(analysis), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@proctoring_bp.route('/analyze-audio', methods=['POST'])
@jwt_required()
def analyze_audio():
    """Analyze audio for background noise"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']

    try:
        analysis = proctoring_service.analyze_audio(audio_file)
        return jsonify(analysis), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@proctoring_bp.route('/emotion', methods=['POST'])
@jwt_required()
def analyze_emotion():
    """Analyze emotion from video frame"""
    data = request.get_json()
    frame_data = data.get('frame')

    if not frame_data:
        return jsonify({'error': 'No frame data provided'}), 400

    try:
        # Decode base64 image
        img_data = base64.b64decode(frame_data.split(',')[1] if ',' in frame_data else frame_data)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Analyze emotion
        emotion_data = proctoring_service.analyze_emotion(frame)
        return jsonify(emotion_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@proctoring_bp.route('/voice-analysis', methods=['POST'])
@jwt_required()
def analyze_voice():
    """Analyze voice for stress and confidence"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']

    try:
        analysis = proctoring_service.analyze_voice_stress(audio_file)
        return jsonify(analysis), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@proctoring_bp.route('/log/<interview_id>', methods=['GET'])
@jwt_required()
def get_proctoring_log(interview_id):
    """Get proctoring log for an interview"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    log = db.proctoring_logs.find_one({
        'interview_id': ObjectId(interview_id),
        'user_id': ObjectId(user_id)
    })

    if not log:
        return jsonify({'events': [], 'summary': {}}), 200

    log['_id'] = str(log['_id'])
    log['interview_id'] = str(log['interview_id'])
    log['user_id'] = str(log['user_id'])
    if log.get('created_at'):
        log['created_at'] = log['created_at'].isoformat()

    return jsonify(log), 200


@proctoring_bp.route('/integrity-score/<interview_id>', methods=['GET'])
@jwt_required()
def get_integrity_score(interview_id):
    """Calculate and return integrity score for an interview"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    log = db.proctoring_logs.find_one({
        'interview_id': ObjectId(interview_id),
        'user_id': ObjectId(user_id)
    })

    if not log:
        return jsonify({
            'integrity_score': 100,
            'total_violations': 0,
            'face_visible_percentage': 100,
            'attention_score': 100
        }), 200

    summary = log.get('summary', {})
    return jsonify(summary), 200


def log_proctoring_event(db, interview_id, user_id, violations):
    """Log proctoring violations to database"""
    for violation in violations:
        event = {
            'timestamp': datetime.utcnow(),
            'event_type': violation['type'],
            'severity': violation['severity'],
            'details': violation.get('details', '')
        }

        # Upsert proctoring log
        db.proctoring_logs.update_one(
            {
                'interview_id': ObjectId(interview_id),
                'user_id': ObjectId(user_id)
            },
            {
                '$push': {'events': event},
                '$setOnInsert': {
                    'created_at': datetime.utcnow()
                }
            },
            upsert=True
        )

        # Update summary
        update_proctoring_summary(db, interview_id, user_id)


def update_proctoring_summary(db, interview_id, user_id):
    """Update proctoring summary statistics"""
    log = db.proctoring_logs.find_one({
        'interview_id': ObjectId(interview_id),
        'user_id': ObjectId(user_id)
    })

    if not log:
        return

    events = log.get('events', [])
    total_violations = len(events)

    # Calculate severity-weighted score
    severity_weights = {'low': 1, 'medium': 3, 'high': 5}
    total_weight = sum(severity_weights.get(e.get('severity', 'low'), 1) for e in events)

    # Calculate integrity score (starts at 100, decreases with violations)
    integrity_score = max(0, 100 - (total_weight * 2))

    # Calculate other metrics
    face_not_visible_count = sum(1 for e in events if e.get('event_type') == 'face_not_visible')
    looking_away_count = sum(1 for e in events if e.get('event_type') == 'looking_away')

    # Rough estimates
    face_visible_percentage = max(0, 100 - (face_not_visible_count * 5))
    attention_score = max(0, 100 - (looking_away_count * 3))

    summary = {
        'total_violations': total_violations,
        'integrity_score': integrity_score,
        'face_visible_percentage': face_visible_percentage,
        'attention_score': attention_score
    }

    db.proctoring_logs.update_one(
        {
            'interview_id': ObjectId(interview_id),
            'user_id': ObjectId(user_id)
        },
        {'$set': {'summary': summary}}
    )


@proctoring_bp.route('/timeline/<interview_id>', methods=['GET'])
@jwt_required()
def get_proctoring_timeline(interview_id):
    """Get timeline of proctoring events for visualization"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    log = db.proctoring_logs.find_one({
        'interview_id': ObjectId(interview_id),
        'user_id': ObjectId(user_id)
    })

    if not log:
        return jsonify({'timeline': []}), 200

    events = log.get('events', [])
    timeline = []

    for event in events:
        timeline.append({
            'timestamp': event['timestamp'].isoformat() if event.get('timestamp') else None,
            'type': event.get('event_type'),
            'severity': event.get('severity'),
            'details': event.get('details')
        })

    return jsonify({'timeline': timeline}), 200
