from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # 24 hours

# Initialize extensions
CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

# MongoDB connection
mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/ai_interview_platform')
client = MongoClient(mongo_uri)
db = client.get_database()

# Make db available to routes
app.config['db'] = db

# Import and register blueprints
from routes.auth import auth_bp
from routes.interview import interview_bp
from routes.flashcards import flashcards_bp
from routes.quiz import quiz_bp
from routes.proctoring import proctoring_bp
from routes.analytics import analytics_bp
from routes.reports import reports_bp
from routes.gd import gd_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(interview_bp, url_prefix='/api/interview')
app.register_blueprint(flashcards_bp, url_prefix='/api/flashcards')
app.register_blueprint(quiz_bp, url_prefix='/api/quiz')
app.register_blueprint(proctoring_bp, url_prefix='/api/proctoring')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(reports_bp, url_prefix='/api/reports')
app.register_blueprint(gd_bp, url_prefix='/api/gd')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'AI Interview Platform API is running'})

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
