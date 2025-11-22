import { useState, useEffect } from 'react'
import { analyticsApi } from '../services/api'
import { Line, Radar, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
)

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [knowledgeGraph, setKnowledgeGraph] = useState(null)
  const [metaAnalysis, setMetaAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [dashboardRes, kgRes, metaRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getKnowledgeGraph(),
        analyticsApi.getMetaAnalysis()
      ])
      setAnalytics(dashboardRes.data)
      setKnowledgeGraph(kgRes.data)
      setMetaAnalysis(metaRes.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
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

  const prs = analytics?.placement_readiness_score || { score: 0, breakdown: {} }

  // Radar chart for skills
  const skillsData = {
    labels: ['Technical', 'Communication', 'Confidence', 'Consistency', 'Integrity'],
    datasets: [
      {
        label: 'Your Skills',
        data: [
          prs.breakdown.technical || 0,
          prs.breakdown.communication || 0,
          prs.breakdown.confidence || 0,
          prs.breakdown.consistency || 0,
          prs.breakdown.integrity || 0
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)'
      }
    ]
  }

  // Trend chart
  const trendData = {
    labels: metaAnalysis?.trends?.map((_, i) => `Session ${i + 1}`) || [],
    datasets: [
      {
        label: 'Overall',
        data: metaAnalysis?.trends?.map(t => t.overall) || [],
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.3
      },
      {
        label: 'Technical',
        data: metaAnalysis?.trends?.map(t => t.technical) || [],
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.3
      },
      {
        label: 'Communication',
        data: metaAnalysis?.trends?.map(t => t.communication) || [],
        borderColor: 'rgb(245, 158, 11)',
        tension: 0.3
      }
    ]
  }

  // Subject performance bar chart
  const subjectData = {
    labels: Object.keys(analytics?.quiz_stats?.subject_breakdown || {}),
    datasets: [
      {
        label: 'Average Score',
        data: Object.values(analytics?.quiz_stats?.subject_breakdown || {}).map(s => s.avg_score || 0),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ]
      }
    ]
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics & Insights</h1>

      {/* PRS Card */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg opacity-90">Placement Readiness Score</h2>
            <div className="text-5xl font-bold mt-2">{prs.score.toFixed(0)}/100</div>
            <p className="mt-2 opacity-80 text-sm max-w-lg">{prs.explanation}</p>
          </div>
          {metaAnalysis?.improvement_rate !== undefined && (
            <div className={`text-right ${metaAnalysis.improvement_rate >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              <div className="text-3xl font-bold">
                {metaAnalysis.improvement_rate >= 0 ? '+' : ''}{metaAnalysis.improvement_rate.toFixed(1)}%
              </div>
              <div className="text-sm opacity-80">Improvement Rate</div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Radar */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Skills Overview</h3>
          <div className="h-72">
            <Radar
              data={skillsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Performance Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
          <div className="h-72">
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Subject Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
          <div className="h-72">
            <Bar
              data={subjectData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Knowledge Graph Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Knowledge Areas</h3>

          {knowledgeGraph?.weak_areas?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-600 mb-2">Needs Improvement</h4>
              <div className="space-y-2">
                {knowledgeGraph.weak_areas.slice(0, 3).map((area, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <span className="text-sm">{area.subject} - {area.topic}</span>
                    <span className="text-sm font-medium text-red-600">{area.proficiency?.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {knowledgeGraph?.strong_areas?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-600 mb-2">Strong Areas</h4>
              <div className="space-y-2">
                {knowledgeGraph.strong_areas.slice(0, 3).map((area, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="text-sm">{area.subject} - {area.topic}</span>
                    <span className="text-sm font-medium text-green-600">{area.proficiency?.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Learning Path */}
      {knowledgeGraph?.learning_path?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recommended Learning Path</h3>
          <div className="space-y-3">
            {knowledgeGraph.learning_path.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-medium">{item.subject} - {item.topic}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.recommended_action}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Current proficiency: {item.current_proficiency}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics
