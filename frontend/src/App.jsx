import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'

// Layout
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import InterviewHistory from './pages/InterviewHistory'
import InterviewDetail from './pages/InterviewDetail'
import Flashcards from './pages/Flashcards'
import FlashcardStudy from './pages/FlashcardStudy'
import Quiz from './pages/Quiz'
import QuizAttempt from './pages/QuizAttempt'
import QuizResult from './pages/QuizResult'
import Analytics from './pages/Analytics'
import GroupDiscussion from './pages/GroupDiscussion'
import Profile from './pages/Profile'
import Reports from './pages/Reports'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="interview" element={<Interview />} />
          <Route path="interview/history" element={<InterviewHistory />} />
          <Route path="interview/:id" element={<InterviewDetail />} />
          <Route path="flashcards" element={<Flashcards />} />
          <Route path="flashcards/:id" element={<FlashcardStudy />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="quiz/:id" element={<QuizAttempt />} />
          <Route path="quiz/:id/result" element={<QuizResult />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="gd" element={<GroupDiscussion />} />
          <Route path="profile" element={<Profile />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
