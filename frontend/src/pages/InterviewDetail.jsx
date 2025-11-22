import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewApi, reportsApi, proctoringApi } from '../services/api'
import ScoreCard from '../components/ScoreCard'
import { FiDownload, FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'

const InterviewDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [interview, setInterview] = useState(null)
  const [proctoring, setProctoring] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [interviewRes, proctoringRes] = await Promise.all([
        interviewApi.getDetail(id),
        proctoringApi.getLog(id)
      ])
      setInterview(interviewRes.data)
      setProctoring(proctoringRes.data)
    } catch (error) {
      console.error('Error fetching interview:', error)
      toast.error('Failed to load interview')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async () => {
    try {
      const response = await reportsApi.generateInterview(id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `interview_report_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Report downloaded!')
    } catch (error) {
      toast.error('Failed to download report')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Interview not found</p>
      </div>
    )
  }

  const scores = interview.overall_scores || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {interview.company?.charAt(0).toUpperCase() + interview.company?.slice(1)} - {interview.round_type?.replace('_', ' ')}
            </h1>
            <p className="text-gray-500">
              {interview.created_at ? new Date(interview.created_at).toLocaleString() : '-'}
            </p>
          </div>
        </div>
        <button onClick={downloadReport} className="btn-primary flex items-center gap-2">
          <FiDownload className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard title="Overall" score={scores.overall || 0} color="primary" />
        <ScoreCard title="Technical" score={scores.technical || 0} color="blue" />
        <ScoreCard title="Communication" score={scores.communication || 0} color="green" />
        <ScoreCard title="Confidence" score={scores.confidence || 0} color="yellow" />
      </div>

      {/* Proctoring Summary */}
      {proctoring?.summary && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Proctoring Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold">{proctoring.summary.integrity_score?.toFixed(0) || 100}%</div>
              <div className="text-xs text-gray-500">Integrity Score</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold">{proctoring.summary.total_violations || 0}</div>
              <div className="text-xs text-gray-500">Violations</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold">{proctoring.summary.face_visible_percentage?.toFixed(0) || 100}%</div>
              <div className="text-xs text-gray-500">Face Visible</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold">{proctoring.summary.attention_score?.toFixed(0) || 100}%</div>
              <div className="text-xs text-gray-500">Attention</div>
            </div>
          </div>
        </div>
      )}

      {/* Questions & Answers */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Questions & Answers</h2>
        <div className="space-y-6">
          {interview.questions?.map((q, index) => (
            <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
              <h3 className="font-medium mb-2">Q{index + 1}: {q.question_text}</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">{q.user_answer}</p>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                {Object.entries(q.scores || {}).map(([key, value]) => (
                  <div key={key} className="text-center p-2 bg-primary-50 dark:bg-primary-900/20 rounded">
                    <div className="font-bold text-primary-600">{typeof value === 'number' ? value.toFixed(0) : value}</div>
                    <div className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
              {q.ai_feedback && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Feedback:</strong> {q.ai_feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InterviewDetail
