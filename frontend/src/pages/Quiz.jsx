import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { quizApi, flashcardApi } from '../services/api'
import toast from 'react-hot-toast'
import { FiPlay, FiClock } from 'react-icons/fi'

const Quiz = () => {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [formData, setFormData] = useState({
    subject: 'OS',
    topic: '',
    num_questions: 10,
    difficulty: 'medium'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [historyRes, subjectsRes] = await Promise.all([
        quizApi.getHistory(),
        flashcardApi.getSubjects()
      ])
      setQuizzes(historyRes.data.quizzes)
      setSubjects(subjectsRes.data.subjects)
      setTopics(subjectsRes.data.topics)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startQuiz = async () => {
    if (!formData.topic) {
      toast.error('Please select a topic')
      return
    }

    setGenerating(true)
    try {
      const response = await quizApi.generate(formData)
      navigate(`/quiz/${response.data.quiz_id}`)
    } catch (error) {
      toast.error('Failed to generate quiz')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quiz</h1>

      {/* Start New Quiz */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Start New Quiz</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value, topic: '' })}
              className="input"
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Topic</label>
            <select
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="input"
            >
              <option value="">Select topic</option>
              {topics[formData.subject]?.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Questions</label>
            <select
              value={formData.num_questions}
              onChange={(e) => setFormData({ ...formData, num_questions: parseInt(e.target.value) })}
              className="input"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="input"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={startQuiz}
              disabled={generating}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {generating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <FiPlay className="w-4 h-4" />
                  Start
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quiz History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quiz History</h2>
        {quizzes.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-500">No quizzes yet. Start one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <Link
                key={quiz._id}
                to={`/quiz/${quiz._id}/result`}
                className="card flex items-center justify-between hover:shadow-lg transition-shadow"
              >
                <div>
                  <h3 className="font-semibold">{quiz.subject} - {quiz.topic}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>{quiz.total_questions} questions</span>
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {quiz.created_at ? new Date(quiz.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    quiz.score >= 70 ? 'text-green-600' :
                    quiz.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {quiz.score?.toFixed(0) || 0}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {quiz.correct_answers}/{quiz.total_questions} correct
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Quiz
