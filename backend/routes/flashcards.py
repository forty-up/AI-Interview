from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
from services.gemini_service import GeminiService

flashcards_bp = Blueprint('flashcards', __name__)
gemini_service = GeminiService()

SUBJECTS = ['OS', 'CN', 'DBMS', 'OOPS']
TOPICS = {
    'OS': ['Process Management', 'Memory Management', 'File Systems', 'CPU Scheduling', 'Deadlocks', 'Synchronization'],
    'CN': ['OSI Model', 'TCP/IP', 'Routing', 'Network Security', 'Protocols', 'Subnetting'],
    'DBMS': ['Normalization', 'SQL', 'Transactions', 'Indexing', 'ACID Properties', 'ER Diagrams'],
    'OOPS': ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction', 'Design Patterns']
}


@flashcards_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_flashcards():
    """Generate flashcards for a topic"""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    subject = data.get('subject')
    topic = data.get('topic')
    count = data.get('count', 10)
    difficulty = data.get('difficulty', 'medium')

    if subject not in SUBJECTS:
        return jsonify({'error': 'Invalid subject'}), 400

    try:
        # Generate flashcards using Gemini
        prompt = f"""Generate {count} flashcards for {subject} - {topic}.
        Difficulty level: {difficulty}

        Format each flashcard as:
        Q: [Question]
        A: [Concise but complete answer]

        Make questions progressively more challenging.
        Include practical examples where applicable."""

        response = gemini_service.generate_content(prompt)
        cards = parse_flashcards(response, count)

        # Create flashcard document
        flashcard_doc = {
            'user_id': ObjectId(user_id),
            'subject': subject,
            'topic': topic,
            'cards': cards,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = db.flashcards.insert_one(flashcard_doc)

        return jsonify({
            'flashcard_id': str(result.inserted_id),
            'cards': cards,
            'subject': subject,
            'topic': topic
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def parse_flashcards(response, count):
    """Parse AI response into flashcard format"""
    cards = []
    lines = response.strip().split('\n')
    current_q = None
    current_a = None
    card_id = 0

    for line in lines:
        line = line.strip()
        if line.startswith('Q:'):
            if current_q and current_a:
                cards.append({
                    'card_id': card_id,
                    'question': current_q,
                    'answer': current_a,
                    'difficulty': 'medium',
                    'mastered': False,
                    'review_count': 0,
                    'last_reviewed': None
                })
                card_id += 1
            current_q = line[2:].strip()
            current_a = None
        elif line.startswith('A:'):
            current_a = line[2:].strip()
        elif current_a:
            current_a += ' ' + line

    # Add last card
    if current_q and current_a:
        cards.append({
            'card_id': card_id,
            'question': current_q,
            'answer': current_a,
            'difficulty': 'medium',
            'mastered': False,
            'review_count': 0,
            'last_reviewed': None
        })

    return cards[:count]


@flashcards_bp.route('/list', methods=['GET'])
@jwt_required()
def list_flashcards():
    """List user's flashcard sets"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    flashcards = list(db.flashcards.find(
        {'user_id': ObjectId(user_id)},
        {'cards': 0}  # Exclude cards for listing
    ).sort('created_at', -1))

    for fc in flashcards:
        fc['_id'] = str(fc['_id'])
        fc['user_id'] = str(fc['user_id'])
        if fc.get('created_at'):
            fc['created_at'] = fc['created_at'].isoformat()

    return jsonify({'flashcards': flashcards}), 200


@flashcards_bp.route('/<flashcard_id>', methods=['GET'])
@jwt_required()
def get_flashcard_set(flashcard_id):
    """Get a specific flashcard set"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    flashcard = db.flashcards.find_one({
        '_id': ObjectId(flashcard_id),
        'user_id': ObjectId(user_id)
    })

    if not flashcard:
        return jsonify({'error': 'Flashcard set not found'}), 404

    flashcard['_id'] = str(flashcard['_id'])
    flashcard['user_id'] = str(flashcard['user_id'])
    if flashcard.get('created_at'):
        flashcard['created_at'] = flashcard['created_at'].isoformat()

    return jsonify(flashcard), 200


@flashcards_bp.route('/<flashcard_id>/review', methods=['POST'])
@jwt_required()
def review_card():
    """Mark a card as reviewed"""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    flashcard_id = request.view_args['flashcard_id']
    data = request.get_json()

    card_id = data.get('card_id')
    mastered = data.get('mastered', False)

    db.flashcards.update_one(
        {
            '_id': ObjectId(flashcard_id),
            'user_id': ObjectId(user_id),
            'cards.card_id': card_id
        },
        {
            '$set': {
                'cards.$.mastered': mastered,
                'cards.$.last_reviewed': datetime.utcnow()
            },
            '$inc': {'cards.$.review_count': 1}
        }
    )

    return jsonify({'message': 'Card reviewed'}), 200


@flashcards_bp.route('/subjects', methods=['GET'])
def get_subjects():
    """Get available subjects and topics"""
    return jsonify({
        'subjects': SUBJECTS,
        'topics': TOPICS
    }), 200


@flashcards_bp.route('/<flashcard_id>', methods=['DELETE'])
@jwt_required()
def delete_flashcard_set(flashcard_id):
    """Delete a flashcard set"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    result = db.flashcards.delete_one({
        '_id': ObjectId(flashcard_id),
        'user_id': ObjectId(user_id)
    })

    if result.deleted_count == 0:
        return jsonify({'error': 'Flashcard set not found'}), 404

    return jsonify({'message': 'Flashcard set deleted'}), 200
