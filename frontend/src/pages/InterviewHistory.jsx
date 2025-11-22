import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { interviewApi } from '../services/api'
import { FiClock, FiChevronRight } from 'react-icons/fi'

const InterviewHistory = () => {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await interviewApi.getHistory()
      setInterviews(response.data.interviews)
    } catch (error) {
      console.error('Error fetching history:', error)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Interview History</h1>
        <Link to="/interview" className="btn-primary">New Interview</Link>
      </div>

      {interviews.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No interviews yet. Start practicing!</p>
          <Link to="/interview" className="btn-primary mt-4">Start Interview</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <Link
              key={interview._id}
              to={`/interview/${interview._id}`}
              className="card flex items-center justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                <h3 className="font-semibold">
                  {interview.company?.charAt(0).toUpperCase() + interview.company?.slice(1)} - {interview.round_type?.replace('_', ' ')}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    {interview.created_at ? new Date(interview.created_at).toLocaleDateString() : '-'}
                  </span>
                  <span className={`px-2 py-0.5 rounded ${
                    interview.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {interview.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {interview.overall_scores?.overall?.toFixed(0) || 0}%
                  </div>
                  <div className="text-xs text-gray-500">Overall Score</div>
                </div>
                <FiChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default InterviewHistory
