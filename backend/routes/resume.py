from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.groq_service import GroqService
import PyPDF2
import docx
import io

resume_bp = Blueprint('resume', __name__)
groq_service = GroqService()


@resume_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_resume():
    """Analyze resume and provide suggestions"""
    try:
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file provided'}), 400

        file = request.files['resume']
        job_description = request.form.get('job_description', '')

        # Extract text from resume
        resume_text = extract_text_from_file(file)

        if not resume_text:
            return jsonify({'error': 'Could not extract text from resume'}), 400

        # Analyze resume using AI
        analysis = groq_service.analyze_resume(resume_text, job_description)

        return jsonify({
            'success': True,
            'analysis': analysis
        })

    except Exception as e:
        print(f"Resume analysis error: {e}")
        return jsonify({'error': str(e)}), 500


def extract_text_from_file(file):
    """Extract text from PDF or DOCX file"""
    filename = file.filename.lower()

    try:
        if filename.endswith('.pdf'):
            # Read PDF
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
            text = ''
            for page in pdf_reader.pages:
                text += page.extract_text() + '\n'
            return text.strip()

        elif filename.endswith('.docx'):
            # Read DOCX
            doc = docx.Document(io.BytesIO(file.read()))
            text = '\n'.join([para.text for para in doc.paragraphs])
            return text.strip()

        elif filename.endswith('.txt'):
            # Read plain text
            return file.read().decode('utf-8').strip()

        else:
            return None

    except Exception as e:
        print(f"Error extracting text: {e}")
        return None
