from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
from services.gemini_service import GeminiService
from services.groq_service import GroqService

quiz_bp = Blueprint('quiz', __name__)
gemini_service = GeminiService()
groq_service = GroqService()

SUBJECTS = ['OS', 'CN', 'DBMS', 'OOPS']


@quiz_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_quiz():
    """Generate MCQ quiz for a topic"""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    subject = data.get('subject')
    topic = data.get('topic', 'General')
    num_questions = data.get('num_questions', 10)
    difficulty = data.get('difficulty', 'medium')

    if subject not in SUBJECTS:
        return jsonify({'error': 'Invalid subject'}), 400

    try:
        # Generate quiz using Gemini
        prompt = f"""Generate {num_questions} multiple choice questions for {subject} - {topic}.
        Difficulty: {difficulty}

        Format each question as:
        Q: [Question text]
        A) [Option A]
        B) [Option B]
        C) [Option C]
        D) [Option D]
        Correct: [Letter]
        Explanation: [Brief explanation of why this is correct]

        Make questions test conceptual understanding, not just memorization."""

        response = gemini_service.generate_content(prompt)
        questions = parse_quiz_questions(response, num_questions)

        # Create quiz document (without correct answers exposed)
        quiz_doc = {
            'user_id': ObjectId(user_id),
            'subject': subject,
            'topic': topic,
            'questions': questions,
            'score': 0,
            'total_questions': len(questions),
            'correct_answers': 0,
            'time_taken_seconds': 0,
            'created_at': datetime.utcnow(),
            'status': 'in_progress'
        }

        result = db.quizzes.insert_one(quiz_doc)

        # Return questions without correct answers
        questions_for_user = []
        for q in questions:
            questions_for_user.append({
                'question_id': q['question_id'],
                'question_text': q['question_text'],
                'options': q['options']
            })

        return jsonify({
            'quiz_id': str(result.inserted_id),
            'questions': questions_for_user,
            'subject': subject,
            'topic': topic,
            'total_questions': len(questions)
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def parse_quiz_questions(response, count):
    """Parse AI response into quiz format"""
    questions = []
    lines = response.strip().split('\n')
    current_q = None
    current_options = []
    current_correct = None
    current_explanation = None
    question_id = 0

    for line in lines:
        line = line.strip()
        if line.startswith('Q:'):
            if current_q and current_options and current_correct:
                questions.append({
                    'question_id': question_id,
                    'question_text': current_q,
                    'options': current_options,
                    'correct_answer': current_correct,
                    'explanation': current_explanation or '',
                    'user_answer': None,
                    'is_correct': None
                })
                question_id += 1
            current_q = line[2:].strip()
            current_options = []
            current_correct = None
            current_explanation = None
        elif line.startswith(('A)', 'B)', 'C)', 'D)')):
            current_options.append(line)
        elif line.startswith('Correct:'):
            current_correct = line.split(':')[1].strip()
        elif line.startswith('Explanation:'):
            current_explanation = line.split(':', 1)[1].strip()

    # Add last question
    if current_q and current_options and current_correct:
        questions.append({
            'question_id': question_id,
            'question_text': current_q,
            'options': current_options,
            'correct_answer': current_correct,
            'explanation': current_explanation or '',
            'user_answer': None,
            'is_correct': None
        })

    return questions[:count]


@quiz_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_quiz():
    """Submit quiz answers and get results"""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    quiz_id = data.get('quiz_id')
    answers = data.get('answers', {})  # {question_id: answer}
    time_taken = data.get('time_taken_seconds', 0)

    if not quiz_id:
        return jsonify({'error': 'Quiz ID is required'}), 400

    # Get quiz
    quiz = db.quizzes.find_one({
        '_id': ObjectId(quiz_id),
        'user_id': ObjectId(user_id)
    })

    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404

    # Grade answers
    correct_count = 0
    results = []

    for question in quiz['questions']:
        qid = str(question['question_id'])
        user_answer = answers.get(qid, '')
        is_correct = user_answer.upper() == question['correct_answer'].upper()

        if is_correct:
            correct_count += 1

        results.append({
            'question_id': question['question_id'],
            'question_text': question['question_text'],
            'options': question['options'],
            'correct_answer': question['correct_answer'],
            'user_answer': user_answer,
            'is_correct': is_correct,
            'explanation': question['explanation']
        })

        # Update question in database
        question['user_answer'] = user_answer
        question['is_correct'] = is_correct

    score = (correct_count / len(quiz['questions'])) * 100 if quiz['questions'] else 0

    # Update quiz document
    db.quizzes.update_one(
        {'_id': ObjectId(quiz_id)},
        {'$set': {
            'questions': quiz['questions'],
            'score': score,
            'correct_answers': correct_count,
            'time_taken_seconds': time_taken,
            'status': 'completed'
        }}
    )

    return jsonify({
        'quiz_id': quiz_id,
        'score': score,
        'correct_answers': correct_count,
        'total_questions': len(quiz['questions']),
        'results': results,
        'time_taken_seconds': time_taken
    }), 200


@quiz_bp.route('/history', methods=['GET'])
@jwt_required()
def get_quiz_history():
    """Get user's quiz history"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    quizzes = list(db.quizzes.find(
        {'user_id': ObjectId(user_id)},
        {'questions': 0}
    ).sort('created_at', -1).limit(50))

    for quiz in quizzes:
        quiz['_id'] = str(quiz['_id'])
        quiz['user_id'] = str(quiz['user_id'])
        if quiz.get('created_at'):
            quiz['created_at'] = quiz['created_at'].isoformat()

    return jsonify({'quizzes': quizzes}), 200


@quiz_bp.route('/<quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz_detail(quiz_id):
    """Get detailed quiz results"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    quiz = db.quizzes.find_one({
        '_id': ObjectId(quiz_id),
        'user_id': ObjectId(user_id)
    })

    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404

    quiz['_id'] = str(quiz['_id'])
    quiz['user_id'] = str(quiz['user_id'])
    if quiz.get('created_at'):
        quiz['created_at'] = quiz['created_at'].isoformat()

    return jsonify(quiz), 200


@quiz_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_quiz_analytics():
    """Get quiz performance analytics"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    # Aggregate quiz data by subject
    pipeline = [
        {'$match': {'user_id': ObjectId(user_id), 'status': 'completed'}},
        {'$group': {
            '_id': '$subject',
            'total_quizzes': {'$sum': 1},
            'avg_score': {'$avg': '$score'},
            'total_questions': {'$sum': '$total_questions'},
            'total_correct': {'$sum': '$correct_answers'}
        }}
    ]

    subject_stats = list(db.quizzes.aggregate(pipeline))

    # Get recent performance trend
    recent_quizzes = list(db.quizzes.find(
        {'user_id': ObjectId(user_id), 'status': 'completed'},
        {'score': 1, 'subject': 1, 'created_at': 1}
    ).sort('created_at', -1).limit(10))

    for quiz in recent_quizzes:
        quiz['_id'] = str(quiz['_id'])
        if quiz.get('created_at'):
            quiz['created_at'] = quiz['created_at'].isoformat()

    return jsonify({
        'subject_stats': subject_stats,
        'recent_performance': recent_quizzes
    }), 200
