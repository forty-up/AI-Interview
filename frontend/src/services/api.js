import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Interview API
export const interviewApi = {
  start: (data) => api.post('/interview/start', data),
  transcribe: (formData) => api.post('/interview/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  evaluate: (data) => api.post('/interview/evaluate', data),
  complete: (data) => api.post('/interview/complete', data),
  getHistory: () => api.get('/interview/history'),
  getDetail: (id) => api.get(`/interview/${id}`),
  generateQuestions: (data) => api.post('/interview/questions/generate', data),
  getCommunicationTips: (data) => api.post('/interview/communication-tips', data)
}

// Flashcard API
export const flashcardApi = {
  generate: (data) => api.post('/flashcards/generate', data),
  list: () => api.get('/flashcards/list'),
  getSet: (id) => api.get(`/flashcards/${id}`),
  review: (id, data) => api.post(`/flashcards/${id}/review`, data),
  delete: (id) => api.delete(`/flashcards/${id}`),
  getSubjects: () => api.get('/flashcards/subjects')
}

// Quiz API
export const quizApi = {
  generate: (data) => api.post('/quiz/generate', data),
  submit: (data) => api.post('/quiz/submit', data),
  getHistory: () => api.get('/quiz/history'),
  getDetail: (id) => api.get(`/quiz/${id}`),
  getAnalytics: () => api.get('/quiz/analytics')
}

// Proctoring API
export const proctoringApi = {
  analyzeFrame: (data) => api.post('/proctoring/analyze-frame', data),
  analyzeAudio: (formData) => api.post('/proctoring/analyze-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  analyzeEmotion: (data) => api.post('/proctoring/emotion', data),
  analyzeVoice: (formData) => api.post('/proctoring/voice-analysis', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getLog: (interviewId) => api.get(`/proctoring/log/${interviewId}`),
  getIntegrityScore: (interviewId) => api.get(`/proctoring/integrity-score/${interviewId}`),
  getTimeline: (interviewId) => api.get(`/proctoring/timeline/${interviewId}`)
}

// Analytics API
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getKnowledgeGraph: () => api.get('/analytics/knowledge-graph'),
  getMetaAnalysis: () => api.get('/analytics/meta-analysis')
}

// Reports API
export const reportsApi = {
  generateInterview: (interviewId) => api.post(`/reports/generate/${interviewId}`, {}, {
    responseType: 'blob'
  }),
  generateOverall: () => api.post('/reports/overall', {}, {
    responseType: 'blob'
  }),
  list: () => api.get('/reports/list')
}

// Group Discussion API
export const gdApi = {
  start: (data) => api.post('/gd/start', data),
  contribute: (data) => api.post('/gd/contribute', data),
  complete: (data) => api.post('/gd/complete', data),
  getTopics: () => api.get('/gd/topics'),
  getHistory: () => api.get('/gd/history')
}
