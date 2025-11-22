from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
from services.langchain_service import LangChainService

gd_bp = Blueprint('gd', __name__)
langchain_service = LangChainService()

# GD Topics
GD_TOPICS = [
    "Should AI replace human jobs?",
    "Remote work vs Office work",
    "Is social media beneficial for society?",
    "Should coding be mandatory in schools?",
    "Data privacy vs Convenience",
    "Cryptocurrency: Future of finance?",
    "Climate change: Individual vs Corporate responsibility",
    "Is higher education necessary for success?",
    "Automation in healthcare: Benefits and risks",
    "Work-life balance in tech industry"
]

# AI Participant Personalities
AI_PERSONALITIES = {
    'analytical': {
        'name': 'Arjun',
        'style': 'Data-driven, logical arguments, cites statistics',
        'traits': ['analytical', 'fact-based', 'methodical']
    },
    'creative': {
        'name': 'Maya',
        'style': 'Creative perspectives, thinks outside the box',
        'traits': ['innovative', 'imaginative', 'unconventional']
    },
    'pragmatic': {
        'name': 'Raj',
        'style': 'Practical solutions, real-world examples',
        'traits': ['practical', 'solution-oriented', 'realistic']
    }
}


@gd_bp.route('/start', methods=['POST'])
@jwt_required()
def start_gd():
    """Start a group discussion session"""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    topic = data.get('topic', GD_TOPICS[0])

    # Initialize AI participants
    ai_participants = []
    for key, personality in AI_PERSONALITIES.items():
        ai_participants.append({
            'name': personality['name'],
            'personality': key,
            'statements': []
        })

    # Generate initial AI statements
    initial_statements = generate_initial_statements(topic)

    for i, participant in enumerate(ai_participants):
        participant['statements'].append({
            'text': initial_statements[i],
            'timestamp': datetime.utcnow()
        })

    # Create GD session document
    gd_session = {
        'user_id': ObjectId(user_id),
        'topic': topic,
        'ai_participants': ai_participants,
        'user_contributions': [],
        'overall_scores': {
            'participation': 0,
            'relevance': 0,
            'politeness': 0,
            'dominance': 0,
            'overall': 0
        },
        'ai_feedback': '',
        'duration_minutes': 0,
        'created_at': datetime.utcnow(),
        'completed_at': None,
        'status': 'in_progress'
    }

    result = db.gd_sessions.insert_one(gd_session)

    return jsonify({
        'session_id': str(result.inserted_id),
        'topic': topic,
        'ai_participants': [
            {
                'name': p['name'],
                'personality': p['personality'],
                'initial_statement': p['statements'][0]['text']
            }
            for p in ai_participants
        ]
    }), 201


def generate_initial_statements(topic):
    """Generate initial statements from AI participants"""
    try:
        prompt = f"""Generate 3 different opening statements for a group discussion on: "{topic}"

        Each statement should be 2-3 sentences and represent a different perspective:
        1. Analytical perspective (data-driven, logical)
        2. Creative perspective (innovative, unique angle)
        3. Pragmatic perspective (practical, solution-oriented)

        Format:
        1: [Statement]
        2: [Statement]
        3: [Statement]"""

        response = langchain_service.generate_content(prompt)

        # Parse response
        statements = []
        lines = response.strip().split('\n')
        for line in lines:
            if line.strip() and ':' in line:
                statement = line.split(':', 1)[1].strip()
                if statement:
                    statements.append(statement)

        while len(statements) < 3:
            statements.append(f"I believe we should consider multiple aspects of {topic}.")

        return statements[:3]

    except Exception as e:
        return [
            f"From an analytical standpoint, {topic} presents interesting data considerations.",
            f"Thinking creatively, {topic} opens up innovative possibilities.",
            f"Practically speaking, {topic} requires balanced solutions."
        ]


@gd_bp.route('/contribute', methods=['POST'])
@jwt_required()
def add_contribution():
    """Add user contribution and get AI responses"""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    session_id = data.get('session_id')
    user_statement = data.get('statement')

    if not session_id or not user_statement:
        return jsonify({'error': 'Session ID and statement are required'}), 400

    # Get GD session
    session = db.gd_sessions.find_one({
        '_id': ObjectId(session_id),
        'user_id': ObjectId(user_id)
    })

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    # Evaluate user contribution
    evaluation = evaluate_contribution(user_statement, session['topic'], session['user_contributions'])

    # Add user contribution
    contribution = {
        'timestamp': datetime.utcnow(),
        'statement': user_statement,
        'scores': evaluation
    }

    # Generate AI responses
    ai_responses = generate_ai_responses(
        session['topic'],
        user_statement,
        session['ai_participants']
    )

    # Update AI participant statements
    for i, response in enumerate(ai_responses):
        if i < len(session['ai_participants']):
            db.gd_sessions.update_one(
                {'_id': ObjectId(session_id)},
                {'$push': {
                    f'ai_participants.{i}.statements': {
                        'text': response,
                        'timestamp': datetime.utcnow()
                    }
                }}
            )

    # Save user contribution
    db.gd_sessions.update_one(
        {'_id': ObjectId(session_id)},
        {'$push': {'user_contributions': contribution}}
    )

    return jsonify({
        'evaluation': evaluation,
        'ai_responses': [
            {
                'name': session['ai_participants'][i]['name'],
                'response': response
            }
            for i, response in enumerate(ai_responses)
        ]
    }), 200


def evaluate_contribution(statement, topic, previous_contributions):
    """Evaluate user's contribution to the discussion"""
    try:
        prompt = f"""Evaluate this group discussion contribution:

        Topic: {topic}
        Statement: "{statement}"

        Score each aspect from 0-100:
        1. Relevance: How relevant is the statement to the topic?
        2. Politeness: How respectful and courteous is the tone?
        3. Turn-taking: Does it appropriately build on previous points?

        Format response as:
        relevance: [score]
        politeness: [score]
        turn_taking: [score]"""

        response = langchain_service.generate_content(prompt)

        # Parse scores
        scores = {'relevance': 70, 'politeness': 80, 'turn_taking': 75}
        for line in response.split('\n'):
            line = line.lower().strip()
            for key in scores:
                if key in line and ':' in line:
                    try:
                        score = int(''.join(filter(str.isdigit, line.split(':')[1])))
                        scores[key] = min(100, max(0, score))
                    except:
                        pass

        return scores

    except Exception as e:
        return {'relevance': 70, 'politeness': 80, 'turn_taking': 75}


def generate_ai_responses(topic, user_statement, ai_participants):
    """Generate AI participant responses to user's statement"""
    try:
        prompt = f"""In a group discussion about "{topic}", respond to this statement:
        "{user_statement}"

        Generate 3 different responses from these perspectives:
        1. Analytical (logical, data-driven)
        2. Creative (innovative, unique)
        3. Pragmatic (practical)

        Each response should be 1-2 sentences, engaging with the user's point.

        Format:
        1: [Response]
        2: [Response]
        3: [Response]"""

        response = langchain_service.generate_content(prompt)

        # Parse responses
        responses = []
        lines = response.strip().split('\n')
        for line in lines:
            if line.strip() and ':' in line:
                resp = line.split(':', 1)[1].strip()
                if resp:
                    responses.append(resp)

        while len(responses) < 3:
            responses.append("That's an interesting perspective to consider.")

        return responses[:3]

    except Exception as e:
        return [
            "That's a valid point from an analytical standpoint.",
            "I see this from a different creative angle.",
            "Practically, we should consider implementation."
        ]


@gd_bp.route('/complete', methods=['POST'])
@jwt_required()
def complete_gd():
    """Complete GD session and get final evaluation"""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json()

    session_id = data.get('session_id')

    if not session_id:
        return jsonify({'error': 'Session ID is required'}), 400

    # Get GD session
    session = db.gd_sessions.find_one({
        '_id': ObjectId(session_id),
        'user_id': ObjectId(user_id)
    })

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    # Calculate overall scores
    contributions = session.get('user_contributions', [])

    if contributions:
        avg_relevance = sum(c['scores'].get('relevance', 0) for c in contributions) / len(contributions)
        avg_politeness = sum(c['scores'].get('politeness', 0) for c in contributions) / len(contributions)
        avg_turn_taking = sum(c['scores'].get('turn_taking', 0) for c in contributions) / len(contributions)

        # Calculate participation score based on number of contributions
        participation = min(100, len(contributions) * 25)

        # Calculate dominance score
        total_statements = len(contributions)
        for p in session['ai_participants']:
            total_statements += len(p.get('statements', []))
        dominance = (len(contributions) / total_statements * 100) if total_statements > 0 else 0

        overall = (avg_relevance + avg_politeness + avg_turn_taking + participation) / 4

        overall_scores = {
            'participation': round(participation, 2),
            'relevance': round(avg_relevance, 2),
            'politeness': round(avg_politeness, 2),
            'dominance': round(dominance, 2),
            'overall': round(overall, 2)
        }
    else:
        overall_scores = {
            'participation': 0,
            'relevance': 0,
            'politeness': 0,
            'dominance': 0,
            'overall': 0
        }

    # Generate AI feedback
    feedback = generate_gd_feedback(session['topic'], contributions, overall_scores)

    # Update session
    db.gd_sessions.update_one(
        {'_id': ObjectId(session_id)},
        {'$set': {
            'overall_scores': overall_scores,
            'ai_feedback': feedback,
            'completed_at': datetime.utcnow(),
            'status': 'completed'
        }}
    )

    return jsonify({
        'session_id': session_id,
        'overall_scores': overall_scores,
        'feedback': feedback,
        'total_contributions': len(contributions)
    }), 200


def generate_gd_feedback(topic, contributions, scores):
    """Generate overall feedback for GD performance"""
    feedback_parts = []

    if scores['participation'] >= 75:
        feedback_parts.append("You actively participated in the discussion.")
    elif scores['participation'] >= 50:
        feedback_parts.append("Your participation was moderate. Try to contribute more often.")
    else:
        feedback_parts.append("You should participate more actively in discussions.")

    if scores['relevance'] >= 75:
        feedback_parts.append("Your points were highly relevant to the topic.")
    elif scores['relevance'] < 60:
        feedback_parts.append("Work on keeping your points more focused on the topic.")

    if scores['politeness'] >= 80:
        feedback_parts.append("You maintained excellent decorum throughout.")
    elif scores['politeness'] < 70:
        feedback_parts.append("Pay attention to your tone and be more respectful of others' views.")

    if scores['dominance'] > 50:
        feedback_parts.append("Be careful not to dominate the discussion.")
    elif scores['dominance'] < 20:
        feedback_parts.append("Don't hesitate to assert your views more strongly.")

    return " ".join(feedback_parts)


@gd_bp.route('/topics', methods=['GET'])
def get_topics():
    """Get available GD topics"""
    return jsonify({'topics': GD_TOPICS}), 200


@gd_bp.route('/history', methods=['GET'])
@jwt_required()
def get_gd_history():
    """Get user's GD session history"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    sessions = list(db.gd_sessions.find(
        {'user_id': ObjectId(user_id)},
        {'ai_participants': 0, 'user_contributions': 0}
    ).sort('created_at', -1))

    for session in sessions:
        session['_id'] = str(session['_id'])
        session['user_id'] = str(session['user_id'])
        if session.get('created_at'):
            session['created_at'] = session['created_at'].isoformat()
        if session.get('completed_at'):
            session['completed_at'] = session['completed_at'].isoformat()

    return jsonify({'sessions': sessions}), 200
