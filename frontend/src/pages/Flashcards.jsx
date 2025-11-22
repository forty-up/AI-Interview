import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { flashcardApi } from '../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiTrash2, FiBook } from 'react-icons/fi'

const Flashcards = () => {
  const navigate = useNavigate()
  const [flashcards, setFlashcards] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [formData, setFormData] = useState({
    subject: 'OS',
    topic: '',
    count: 10,
    difficulty: 'medium'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [flashcardsRes, subjectsRes] = await Promise.all([
        flashcardApi.list(),
        flashcardApi.getSubjects()
      ])
      setFlashcards(flashcardsRes.data.flashcards)
      setSubjects(subjectsRes.data.subjects)
      setTopics(subjectsRes.data.topics)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateFlashcards = async () => {
    if (!formData.topic) {
      toast.error('Please select a topic')
      return
    }

    setGenerating(true)
    try {
      const response = await flashcardApi.generate(formData)
      toast.success('Flashcards generated!')
      navigate(`/flashcards/${response.data.flashcard_id}`)
    } catch (error) {
      toast.error('Failed to generate flashcards')
    } finally {
      setGenerating(false)
    }
  }

  const deleteFlashcard = async (id) => {
    if (!confirm('Delete this flashcard set?')) return

    try {
      await flashcardApi.delete(id)
      setFlashcards(flashcards.filter(f => f._id !== id))
      toast.success('Flashcard set deleted')
    } catch (error) {
      toast.error('Failed to delete')
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
      <h1 className="text-3xl font-bold">Flashcards</h1>

      {/* Generate New */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Generate New Flashcards</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              onClick={generateFlashcards}
              disabled={generating}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {generating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <FiPlus className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Existing Flashcards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Flashcard Sets</h2>
        {flashcards.length === 0 ? (
          <div className="card text-center py-8">
            <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No flashcards yet. Generate some above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcards.map((fc) => (
              <div key={fc._id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{fc.subject}</h3>
                    <p className="text-sm text-gray-500">{fc.topic}</p>
                  </div>
                  <button
                    onClick={() => deleteFlashcard(fc._id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Created: {fc.created_at ? new Date(fc.created_at).toLocaleDateString() : '-'}
                </p>
                <Link
                  to={`/flashcards/${fc._id}`}
                  className="btn-primary w-full text-center block"
                >
                  Study
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Flashcards
