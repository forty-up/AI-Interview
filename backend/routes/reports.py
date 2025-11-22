from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
import os
import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/generate/<interview_id>', methods=['POST'])
@jwt_required()
def generate_report(interview_id):
    """Generate PDF report for an interview"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    # Get interview data
    interview = db.interviews.find_one({
        '_id': ObjectId(interview_id),
        'user_id': ObjectId(user_id)
    })

    if not interview:
        return jsonify({'error': 'Interview not found'}), 404

    # Get user data
    user = db.users.find_one({'_id': ObjectId(user_id)})

    # Get proctoring data
    proctoring_log = db.proctoring_logs.find_one({
        'interview_id': ObjectId(interview_id)
    })

    try:
        # Generate PDF
        pdf_buffer = generate_interview_pdf(interview, user, proctoring_log)

        # Save report reference
        report_doc = {
            'user_id': ObjectId(user_id),
            'interview_id': ObjectId(interview_id),
            'report_type': 'interview',
            'content': {
                'scores': interview.get('overall_scores', {}),
                'strengths': extract_strengths(interview),
                'weaknesses': extract_weaknesses(interview),
                'improvement_suggestions': generate_suggestions(interview),
                'placement_readiness_score': calculate_prs(interview, proctoring_log)
            },
            'created_at': datetime.utcnow()
        }

        db.reports.insert_one(report_doc)

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'interview_report_{interview_id}.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_interview_pdf(interview, user, proctoring_log):
    """Generate PDF document for interview report"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#1a365d')
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.HexColor('#2d3748')
    )

    # Title
    story.append(Paragraph("Interview Performance Report", title_style))
    story.append(Spacer(1, 20))

    # User info
    story.append(Paragraph(f"Candidate: {user.get('name', 'N/A')}", styles['Normal']))
    story.append(Paragraph(f"Date: {interview.get('created_at', datetime.utcnow()).strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    story.append(Paragraph(f"Interview Type: {interview.get('round_type', 'Technical')} - {interview.get('company', 'General')}", styles['Normal']))
    story.append(Spacer(1, 20))

    # Overall Scores
    story.append(Paragraph("Overall Scores", heading_style))

    scores = interview.get('overall_scores', {})
    score_data = [
        ['Metric', 'Score'],
        ['Overall', f"{scores.get('overall', 0):.1f}%"],
        ['Technical', f"{scores.get('technical', 0):.1f}%"],
        ['Communication', f"{scores.get('communication', 0):.1f}%"],
        ['Confidence', f"{scores.get('confidence', 0):.1f}%"]
    ]

    score_table = Table(score_data, colWidths=[3*inch, 2*inch])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4299e1')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#ebf8ff')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bee3f8'))
    ]))
    story.append(score_table)
    story.append(Spacer(1, 20))

    # Question Analysis
    story.append(Paragraph("Question Analysis", heading_style))

    for i, q in enumerate(interview.get('questions', []), 1):
        story.append(Paragraph(f"Q{i}: {q.get('question_text', 'N/A')[:100]}...", styles['Normal']))
        q_scores = q.get('scores', {})
        story.append(Paragraph(
            f"Score: {q_scores.get('overall', 0):.1f}% | Technical: {q_scores.get('technical_correctness', 0):.1f}%",
            styles['Normal']
        ))
        story.append(Paragraph(f"Feedback: {q.get('ai_feedback', 'N/A')[:200]}...", styles['Normal']))
        story.append(Spacer(1, 10))

    # Proctoring Summary
    if proctoring_log:
        story.append(Paragraph("Proctoring Summary", heading_style))
        summary = proctoring_log.get('summary', {})
        story.append(Paragraph(f"Integrity Score: {summary.get('integrity_score', 100):.1f}%", styles['Normal']))
        story.append(Paragraph(f"Total Violations: {summary.get('total_violations', 0)}", styles['Normal']))
        story.append(Paragraph(f"Attention Score: {summary.get('attention_score', 100):.1f}%", styles['Normal']))
        story.append(Spacer(1, 20))

    # Strengths and Weaknesses
    story.append(Paragraph("Strengths", heading_style))
    for strength in extract_strengths(interview):
        story.append(Paragraph(f"• {strength}", styles['Normal']))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Areas for Improvement", heading_style))
    for weakness in extract_weaknesses(interview):
        story.append(Paragraph(f"• {weakness}", styles['Normal']))
    story.append(Spacer(1, 10))

    # Suggestions
    story.append(Paragraph("Improvement Suggestions", heading_style))
    for suggestion in generate_suggestions(interview):
        story.append(Paragraph(f"• {suggestion}", styles['Normal']))

    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


def extract_strengths(interview):
    """Extract strengths from interview performance"""
    strengths = []
    scores = interview.get('overall_scores', {})

    if scores.get('technical', 0) >= 70:
        strengths.append("Strong technical knowledge")
    if scores.get('communication', 0) >= 70:
        strengths.append("Clear and effective communication")
    if scores.get('confidence', 0) >= 70:
        strengths.append("Confident responses")

    # Analyze individual questions
    good_answers = sum(1 for q in interview.get('questions', [])
                       if q.get('scores', {}).get('overall', 0) >= 70)
    if good_answers > 0:
        strengths.append(f"Strong performance on {good_answers} questions")

    return strengths or ["Keep practicing to identify your strengths"]


def extract_weaknesses(interview):
    """Extract areas for improvement from interview"""
    weaknesses = []
    scores = interview.get('overall_scores', {})

    if scores.get('technical', 0) < 60:
        weaknesses.append("Technical knowledge needs improvement")
    if scores.get('communication', 0) < 60:
        weaknesses.append("Communication clarity can be improved")
    if scores.get('confidence', 0) < 60:
        weaknesses.append("Build more confidence in responses")

    # Analyze individual questions
    poor_answers = sum(1 for q in interview.get('questions', [])
                       if q.get('scores', {}).get('overall', 0) < 50)
    if poor_answers > 0:
        weaknesses.append(f"{poor_answers} questions need more practice")

    return weaknesses or ["No significant weaknesses identified"]


def generate_suggestions(interview):
    """Generate improvement suggestions"""
    suggestions = []
    scores = interview.get('overall_scores', {})

    if scores.get('technical', 0) < 70:
        suggestions.append("Practice more coding problems and technical concepts")
        suggestions.append("Review fundamental CS topics like DSA, DBMS, and OS")

    if scores.get('communication', 0) < 70:
        suggestions.append("Practice explaining concepts out loud")
        suggestions.append("Use the STAR method for behavioral questions")

    if scores.get('confidence', 0) < 70:
        suggestions.append("Take more mock interviews to build confidence")
        suggestions.append("Prepare for common follow-up questions")

    suggestions.append("Review your weak areas using the flashcard feature")
    suggestions.append("Take subject-specific quizzes regularly")

    return suggestions


def calculate_prs(interview, proctoring_log):
    """Calculate placement readiness score for this interview"""
    scores = interview.get('overall_scores', {})

    technical = scores.get('technical', 0) * 0.35
    communication = scores.get('communication', 0) * 0.25
    confidence = scores.get('confidence', 0) * 0.15

    integrity = 100
    if proctoring_log:
        integrity = proctoring_log.get('summary', {}).get('integrity_score', 100)

    prs = technical + communication + confidence + (integrity * 0.25)
    return round(prs, 2)


@reports_bp.route('/overall', methods=['POST'])
@jwt_required()
def generate_overall_report():
    """Generate overall performance report"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    # Get all user data
    user = db.users.find_one({'_id': ObjectId(user_id)})
    interviews = list(db.interviews.find({
        'user_id': ObjectId(user_id),
        'status': 'completed'
    }).sort('created_at', -1))
    quizzes = list(db.quizzes.find({
        'user_id': ObjectId(user_id),
        'status': 'completed'
    }).sort('created_at', -1))

    try:
        pdf_buffer = generate_overall_pdf(user, interviews, quizzes)

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'overall_report_{user_id}.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_overall_pdf(user, interviews, quizzes):
    """Generate overall performance PDF"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#1a365d')
    )

    story.append(Paragraph("Overall Performance Report", title_style))
    story.append(Paragraph(f"Candidate: {user.get('name', 'N/A')}", styles['Normal']))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d')}", styles['Normal']))
    story.append(Spacer(1, 30))

    # Summary stats
    story.append(Paragraph("Summary Statistics", styles['Heading2']))
    story.append(Paragraph(f"Total Interviews: {len(interviews)}", styles['Normal']))
    story.append(Paragraph(f"Total Quizzes: {len(quizzes)}", styles['Normal']))

    if interviews:
        avg_score = sum(i['overall_scores'].get('overall', 0) for i in interviews) / len(interviews)
        story.append(Paragraph(f"Average Interview Score: {avg_score:.1f}%", styles['Normal']))

    if quizzes:
        avg_quiz = sum(q.get('score', 0) for q in quizzes) / len(quizzes)
        story.append(Paragraph(f"Average Quiz Score: {avg_quiz:.1f}%", styles['Normal']))

    doc.build(story)
    buffer.seek(0)
    return buffer


@reports_bp.route('/list', methods=['GET'])
@jwt_required()
def list_reports():
    """List all generated reports"""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    reports = list(db.reports.find(
        {'user_id': ObjectId(user_id)}
    ).sort('created_at', -1))

    for report in reports:
        report['_id'] = str(report['_id'])
        report['user_id'] = str(report['user_id'])
        if report.get('interview_id'):
            report['interview_id'] = str(report['interview_id'])
        if report.get('created_at'):
            report['created_at'] = report['created_at'].isoformat()

    return jsonify({'reports': reports}), 200
