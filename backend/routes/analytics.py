from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from bson import ObjectId
from services.langchain_service import LangChainService

analytics_bp = Blueprint('analytics', __name__)
langchain_service = LangChainService()


@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_analytics():
    """Get overall dashboard analytics"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    # Get interview stats
    interview_stats = get_interview_stats(db, user_id)

    # Get quiz stats
    quiz_stats = get_quiz_stats(db, user_id)

    # Get recent activity
    recent_activity = get_recent_activity(db, user_id)

    # Calculate placement readiness score
    prs = calculate_placement_readiness_score(db, user_id)

    return jsonify({
        'interview_stats': interview_stats,
        'quiz_stats': quiz_stats,
        'recent_activity': recent_activity,
        'placement_readiness_score': prs
    }), 200


def get_interview_stats(db, user_id):
    """Get interview statistics"""
    interviews = list(db.interviews.find({
        'user_id': ObjectId(user_id),
        'status': 'completed'
    }))

    if not interviews:
        return {
            'total_interviews': 0,
            'avg_score': 0,
            'avg_technical': 0,
            'avg_communication': 0,
            'improvement_rate': 0
        }

    total = len(interviews)
    avg_score = sum(i['overall_scores'].get('overall', 0) for i in interviews) / total
    avg_technical = sum(i['overall_scores'].get('technical', 0) for i in interviews) / total
    avg_communication = sum(i['overall_scores'].get('communication', 0) for i in interviews) / total

    # Calculate improvement rate (last 5 vs first 5)
    if total >= 5:
        first_5_avg = sum(i['overall_scores'].get('overall', 0) for i in interviews[:5]) / 5
        last_5_avg = sum(i['overall_scores'].get('overall', 0) for i in interviews[-5:]) / 5
        improvement_rate = ((last_5_avg - first_5_avg) / first_5_avg * 100) if first_5_avg > 0 else 0
    else:
        improvement_rate = 0

    return {
        'total_interviews': total,
        'avg_score': round(avg_score, 2),
        'avg_technical': round(avg_technical, 2),
        'avg_communication': round(avg_communication, 2),
        'improvement_rate': round(improvement_rate, 2)
    }


def get_quiz_stats(db, user_id):
    """Get quiz statistics"""
    quizzes = list(db.quizzes.find({
        'user_id': ObjectId(user_id),
        'status': 'completed'
    }))

    if not quizzes:
        return {
            'total_quizzes': 0,
            'avg_score': 0,
            'subject_breakdown': {}
        }

    total = len(quizzes)
    avg_score = sum(q.get('score', 0) for q in quizzes) / total

    # Subject breakdown
    subject_breakdown = {}
    for quiz in quizzes:
        subject = quiz.get('subject', 'Unknown')
        if subject not in subject_breakdown:
            subject_breakdown[subject] = {'count': 0, 'total_score': 0}
        subject_breakdown[subject]['count'] += 1
        subject_breakdown[subject]['total_score'] += quiz.get('score', 0)

    for subject in subject_breakdown:
        count = subject_breakdown[subject]['count']
        subject_breakdown[subject]['avg_score'] = round(
            subject_breakdown[subject]['total_score'] / count, 2
        )

    return {
        'total_quizzes': total,
        'avg_score': round(avg_score, 2),
        'subject_breakdown': subject_breakdown
    }


def get_recent_activity(db, user_id):
    """Get recent user activity"""
    activities = []

    # Recent interviews
    interviews = list(db.interviews.find(
        {'user_id': ObjectId(user_id)},
        {'_id': 1, 'round_type': 1, 'company': 1, 'overall_scores': 1, 'created_at': 1, 'status': 1}
    ).sort('created_at', -1).limit(5))

    for interview in interviews:
        activities.append({
            'type': 'interview',
            'id': str(interview['_id']),
            'description': f"{interview.get('company', 'General')} - {interview.get('round_type', 'Technical')}",
            'score': interview.get('overall_scores', {}).get('overall', 0),
            'status': interview.get('status'),
            'date': interview['created_at'].isoformat() if interview.get('created_at') else None
        })

    # Recent quizzes
    quizzes = list(db.quizzes.find(
        {'user_id': ObjectId(user_id)},
        {'_id': 1, 'subject': 1, 'topic': 1, 'score': 1, 'created_at': 1, 'status': 1}
    ).sort('created_at', -1).limit(5))

    for quiz in quizzes:
        activities.append({
            'type': 'quiz',
            'id': str(quiz['_id']),
            'description': f"{quiz.get('subject', 'Unknown')} - {quiz.get('topic', 'General')}",
            'score': quiz.get('score', 0),
            'status': quiz.get('status'),
            'date': quiz['created_at'].isoformat() if quiz.get('created_at') else None
        })

    # Sort by date
    activities.sort(key=lambda x: x['date'] or '', reverse=True)

    return activities[:10]


def calculate_placement_readiness_score(db, user_id):
    """Calculate overall placement readiness score"""
    # Get interview data
    interviews = list(db.interviews.find({
        'user_id': ObjectId(user_id),
        'status': 'completed'
    }))

    # Get quiz data
    quizzes = list(db.quizzes.find({
        'user_id': ObjectId(user_id),
        'status': 'completed'
    }))

    # Get proctoring data
    proctoring_logs = list(db.proctoring_logs.find({
        'user_id': ObjectId(user_id)
    }))

    if not interviews and not quizzes:
        return {
            'score': 0,
            'breakdown': {},
            'explanation': 'No data available yet. Complete some interviews or quizzes to get your score.'
        }

    # Calculate component scores
    technical_score = 0
    communication_score = 0
    consistency_score = 0
    integrity_score = 100
    confidence_score = 0

    if interviews:
        technical_scores = [i['overall_scores'].get('technical', 0) for i in interviews]
        communication_scores = [i['overall_scores'].get('communication', 0) for i in interviews]
        confidence_scores = [i['overall_scores'].get('confidence', 0) for i in interviews]

        technical_score = sum(technical_scores) / len(technical_scores)
        communication_score = sum(communication_scores) / len(communication_scores)
        confidence_score = sum(confidence_scores) / len(confidence_scores)

        # Calculate consistency (low variance = high consistency)
        if len(technical_scores) > 1:
            variance = sum((x - technical_score) ** 2 for x in technical_scores) / len(technical_scores)
            consistency_score = max(0, 100 - (variance ** 0.5) * 2)
        else:
            consistency_score = 50

    if quizzes:
        quiz_avg = sum(q.get('score', 0) for q in quizzes) / len(quizzes)
        # Blend with technical score
        technical_score = (technical_score + quiz_avg) / 2 if interviews else quiz_avg

    if proctoring_logs:
        integrity_scores = [log.get('summary', {}).get('integrity_score', 100) for log in proctoring_logs]
        integrity_score = sum(integrity_scores) / len(integrity_scores)

    # Calculate overall score with weights
    weights = {
        'technical': 0.35,
        'communication': 0.25,
        'consistency': 0.15,
        'integrity': 0.15,
        'confidence': 0.10
    }

    overall_score = (
        technical_score * weights['technical'] +
        communication_score * weights['communication'] +
        consistency_score * weights['consistency'] +
        integrity_score * weights['integrity'] +
        confidence_score * weights['confidence']
    )

    # Generate explanation
    explanation = generate_prs_explanation(
        overall_score, technical_score, communication_score,
        consistency_score, integrity_score, confidence_score
    )

    return {
        'score': round(overall_score, 2),
        'breakdown': {
            'technical': round(technical_score, 2),
            'communication': round(communication_score, 2),
            'consistency': round(consistency_score, 2),
            'integrity': round(integrity_score, 2),
            'confidence': round(confidence_score, 2)
        },
        'explanation': explanation
    }


def generate_prs_explanation(overall, technical, communication, consistency, integrity, confidence):
    """Generate explanation for placement readiness score"""
    explanations = []

    if overall >= 80:
        explanations.append("Excellent! You're well-prepared for placements.")
    elif overall >= 60:
        explanations.append("Good progress! A few areas need improvement.")
    elif overall >= 40:
        explanations.append("Moderate preparation. Focus on weak areas.")
    else:
        explanations.append("Needs significant improvement in multiple areas.")

    # Specific feedback
    if technical < 60:
        explanations.append("Technical skills need more practice.")
    if communication < 60:
        explanations.append("Work on communication clarity.")
    if consistency < 60:
        explanations.append("Aim for more consistent performance.")
    if integrity < 80:
        explanations.append("Maintain focus during interviews.")
    if confidence < 60:
        explanations.append("Build more confidence in your answers.")

    return " ".join(explanations)


@analytics_bp.route('/knowledge-graph', methods=['GET'])
@jwt_required()
def get_knowledge_graph():
    """Get user's knowledge graph with weak areas"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    # Get or create knowledge graph
    kg = db.knowledge_graphs.find_one({'user_id': ObjectId(user_id)})

    if not kg:
        # Generate knowledge graph from quiz and interview data
        kg = generate_knowledge_graph(db, user_id)

    if kg and '_id' in kg:
        kg['_id'] = str(kg['_id'])
        kg['user_id'] = str(kg['user_id'])

    return jsonify(kg or {'nodes': [], 'weak_areas': [], 'strong_areas': []}), 200


def generate_knowledge_graph(db, user_id):
    """Generate knowledge graph from user's performance data"""
    # Get quiz data by subject and topic
    quizzes = list(db.quizzes.find({
        'user_id': ObjectId(user_id),
        'status': 'completed'
    }))

    nodes = {}
    for quiz in quizzes:
        subject = quiz.get('subject', 'Unknown')
        topic = quiz.get('topic', 'General')
        score = quiz.get('score', 0)

        key = f"{subject}_{topic}"
        if key not in nodes:
            nodes[key] = {
                'subject': subject,
                'topic': topic,
                'subtopic': '',
                'proficiency': score,
                'attempts': 1,
                'last_assessed': quiz.get('created_at')
            }
        else:
            # Update with weighted average
            nodes[key]['proficiency'] = (
                nodes[key]['proficiency'] * nodes[key]['attempts'] + score
            ) / (nodes[key]['attempts'] + 1)
            nodes[key]['attempts'] += 1
            nodes[key]['last_assessed'] = quiz.get('created_at')

    # Identify weak and strong areas
    node_list = list(nodes.values())
    weak_areas = [n for n in node_list if n['proficiency'] < 60]
    strong_areas = [n for n in node_list if n['proficiency'] >= 80]

    # Sort by proficiency
    weak_areas.sort(key=lambda x: x['proficiency'])
    strong_areas.sort(key=lambda x: x['proficiency'], reverse=True)

    # Generate learning path
    learning_path = []
    for weak in weak_areas[:5]:
        learning_path.append({
            'subject': weak['subject'],
            'topic': weak['topic'],
            'current_proficiency': round(weak['proficiency'], 2),
            'recommended_action': f"Review {weak['topic']} fundamentals and practice more questions"
        })

    kg_doc = {
        'user_id': ObjectId(user_id),
        'nodes': node_list,
        'weak_areas': [{'subject': w['subject'], 'topic': w['topic'], 'proficiency': round(w['proficiency'], 2)} for w in weak_areas],
        'strong_areas': [{'subject': s['subject'], 'topic': s['topic'], 'proficiency': round(s['proficiency'], 2)} for s in strong_areas],
        'learning_path': learning_path,
        'updated_at': datetime.utcnow()
    }

    # Save to database
    db.knowledge_graphs.update_one(
        {'user_id': ObjectId(user_id)},
        {'$set': kg_doc},
        upsert=True
    )

    return kg_doc


@analytics_bp.route('/meta-analysis', methods=['GET'])
@jwt_required()
def get_meta_analysis():
    """Get cross-interview meta analysis"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    interviews = list(db.interviews.find({
        'user_id': ObjectId(user_id),
        'status': 'completed'
    }).sort('created_at', 1))

    if len(interviews) < 2:
        return jsonify({
            'message': 'Need at least 2 completed interviews for meta analysis',
            'trends': [],
            'repeated_mistakes': [],
            'consistent_strengths': [],
            'improvement_rate': 0
        }), 200

    # Analyze trends
    scores_over_time = []
    for interview in interviews:
        scores_over_time.append({
            'date': interview['created_at'].isoformat() if interview.get('created_at') else None,
            'overall': interview['overall_scores'].get('overall', 0),
            'technical': interview['overall_scores'].get('technical', 0),
            'communication': interview['overall_scores'].get('communication', 0)
        })

    # Calculate improvement rate
    first_half = interviews[:len(interviews)//2]
    second_half = interviews[len(interviews)//2:]

    first_avg = sum(i['overall_scores'].get('overall', 0) for i in first_half) / len(first_half)
    second_avg = sum(i['overall_scores'].get('overall', 0) for i in second_half) / len(second_half)

    improvement_rate = ((second_avg - first_avg) / first_avg * 100) if first_avg > 0 else 0

    # Identify patterns (simplified)
    low_scores = []
    high_scores = []

    for interview in interviews:
        for q in interview.get('questions', []):
            scores = q.get('scores', {})
            if scores.get('technical_correctness', 100) < 50:
                low_scores.append(q.get('question_text', '')[:50])
            if scores.get('technical_correctness', 0) >= 80:
                high_scores.append(q.get('question_text', '')[:50])

    return jsonify({
        'trends': scores_over_time,
        'improvement_rate': round(improvement_rate, 2),
        'repeated_mistakes': low_scores[:5],
        'consistent_strengths': high_scores[:5],
        'suggested_focus_areas': ['Practice more technical questions', 'Improve answer structure']
    }), 200
