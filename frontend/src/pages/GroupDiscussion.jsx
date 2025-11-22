import { useState, useEffect, useRef } from 'react'
import { gdApi } from '../services/api'
import toast from 'react-hot-toast'
import { FiSend, FiUsers, FiMic, FiType } from 'react-icons/fi'
import AudioRecorder from '../components/AudioRecorder'

const GroupDiscussion = () => {
  const [stage, setStage] = useState('setup') // setup, discussion, completed
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState(null)
  const [inputMode, setInputMode] = useState('voice') // 'voice' or 'text'
  const messagesEndRef = useRef(null)

  const handleTranscription = (text) => {
    setUserInput(text)
  }

  useEffect(() => {
    fetchTopics()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchTopics = async () => {
    try {
      const response = await gdApi.getTopics()
      setTopics(response.data.topics)
      if (response.data.topics.length > 0) {
        setSelectedTopic(response.data.topics[0])
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  const startDiscussion = async () => {
    try {
      const response = await gdApi.start({ topic: selectedTopic })
      setSessionId(response.data.session_id)
      setParticipants(response.data.ai_participants)

      // Add initial messages
      const initialMessages = response.data.ai_participants.map(p => ({
        sender: p.name,
        text: p.initial_statement,
        isUser: false
      }))
      setMessages(initialMessages)
      setStage('discussion')
      toast.success('Discussion started!')
    } catch (error) {
      toast.error('Failed to start discussion')
    }
  }

  const submitContribution = async () => {
    if (!userInput.trim()) return

    setIsSubmitting(true)
    const userMessage = userInput
    setUserInput('')

    // Add user message
    setMessages(prev => [...prev, {
      sender: 'You',
      text: userMessage,
      isUser: true
    }])

    try {
      const response = await gdApi.contribute({
        session_id: sessionId,
        statement: userMessage
      })

      // Add AI responses
      const aiMessages = response.data.ai_responses.map(r => ({
        sender: r.name,
        text: r.response,
        isUser: false
      }))
      setMessages(prev => [...prev, ...aiMessages])

    } catch (error) {
      toast.error('Failed to submit contribution')
    } finally {
      setIsSubmitting(false)
    }
  }

  const endDiscussion = async () => {
    try {
      const response = await gdApi.complete({ session_id: sessionId })
      setResults(response.data)
      setStage('completed')
      toast.success('Discussion completed!')
    } catch (error) {
      toast.error('Failed to complete discussion')
    }
  }

  // Setup Stage
  if (stage === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Group Discussion</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Practice your GD skills with AI participants
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Select a Topic</h2>
          <div className="space-y-3">
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedTopic === topic
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          <button
            onClick={startDiscussion}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
          >
            <FiUsers className="w-5 h-5" />
            Start Discussion
          </button>
        </div>
      </div>
    )
  }

  // Completed Stage
  if (stage === 'completed') {
    const scores = results?.overall_scores || {}

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card text-center">
          <h1 className="text-3xl font-bold mb-4">Discussion Complete!</h1>

          <div className="text-5xl font-bold text-primary-600 mb-4">
            {scores.overall?.toFixed(0) || 0}%
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xl font-bold">{scores.participation?.toFixed(0)}%</div>
              <div className="text-xs text-gray-500">Participation</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xl font-bold">{scores.relevance?.toFixed(0)}%</div>
              <div className="text-xs text-gray-500">Relevance</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xl font-bold">{scores.politeness?.toFixed(0)}%</div>
              <div className="text-xs text-gray-500">Politeness</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xl font-bold">{scores.dominance?.toFixed(0)}%</div>
              <div className="text-xs text-gray-500">Dominance</div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-left">
            <strong>Feedback:</strong> {results?.feedback}
          </div>
        </div>

        <button
          onClick={() => {
            setStage('setup')
            setMessages([])
            setSessionId(null)
            setResults(null)
          }}
          className="btn-primary w-full"
        >
          Start New Discussion
        </button>
      </div>
    )
  }

  // Discussion Stage
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Group Discussion</h1>
          <p className="text-sm text-gray-500">{selectedTopic}</p>
        </div>
        <button onClick={endDiscussion} className="btn-secondary">
          End Discussion
        </button>
      </div>

      {/* Participants */}
      <div className="flex gap-2">
        {participants.map((p) => (
          <div key={p.name} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
            {p.name}
          </div>
        ))}
        <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm">
          You
        </div>
      </div>

      {/* Messages */}
      <div className="card h-96 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                msg.isUser
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700'
              } rounded-lg p-3`}>
                <div className="text-xs font-medium opacity-75 mb-1">{msg.sender}</div>
                <div className="text-sm">{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setInputMode('voice')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            inputMode === 'voice'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          <FiMic className="w-4 h-4" />
          Voice
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            inputMode === 'text'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          <FiType className="w-4 h-4" />
          Text
        </button>
      </div>

      {/* Input */}
      <div className="card">
        {inputMode === 'voice' ? (
          <div className="space-y-4">
            <AudioRecorder onTranscription={handleTranscription} />
            {userInput && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">{userInput}</p>
              </div>
            )}
            <button
              onClick={submitContribution}
              disabled={isSubmitting || !userInput.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <FiSend className="w-5 h-5" />
                  Send Contribution
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitContribution()}
              placeholder="Share your thoughts..."
              className="input flex-1"
              disabled={isSubmitting}
            />
            <button
              onClick={submitContribution}
              disabled={isSubmitting || !userInput.trim()}
              className="btn-primary px-6"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <FiSend className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupDiscussion
