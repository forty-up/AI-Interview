import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { interviewApi } from '../services/api'
import WebcamCapture from '../components/WebcamCapture'
import AudioRecorder from '../components/AudioRecorder'
import toast from 'react-hot-toast'
import { FiClock, FiChevronRight, FiCheck } from 'react-icons/fi'

const COMPANIES = [
  { id: 'general', name: 'General Practice' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'infosys', name: 'Infosys' },
  { id: 'tcs', name: 'TCS' },
  { id: 'cred', name: 'CRED' }
]

const ROUND_TYPES = [
  { id: 'hr', name: 'HR Round' },
  { id: 'technical', name: 'Technical Round' },
  { id: 'behavioral', name: 'Behavioral Round' },
  { id: 'system_design', name: 'System Design' }
]

const PERSONAS = [
  { id: 'strict_senior', name: 'Strict Senior Engineer' },
  { id: 'friendly_hr', name: 'Friendly HR' },
  { id: 'curious_fresher', name: 'Curious Fresher' },
  { id: 'logical_lead', name: 'Logical Tech Lead' }
]

const Interview = () => {
  const navigate = useNavigate()
  const [stage, setStage] = useState('setup') // setup, interview, completed
  const [config, setConfig] = useState({
    company: 'general',
    round_type: 'technical',
    persona: 'strict_senior'
  })

  // Interview state
  const [interviewId, setInterviewId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [timer, setTimer] = useState(0)
  const [communicationTips, setCommunicationTips] = useState([])
  const [proctoringData, setProctoringData] = useState({
    face_detected: false,
    emotion: 'neutral',
    confidence_level: 70,
    integrity_score: 100
  })

  // Timer effect
  useEffect(() => {
    let interval
    if (stage === 'interview') {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [stage])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startInterview = async () => {
    try {
      const response = await interviewApi.start(config)
      setInterviewId(response.data.interview_id)
      setQuestions(response.data.questions)
      setStage('interview')
      toast.success('Interview started!')
    } catch (error) {
      toast.error('Failed to start interview')
    }
  }

  const handleTranscription = async (text) => {
    setTranscription(text)

    // Get communication tips
    if (text.length > 20) {
      try {
        const response = await interviewApi.getCommunicationTips({ transcription: text })
        setCommunicationTips(response.data.tips?.all_tips || [])
      } catch (error) {
        console.error('Error getting communication tips:', error)
      }
    }
  }

  const submitAnswer = async () => {
    if (!transcription.trim()) {
      toast.error('Please record your answer first')
      return
    }

    setIsEvaluating(true)

    try {
      const response = await interviewApi.evaluate({
        interview_id: interviewId,
        question_id: currentQuestionIndex,
        question_text: questions[currentQuestionIndex].text,
        user_answer: transcription,
        round_type: config.round_type
      })

      setEvaluation(response.data)
      toast.success('Answer evaluated!')
    } catch (error) {
      toast.error('Evaluation failed')
    } finally {
      setIsEvaluating(false)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setTranscription('')
      setEvaluation(null)
      setCommunicationTips([])
    } else {
      completeInterview()
    }
  }

  const completeInterview = async () => {
    try {
      await interviewApi.complete({ interview_id: interviewId })
      setStage('completed')
      toast.success('Interview completed!')
    } catch (error) {
      toast.error('Failed to complete interview')
    }
  }

  const handleProctoringUpdate = (data) => {
    setProctoringData(data)
  }

  // Setup Stage
  if (stage === 'setup') {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Start Interview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure your mock interview session
          </p>
        </div>

        <div className="card space-y-6">
          {/* Company Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Select Company</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COMPANIES.map(company => (
                <button
                  key={company.id}
                  onClick={() => setConfig({ ...config, company: company.id })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.company === company.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>

          {/* Round Type */}
          <div>
            <label className="block text-sm font-medium mb-3">Interview Round</label>
            <div className="grid grid-cols-2 gap-3">
              {ROUND_TYPES.map(round => (
                <button
                  key={round.id}
                  onClick={() => setConfig({ ...config, round_type: round.id })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.round_type === round.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  {round.name}
                </button>
              ))}
            </div>
          </div>

          {/* Persona */}
          <div>
            <label className="block text-sm font-medium mb-3">Interviewer Persona</label>
            <div className="grid grid-cols-2 gap-3">
              {PERSONAS.map(persona => (
                <button
                  key={persona.id}
                  onClick={() => setConfig({ ...config, persona: persona.id })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.persona === persona.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  {persona.name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={startInterview} className="btn-primary w-full py-3 text-lg">
            Start Interview
          </button>
        </div>
      </div>
    )
  }

  // Completed Stage
  if (stage === 'completed') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <FiCheck className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">Interview Completed!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Great job! Your interview has been recorded and analyzed.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(`/interview/${interviewId}`)}
            className="btn-primary"
          >
            View Results
          </button>
          <button
            onClick={() => {
              setStage('setup')
              setInterviewId(null)
              setQuestions([])
              setCurrentQuestionIndex(0)
              setTranscription('')
              setEvaluation(null)
              setTimer(0)
            }}
            className="btn-secondary"
          >
            New Interview
          </button>
        </div>
      </div>
    )
  }

  // Interview Stage
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Interview Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Timer and Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <FiClock className="w-5 h-5" />
            <span className="font-mono">{formatTime(timer)}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Question */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">
            {questions[currentQuestionIndex]?.text || 'Loading question...'}
          </h2>
          {questions[currentQuestionIndex]?.focus && (
            <p className="text-sm text-gray-500">
              Focus: {questions[currentQuestionIndex].focus}
            </p>
          )}
        </div>

        {/* Audio Recorder */}
        <div className="card">
          <h3 className="font-semibold mb-4">Your Answer</h3>
          <AudioRecorder onTranscription={handleTranscription} />

          {transcription && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Transcription:</h4>
              <p className="text-gray-700 dark:text-gray-300">{transcription}</p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={submitAnswer}
              disabled={!transcription || isEvaluating}
              className="btn-primary flex items-center gap-2"
            >
              {isEvaluating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Evaluating...
                </>
              ) : (
                'Submit Answer'
              )}
            </button>
          </div>
        </div>

        {/* Evaluation Results */}
        {evaluation && (
          <div className="card">
            <h3 className="font-semibold mb-4">Evaluation</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {Object.entries(evaluation.scores || {}).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">
                    {typeof value === 'number' ? value.toFixed(0) : value}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">Feedback:</h4>
                <p className="text-gray-600 dark:text-gray-400">{evaluation.feedback}</p>
              </div>

              {evaluation.follow_up_questions?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium">Follow-up Questions:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                    {evaluation.follow_up_questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={nextQuestion}
              className="btn-primary mt-4 flex items-center gap-2"
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <FiChevronRight />
                </>
              ) : (
                'Complete Interview'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Webcam */}
        <div className="card">
          <h3 className="font-semibold mb-3">Video Proctoring</h3>
          <WebcamCapture
            interviewId={interviewId}
            onProctoringUpdate={handleProctoringUpdate}
            isActive={stage === 'interview'}
          />
        </div>

        {/* Communication Tips */}
        {communicationTips.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-3">Communication Tips</h3>
            <ul className="space-y-2 text-sm">
              {communicationTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span className="text-gray-600 dark:text-gray-400">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Proctoring Status */}
        <div className="card">
          <h3 className="font-semibold mb-3">Proctoring Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Face Detected</span>
              <span className={proctoringData.face_detected ? 'text-green-600' : 'text-red-600'}>
                {proctoringData.face_detected ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Emotion</span>
              <span className="capitalize text-blue-600">
                {proctoringData.emotion || 'neutral'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Confidence</span>
              <span className={proctoringData.confidence_level >= 60 ? 'text-green-600' : 'text-yellow-600'}>
                {proctoringData.confidence_level || 70}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Integrity Score</span>
              <span className="font-semibold">{proctoringData.integrity_score || 100}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interview
