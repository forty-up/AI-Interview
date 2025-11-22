# AI Interview & Placement Preparation Platform

A comprehensive full-stack web application that simulates real interviews, analyzes user behavior, generates academic quizzes, and provides deep AI-powered analytics.

## Features

### Core Features
- **Real Interview Simulator** - Practice interviews with AI-generated questions and real-time evaluation
- **Video Proctoring** - Face detection, eye gaze tracking, phone detection using MediaPipe & YOLOv8
- **Emotion & Voice Analysis** - Stress detection, confidence scoring, tone analysis
- **Flashcards & Quizzes** - AI-generated study materials for OS, CN, DBMS, OOPS
- **Group Discussion Simulation** - Practice GD skills with AI participants
- **Analytics Dashboard** - Track progress, identify weak areas, get learning recommendations
- **PDF Report Generation** - Downloadable detailed performance reports

### AI Integrations
- **Groq API** - LLaMA 3.1 70B for evaluation, Mixtral for fast generation, Whisper for STT
- **Google Gemini** - Flashcard and quiz generation
- **LangChain** - Multi-agent orchestration, interview chains
- **MediaPipe** - Face mesh, iris tracking
- **YOLOv8** - Object detection for proctoring

### Interview Modes
- HR Round
- Technical Round (DSA, CS fundamentals)
- Behavioral Round
- System Design (Simplified)

### Company-Specific Practice
- Amazon
- Microsoft
- Infosys
- TCS
- CRED

### Interviewer Personas
- Strict Senior Engineer
- Friendly HR
- Curious Fresher
- Logical Tech Lead

## Tech Stack

### Backend
- Flask
- MongoDB Atlas
- JWT Authentication
- LangChain
- Groq SDK
- Google GenerativeAI
- MediaPipe
- Ultralytics YOLOv8
- ReportLab (PDF generation)

### Frontend
- React 18
- Vite
- Tailwind CSS
- Chart.js
- React Router DOM
- React Webcam
- RecordRTC

## Project Structure

```
ai-interview-platform/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variables template
│   ├── routes/               # API endpoints
│   │   ├── auth.py
│   │   ├── interview.py
│   │   ├── flashcards.py
│   │   ├── quiz.py
│   │   ├── proctoring.py
│   │   ├── analytics.py
│   │   ├── reports.py
│   │   └── gd.py
│   ├── models/               # MongoDB schemas
│   │   └── schemas.py
│   ├── services/             # AI service integrations
│   │   ├── groq_service.py
│   │   ├── gemini_service.py
│   │   ├── langchain_service.py
│   │   └── proctoring_service.py
│   └── ai_pipelines/         # AI processing pipelines
│       └── interview_pipeline.py
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── context/          # React context providers
│       ├── components/       # Reusable components
│       ├── pages/            # Page components
│       └── services/         # API service
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB Atlas account (free tier)
- API keys for:
  - Groq API
  - Google Gemini API
  - HuggingFace (optional)

### 1. Clone the Repository

```bash
cd ai-interview-platform
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download YOLOv8 model (first run will auto-download)
# OR manually download yolov8n.pt from Ultralytics
```

### 3. Configure Environment Variables

Create `.env` file in backend folder:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai_interview_platform

# JWT
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Groq API (Get from https://console.groq.com)
GROQ_API_KEY=your-groq-api-key

# Google Gemini API (Get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key

# HuggingFace (optional)
HUGGINGFACE_API_KEY=your-huggingface-api-key

# App Config
FLASK_ENV=development
FLASK_DEBUG=1
```

### 4. Frontend Setup

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```
Backend will run on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:3000

### 6. Access the Application

Open http://localhost:3000 in your browser

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Interview
- `POST /api/interview/start` - Start new interview
- `POST /api/interview/transcribe` - Transcribe audio
- `POST /api/interview/evaluate` - Evaluate answer
- `POST /api/interview/complete` - Complete interview
- `GET /api/interview/history` - Get interview history
- `GET /api/interview/:id` - Get interview details

### Flashcards
- `POST /api/flashcards/generate` - Generate flashcards
- `GET /api/flashcards/list` - List flashcard sets
- `GET /api/flashcards/:id` - Get flashcard set
- `POST /api/flashcards/:id/review` - Review card

### Quiz
- `POST /api/quiz/generate` - Generate quiz
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/quiz/history` - Get quiz history
- `GET /api/quiz/:id` - Get quiz details
- `GET /api/quiz/analytics` - Get quiz analytics

### Proctoring
- `POST /api/proctoring/analyze-frame` - Analyze video frame
- `POST /api/proctoring/emotion` - Analyze emotion
- `POST /api/proctoring/voice-analysis` - Analyze voice
- `GET /api/proctoring/log/:id` - Get proctoring log

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/knowledge-graph` - Get knowledge graph
- `GET /api/analytics/meta-analysis` - Get meta analysis

### Reports
- `POST /api/reports/generate/:id` - Generate interview report
- `POST /api/reports/overall` - Generate overall report
- `GET /api/reports/list` - List reports

### Group Discussion
- `POST /api/gd/start` - Start GD session
- `POST /api/gd/contribute` - Add contribution
- `POST /api/gd/complete` - Complete GD
- `GET /api/gd/topics` - Get GD topics
- `GET /api/gd/history` - Get GD history

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Environment Variables:** Add all from `.env`
4. Deploy

### Frontend Deployment (Vercel)

1. Import project to Vercel
2. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:**
     - `VITE_API_URL`: Your Render backend URL
3. Deploy

### Frontend Deployment (Netlify)

1. Import from Git
2. Configure:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
3. Add `_redirects` file in `public/`:
   ```
   /api/* https://your-backend-url.onrender.com/api/:splat 200
   /* /index.html 200
   ```
4. Deploy

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string | Yes |
| SECRET_KEY | Flask secret key | Yes |
| JWT_SECRET_KEY | JWT secret key | Yes |
| GROQ_API_KEY | Groq API key | Yes |
| GEMINI_API_KEY | Google Gemini API key | Yes |
| HUGGINGFACE_API_KEY | HuggingFace API key | No |

## Getting API Keys

### Groq API
1. Visit https://console.groq.com
2. Sign up/Login
3. Navigate to API Keys
4. Create new API key

### Google Gemini API
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create API key

### MongoDB Atlas
1. Visit https://www.mongodb.com/atlas
2. Create free cluster
3. Get connection string from Connect > Drivers

## Usage Guide

### Starting an Interview

1. Navigate to Interview page
2. Select company, round type, and interviewer persona
3. Click "Start Interview"
4. Answer questions using the microphone
5. Receive real-time evaluation and follow-up questions
6. Complete interview to see overall scores

### Studying with Flashcards

1. Go to Flashcards page
2. Select subject and topic
3. Generate flashcards
4. Study by flipping cards
5. Mark cards as mastered or need practice

### Taking Quizzes

1. Navigate to Quiz page
2. Select subject, topic, and difficulty
3. Answer MCQ questions
4. Submit to see results and explanations

### Group Discussion

1. Go to Group Discussion page
2. Select a topic
3. Participate with AI participants
4. Get evaluated on participation, relevance, and politeness

### Viewing Analytics

1. Visit Analytics page
2. See Placement Readiness Score
3. View skill radar chart
4. Check weak areas and learning path
5. Track improvement over time

### Generating Reports

1. Go to Reports page
2. Generate interview-specific or overall reports
3. Download PDF for sharing

## Troubleshooting

### Common Issues

**Camera/Microphone not working:**
- Ensure browser has permissions
- Use HTTPS in production
- Check device availability

**API Errors:**
- Verify API keys are correct
- Check rate limits
- Ensure MongoDB is accessible

**Proctoring not detecting:**
- Ensure good lighting
- Face should be clearly visible
- YOLO model needs to be downloaded

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.

---

Built with AI-powered technologies for the next generation of interview preparation.
