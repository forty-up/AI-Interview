import { useState, useEffect } from 'react'
import { reportsApi, interviewApi } from '../services/api'
import toast from 'react-hot-toast'
import { FiDownload, FiFileText, FiCalendar } from 'react-icons/fi'

const Reports = () => {
  const [reports, setReports] = useState([])
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [reportsRes, interviewsRes] = await Promise.all([
        reportsApi.list(),
        interviewApi.getHistory()
      ])
      setReports(reportsRes.data.reports)
      setInterviews(interviewsRes.data.interviews.filter(i => i.status === 'completed'))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateInterviewReport = async (interviewId) => {
    setGenerating(true)
    try {
      const response = await reportsApi.generateInterview(interviewId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `interview_report_${interviewId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Report downloaded!')
      fetchData() // Refresh list
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const generateOverallReport = async () => {
    setGenerating(true)
    try {
      const response = await reportsApi.generateOverall()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'overall_performance_report.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Overall report downloaded!')
    } catch (error) {
      toast.error('Failed to generate report')
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
        <button
          onClick={generateOverallReport}
          disabled={generating}
          className="btn-primary flex items-center gap-2"
        >
          {generating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <FiDownload className="w-4 h-4" />
              Overall Report
            </>
          )}
        </button>
      </div>

      {/* Generate from Interviews */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Generate Interview Reports</h2>
        {interviews.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No completed interviews. Complete an interview to generate reports.
          </p>
        ) : (
          <div className="space-y-3">
            {interviews.slice(0, 5).map((interview) => (
              <div
                key={interview._id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <h3 className="font-medium">
                    {interview.company?.charAt(0).toUpperCase() + interview.company?.slice(1)} - {interview.round_type?.replace('_', ' ')}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <FiCalendar className="w-3 h-3" />
                    {interview.created_at ? new Date(interview.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-primary-600">
                    {interview.overall_scores?.overall?.toFixed(0) || 0}%
                  </span>
                  <button
                    onClick={() => generateInterviewReport(interview._id)}
                    disabled={generating}
                    className="btn-secondary text-sm py-1 px-3 flex items-center gap-1"
                  >
                    <FiDownload className="w-3 h-3" />
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Reports */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Generated Reports</h2>
        {reports.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No reports generated yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report._id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FiFileText className="w-5 h-5 text-primary-600" />
                  <div>
                    <h3 className="font-medium capitalize">{report.report_type} Report</h3>
                    <p className="text-sm text-gray-500">
                      {report.created_at ? new Date(report.created_at).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
                {report.content?.placement_readiness_score && (
                  <span className="text-lg font-bold text-primary-600">
                    PRS: {report.content.placement_readiness_score.toFixed(0)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">About Reports</h3>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          Reports include detailed analysis of your performance, including scores, strengths,
          weaknesses, improvement suggestions, and your Placement Readiness Score.
          Download PDF reports to share with mentors or track your progress over time.
        </p>
      </div>
    </div>
  )
}

export default Reports
