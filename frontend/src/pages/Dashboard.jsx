import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { analyticsApi } from '../services/api'
import ScoreCard from '../components/ScoreCard'
import { FiVideo, FiBook, FiHelpCircle, FiTrendingUp, FiAward, FiTarget } from 'react-icons/fi'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const Dashboard = () => {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsApi.getDashboard()
      setAnalytics(response.data)
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

  // Chart data for performance trend
  const trendData = {
    labels: analytics?.recent_activity?.slice(0, 5).map((_, i) => `Session ${i + 1}`) || [],
    datasets: [
      {
        label: 'Performance Score',
        data: analytics?.recent_activity?.slice(0, 5).map(a => a.score) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3
      }
    ]
  }

  // Doughnut chart for skill breakdown
  const skillData = {
    labels: ['Technical', 'Communication', 'Confidence', 'Consistency', 'Integrity'],
    datasets: [
      {
        data: [
          prs.breakdown.technical || 0,
          prs.breakdown.communication || 0,
          prs.breakdown.confidence || 0,
          prs.breakdown.consistency || 0,
          prs.breakdown.integrity || 0
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ]
      }
    ]
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your progress and continue your preparation
          </p>
        </div>
        <Link to="/interview" className="btn-primary">
          Start New Interview
        </Link>
      </div>

      {/* Placement Readiness Score */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold opacity-90">Placement Readiness Score</h2>
            <div className="text-5xl font-bold mt-2">{prs.score.toFixed(0)}</div>
            <p className="mt-2 opacity-80 text-sm">{prs.explanation}</p>
          </div>
          <FiAward className="w-20 h-20 opacity-30" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard
          title="Total Interviews"
          score={analytics?.interview_stats?.total_interviews || 0}
          maxScore={100}
          color="primary"
          icon={FiVideo}
        />
        <ScoreCard
          title="Average Interview Score"
          score={analytics?.interview_stats?.avg_score || 0}
          maxScore={100}
          color="green"
          icon={FiTrendingUp}
        />
        <ScoreCard
          title="Total Quizzes"
          score={analytics?.quiz_stats?.total_quizzes || 0}
          maxScore={100}
          color="yellow"
          icon={FiHelpCircle}
        />
        <ScoreCard
          title="Average Quiz Score"
          score={analytics?.quiz_stats?.avg_score || 0}
          maxScore={100}
          color="blue"
          icon={FiTarget}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
          <div className="h-64">
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

        {/* Skill Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Skill Breakdown</h3>
          <div className="h-64">
            <Doughnut
              data={skillData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/interview" className="card hover:shadow-xl transition-shadow">
          <FiVideo className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-lg">Practice Interview</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Simulate real interviews with AI feedback
          </p>
        </Link>

        <Link to="/flashcards" className="card hover:shadow-xl transition-shadow">
          <FiBook className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-lg">Study Flashcards</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Review concepts with AI-generated cards
          </p>
        </Link>

        <Link to="/quiz" className="card hover:shadow-xl transition-shadow">
          <FiHelpCircle className="w-8 h-8 text-yellow-600 mb-3" />
          <h3 className="font-semibold text-lg">Take a Quiz</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Test your knowledge with MCQs
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        {analytics?.recent_activity?.length > 0 ? (
          <div className="space-y-3">
            {analytics.recent_activity.slice(0, 5).map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <span className="font-medium">{activity.description}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    activity.type === 'interview' ? 'bg-primary-100 text-primary-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {activity.type}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{activity.score?.toFixed(0)}%</span>
                  <span className="text-sm text-gray-500">
                    {activity.date ? new Date(activity.date).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity. Start practicing!</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
