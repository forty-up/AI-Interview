import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { quizApi } from '../services/api'
import { FiCheck, FiX, FiClock } from 'react-icons/fi'

const QuizResult = () => {
  const { id } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuiz()
  }, [id])

  const fetchQuiz = async () => {
    try {
      const response = await quizApi.getDetail(id)
      setQuiz(response.data)
    } catch (error) {
      console.error('Error fetching quiz:', error)
    } finally {
      setLoading(false)
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Summary */}
      <div className="card text-center">
        <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
        <p className="text-gray-500 mb-6">{quiz.subject} - {quiz.topic}</p>

        <div className={`text-6xl font-bold mb-4 ${
          quiz.score >= 70 ? 'text-green-600' :
          quiz.score >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {quiz.score?.toFixed(0)}%
        </div>

        <div className="flex justify-center gap-8 text-sm text-gray-600">
          <div>
            <span className="font-semibold text-lg text-green-600">{quiz.correct_answers}</span>
            <p>Correct</p>
          </div>
          <div>
            <span className="font-semibold text-lg text-red-600">{quiz.total_questions - quiz.correct_answers}</span>
            <p>Wrong</p>
          </div>
          <div className="flex items-center gap-1">
            <FiClock className="w-4 h-4" />
            <span>{formatTime(quiz.time_taken_seconds || 0)}</span>
          </div>
        </div>
      </div>

      {/* Questions Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Review Answers</h2>

        {quiz.questions?.map((q, index) => (
          <div key={index} className="card">
            <div className="flex items-start gap-3">
              <div className={`p-1 rounded-full ${
                q.is_correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {q.is_correct ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-3">Q{index + 1}: {q.question_text}</h3>

                <div className="space-y-2 mb-3">
                  {q.options?.map((option, optIndex) => {
                    const letter = option.charAt(0)
                    const isCorrect = letter === q.correct_answer
                    const isUserAnswer = letter === q.user_answer

                    return (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-lg ${
                          isCorrect ? 'bg-green-100 dark:bg-green-900/20 border border-green-300' :
                          isUserAnswer && !isCorrect ? 'bg-red-100 dark:bg-red-900/20 border border-red-300' :
                          'bg-gray-50 dark:bg-gray-700'
                        }`}
                      >
                        {option}
                        {isCorrect && <span className="ml-2 text-green-600 text-sm">(Correct)</span>}
                        {isUserAnswer && !isCorrect && <span className="ml-2 text-red-600 text-sm">(Your answer)</span>}
                      </div>
                    )
                  })}
                </div>

                {q.explanation && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Link to="/quiz" className="btn-primary">Take Another Quiz</Link>
        <Link to="/" className="btn-secondary">Back to Dashboard</Link>
      </div>
    </div>
  )
}

export default QuizResult
