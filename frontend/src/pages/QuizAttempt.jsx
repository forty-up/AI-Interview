import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizApi } from '../services/api'
import toast from 'react-hot-toast'
import { FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const QuizAttempt = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    fetchQuiz()
  }, [id])

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchQuiz = async () => {
    try {
      const response = await quizApi.getDetail(id)
      if (response.data.status === 'completed') {
        navigate(`/dashboard/quiz/${id}/result`)
        return
      }
      setQuiz(response.data)
    } catch (error) {
      toast.error('Failed to load quiz')
      navigate('/dashboard/quiz')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const selectAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const submitQuiz = async () => {
    setSubmitting(true)
    try {
      await quizApi.submit({
        quiz_id: id,
        answers,
        time_taken_seconds: timer
      })
      navigate(`/dashboard/quiz/${id}/result`)
    } catch (error) {
      toast.error('Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!quiz) return null

  const currentQuestion = quiz.questions[currentIndex]
  const answeredCount = Object.keys(answers).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{quiz.subject} - {quiz.topic}</h1>
          <p className="text-gray-500">Question {currentIndex + 1} of {quiz.questions.length}</p>
        </div>
        <div className="flex items-center gap-2 text-lg">
          <FiClock className="w-5 h-5" />
          <span className="font-mono">{formatTime(timer)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {quiz.questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`flex-1 h-2 rounded ${
              index === currentIndex ? 'bg-primary-600' :
              answers[quiz.questions[index].question_id] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="card">
        <h2 className="text-lg font-medium mb-6">{currentQuestion.question_text}</h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const letter = option.charAt(0)
            const isSelected = answers[currentQuestion.question_id] === letter

            return (
              <button
                key={index}
                onClick={() => selectAnswer(currentQuestion.question_id, letter)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <FiChevronLeft /> Previous
        </button>

        <span className="text-sm text-gray-500">
          {answeredCount}/{quiz.questions.length} answered
        </span>

        {currentIndex === quiz.questions.length - 1 ? (
          <button
            onClick={submitQuiz}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              'Submit Quiz'
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(quiz.questions.length - 1, currentIndex + 1))}
            className="btn-secondary flex items-center gap-2"
          >
            Next <FiChevronRight />
          </button>
        )}
      </div>
    </div>
  )
}

export default QuizAttempt
