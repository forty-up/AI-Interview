"""
MongoDB Schemas for AI Interview Platform
"""
from datetime import datetime
from bson import ObjectId

# User Schema
user_schema = {
    '_id': ObjectId,
    'email': str,
    'password': str,  # hashed
    'name': str,
    'profile': {
        'phone': str,
        'college': str,
        'degree': str,
        'graduation_year': int,
        'skills': list,
        'target_companies': list
    },
    'created_at': datetime,
    'updated_at': datetime,
    'settings': {
        'dark_mode': bool,
        'notifications': bool
    }
}

# Interview Session Schema
interview_schema = {
    '_id': ObjectId,
    'user_id': ObjectId,
    'company': str,  # Amazon, Microsoft, etc.
    'round_type': str,  # HR, Technical, Behavioral, System Design
    'persona': str,  # Strict Senior Engineer, Friendly HR, etc.
    'questions': [
        {
            'question_id': int,
            'question_text': str,
            'user_answer': str,
            'transcription_raw': str,
            'follow_up_questions': list,
            'scores': {
                'technical_correctness': float,
                'communication_skills': float,
                'answer_structure': float,
                'reasoning_depth': float,
                'completeness': float,
                'overall': float
            },
            'ai_feedback': str,
            'timestamp': datetime
        }
    ],
    'overall_scores': {
        'technical': float,
        'communication': float,
        'confidence': float,
        'overall': float
    },
    'proctoring_data': {
        'integrity_score': float,
        'violations': list,
        'timeline': list
    },
    'emotion_analysis': {
        'stress_level': float,
        'confidence_index': float,
        'tone_stability': float,
        'sentiment_trend': list
    },
    'duration_minutes': int,
    'created_at': datetime,
    'completed_at': datetime,
    'status': str  # in_progress, completed, abandoned
}

# Quiz Attempt Schema
quiz_schema = {
    '_id': ObjectId,
    'user_id': ObjectId,
    'subject': str,  # OS, CN, DBMS, OOPS
    'topic': str,
    'questions': [
        {
            'question_id': int,
            'question_text': str,
            'options': list,
            'correct_answer': str,
            'user_answer': str,
            'explanation': str,
            'is_correct': bool
        }
    ],
    'score': float,
    'total_questions': int,
    'correct_answers': int,
    'time_taken_seconds': int,
    'created_at': datetime
}

# Flashcard Schema
flashcard_schema = {
    '_id': ObjectId,
    'user_id': ObjectId,
    'subject': str,
    'topic': str,
    'cards': [
        {
            'card_id': int,
            'question': str,
            'answer': str,
            'difficulty': str,  # easy, medium, hard
            'mastered': bool,
            'review_count': int,
            'last_reviewed': datetime
        }
    ],
    'created_at': datetime,
    'updated_at': datetime
}

# Proctoring Log Schema
proctoring_log_schema = {
    '_id': ObjectId,
    'interview_id': ObjectId,
    'user_id': ObjectId,
    'events': [
        {
            'timestamp': datetime,
            'event_type': str,  # face_not_visible, multiple_persons, phone_detected, looking_away, etc.
            'severity': str,  # low, medium, high
            'details': str
        }
    ],
    'summary': {
        'total_violations': int,
        'integrity_score': float,
        'face_visible_percentage': float,
        'attention_score': float
    },
    'created_at': datetime
}

# Report Schema
report_schema = {
    '_id': ObjectId,
    'user_id': ObjectId,
    'interview_id': ObjectId,
    'report_type': str,  # interview, quiz, overall
    'content': {
        'scores': dict,
        'strengths': list,
        'weaknesses': list,
        'improvement_suggestions': list,
        'knowledge_gaps': list,
        'placement_readiness_score': float
    },
    'pdf_url': str,
    'created_at': datetime
}

# GD Session Schema
gd_session_schema = {
    '_id': ObjectId,
    'user_id': ObjectId,
    'topic': str,
    'ai_participants': [
        {
            'name': str,
            'personality': str,
            'statements': list
        }
    ],
    'user_contributions': [
        {
            'timestamp': datetime,
            'statement': str,
            'scores': {
                'relevance': float,
                'politeness': float,
                'turn_taking': float
            }
        }
    ],
    'overall_scores': {
        'participation': float,
        'relevance': float,
        'politeness': float,
        'dominance': float,
        'overall': float
    },
    'ai_feedback': str,
    'duration_minutes': int,
    'created_at': datetime,
    'completed_at': datetime
}

# Knowledge Graph Schema (for weakness detection)
knowledge_graph_schema = {
    '_id': ObjectId,
    'user_id': ObjectId,
    'nodes': [
        {
            'subject': str,
            'topic': str,
            'subtopic': str,
            'proficiency': float,  # 0-100
            'last_assessed': datetime
        }
    ],
    'weak_areas': list,
    'strong_areas': list,
    'learning_path': list,
    'updated_at': datetime
}

# Study Plan Schema
study_plan_schema = {
    '_id': ObjectId,
    'user_id': ObjectId,
    'goals': list,
    'daily_tasks': [
        {
            'date': datetime,
            'tasks': [
                {
                    'task_id': int,
                    'description': str,
                    'subject': str,
                    'completed': bool
                }
            ]
        }
    ],
    'progress': float,
    'created_at': datetime,
    'updated_at': datetime
}


def get_empty_user():
    return {
        'email': '',
        'password': '',
        'name': '',
        'profile': {
            'phone': '',
            'college': '',
            'degree': '',
            'graduation_year': 0,
            'skills': [],
            'target_companies': []
        },
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'settings': {
            'dark_mode': False,
            'notifications': True
        }
    }


def get_empty_interview():
    return {
        'user_id': None,
        'company': '',
        'round_type': '',
        'persona': '',
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
