from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
import os

# Import AI services
from services.groq_service import GroqService
from services.langchain_service import LangChainService
from ai_pipelines.interview_pipeline import InterviewPipeline

interview_bp = Blueprint('interview', __name__)

# Initialize services
groq_service = GroqService()
langchain_service = LangChainService()
interview_pipeline = InterviewPipeline()

# Company-specific configurations
COMPANY_CONFIGS = {
    'amazon': {
        'name': 'Amazon',
        'style': 'Leadership principles focused, customer obsession, data-driven',
        'difficulty': 'high',
        'focus_areas': ['system design', 'behavioral', 'coding']
    },
    'microsoft': {
        'name': 'Microsoft',
        'style': 'Growth mindset, collaborative, technical depth',
        'difficulty': 'high',
        'focus_areas': ['coding', 'system design', 'behavioral']
    },
    'infosys': {
        'name': 'Infosys',
        'style': 'Process-oriented, client focus, technical fundamentals',
        'difficulty': 'medium',
        'focus_areas': ['fundamentals', 'behavioral', 'aptitude']
    },
    'tcs': {
        'name': 'TCS',
        'style': 'Structured approach, team collaboration, learning agility',
        'difficulty': 'medium',
        'focus_areas': ['fundamentals', 'behavioral', 'communication']
    },
    'cred': {
        'name': 'CRED',
        'style': 'Product thinking, user-centric, innovative',
        'difficulty': 'high',
        'focus_areas': ['product sense', 'coding', 'system design']
    }
}

# Interview personas
PERSONAS = {
    'strict_senior': {
        'name': 'Strict Senior Engineer',
        'style': 'Direct, expects precise answers, follows up on details',
        'tone': 'professional and demanding'
    },
    'friendly_hr': {
        'name': 'Friendly HR',
        'style': 'Warm, encouraging, focuses on soft skills',
        'tone': 'supportive and conversational'
    },
    'curious_fresher': {
        'name': 'Curious Fresher',
        'style': 'Asks clarifying questions, interested in learning',
        'tone': 'enthusiastic and inquisitive'
    },
    'logical_lead': {
        'name': 'Logical Tech Lead',
        'style': 'Systematic, analyzes approach step by step',
        'tone': 'analytical and methodical'
    }
}


@interview_bp.route('/start', methods=['POST'])
@jwt_required()
def start_interview():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    round_type = data.get('round_type', 'technical')
    company = data.get('company', 'general')
    persona = data.get('persona', 'strict_senior')

    # Generate initial questions based on configuration
    questions = interview_pipeline.generate_questions(
        round_type=round_type,
        company=company,
        persona=persona,
        count=5
    )

    # Create interview document
    interview = {
        'user_id': ObjectId(user_id),
        'company': company,
        'round_type': round_type,
        'persona': persona,
        'questions': [],
        'overall_scores': {
            'technical': 0.0,
            'communication': 0.0,
            'confidence': 0.0,
            'overall': 0.0
        },
        'proctoring_data': {
            'integrity_score': 100.0,
            'violations': [],
            'timeline': []
        },
        'emotion_analysis': {
            'stress_level': 0.0,
            'confidence_index': 0.0,
            'tone_stability': 0.0,
            'sentiment_trend': []
        },
        'duration_minutes': 0,
        'created_at': datetime.utcnow(),
        'completed_at': None,
        'status': 'in_progress'
    }

    result = db.interviews.insert_one(interview)

    return jsonify({
        'interview_id': str(result.inserted_id),
        'questions': questions,
        'company_config': COMPANY_CONFIGS.get(company, {}),
        'persona_config': PERSONAS.get(persona, {}),
        'message': 'Interview started successfully'
    }), 201


@interview_bp.route('/transcribe', methods=['POST'])
@jwt_required()
def transcribe_audio():
    """Transcribe audio using Groq Whisper"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']

    try:
        # Transcribe using Groq Whisper
        transcription = groq_service.transcribe_audio(audio_file)

        return jsonify({
            'transcription': transcription,
            'success': True
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@interview_bp.route('/evaluate', methods=['POST'])
@jwt_required()
def evaluate_answer():
    """Evaluate user's answer using AI"""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    interview_id = data.get('interview_id')
    question_id = data.get('question_id')
    question_text = data.get('question_text')
    user_answer = data.get('user_answer')
    round_type = data.get('round_type', 'technical')

    if not all([interview_id, question_text, user_answer]):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Evaluate answer using AI pipeline
        evaluation = interview_pipeline.evaluate_answer(
            question=question_text,
            answer=user_answer,
            round_type=round_type
        )

        # Generate follow-up questions
        follow_ups = interview_pipeline.generate_follow_up(
            question=question_text,
            answer=user_answer,
            evaluation=evaluation
        )

        # Store in database
        question_data = {
            'question_id': question_id,
            'question_text': question_text,
            'user_answer': user_answer,
            'transcription_raw': user_answer,
            'follow_up_questions': follow_ups,
            'scores': evaluation['scores'],
            'ai_feedback': evaluation['feedback'],
            'timestamp': datetime.utcnow()
        }

        db.interviews.update_one(
            {'_id': ObjectId(interview_id)},
            {'$push': {'questions': question_data}}
        )

        return jsonify({
            'scores': evaluation['scores'],
            'feedback': evaluation['feedback'],
            'follow_up_questions': follow_ups,
            'suggestions': evaluation.get('suggestions', [])
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@interview_bp.route('/complete', methods=['POST'])
@jwt_required()
def complete_interview():
    """Complete interview and generate final scores"""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    interview_id = data.get('interview_id')

    if not interview_id:
        return jsonify({'error': 'Interview ID is required'}), 400

    # Get interview data
    interview = db.interviews.find_one({'_id': ObjectId(interview_id)})
    if not interview:
        return jsonify({'error': 'Interview not found'}), 404

    # Calculate overall scores
    questions = interview.get('questions', [])
    if questions:
        avg_scores = {
            'technical_correctness': 0,
            'communication_skills': 0,
            'answer_structure': 0,
            'reasoning_depth': 0,
            'completeness': 0
        }

        for q in questions:
            scores = q.get('scores', {})
            for key in avg_scores:
                avg_scores[key] += scores.get(key, 0)

        num_questions = len(questions)
        for key in avg_scores:
            avg_scores[key] /= num_questions

        overall_scores = {
            'technical': avg_scores['technical_correctness'],
            'communication': avg_scores['communication_skills'],
            'confidence': (avg_scores['answer_structure'] + avg_scores['reasoning_depth']) / 2,
            'overall': sum(avg_scores.values()) / len(avg_scores)
        }
    else:
        overall_scores = {
            'technical': 0,
            'communication': 0,
            'confidence': 0,
            'overall': 0
        }

    # Update interview
    db.interviews.update_one(
        {'_id': ObjectId(interview_id)},
        {'$set': {
            'overall_scores': overall_scores,
            'completed_at': datetime.utcnow(),
            'status': 'completed'
        }}
    )

    return jsonify({
        'message': 'Interview completed',
        'overall_scores': overall_scores,
        'interview_id': interview_id
    }), 200


@interview_bp.route('/history', methods=['GET'])
@jwt_required()
def get_interview_history():
    """Get user's interview history"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    interviews = list(db.interviews.find(
        {'user_id': ObjectId(user_id)},
        {'questions.user_answer': 0}  # Exclude large fields
    ).sort('created_at', -1).limit(20))

    # Convert ObjectId to string
    for interview in interviews:
        interview['_id'] = str(interview['_id'])
        interview['user_id'] = str(interview['user_id'])
        if interview.get('created_at'):
            interview['created_at'] = interview['created_at'].isoformat()
        if interview.get('completed_at'):
            interview['completed_at'] = interview['completed_at'].isoformat()

    return jsonify({'interviews': interviews}), 200


@interview_bp.route('/<interview_id>', methods=['GET'])
@jwt_required()
def get_interview_detail(interview_id):
    """Get detailed interview data"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    interview = db.interviews.find_one({
        '_id': ObjectId(interview_id),
        'user_id': ObjectId(user_id)
    })

    if not interview:
        return jsonify({'error': 'Interview not found'}), 404

    # Convert ObjectId to string
    interview['_id'] = str(interview['_id'])
    interview['user_id'] = str(interview['user_id'])
    if interview.get('created_at'):
        interview['created_at'] = interview['created_at'].isoformat()
    if interview.get('completed_at'):
        interview['completed_at'] = interview['completed_at'].isoformat()

    return jsonify(interview), 200


@interview_bp.route('/questions/generate', methods=['POST'])
@jwt_required()
def generate_questions():
    """Generate interview questions"""
    data = request.get_json()

    round_type = data.get('round_type', 'technical')
    company = data.get('company', 'general')
    topic = data.get('topic', '')
    count = data.get('count', 5)

    questions = interview_pipeline.generate_questions(
        round_type=round_type,
        company=company,
        topic=topic,
        count=count
    )

    return jsonify({'questions': questions}), 200


@interview_bp.route('/communication-tips', methods=['POST'])
@jwt_required()
def get_communication_tips():
    """Get real-time communication tips"""
    data = request.get_json()

    transcription = data.get('transcription', '')

    if not transcription:
        return jsonify({'tips': []}), 200

    tips = interview_pipeline.analyze_communication(transcription)

    return jsonify({'tips': tips}), 200
