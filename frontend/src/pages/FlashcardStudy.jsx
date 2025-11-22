import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { flashcardApi } from '../services/api'
import { FiChevronLeft, FiChevronRight, FiRotateCw, FiCheck, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

const FlashcardStudy = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [flashcard, setFlashcard] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlashcard()
  }, [id])

  const fetchFlashcard = async () => {
    try {
      const response = await flashcardApi.getSet(id)
      setFlashcard(response.data)
    } catch (error) {
      toast.error('Failed to load flashcards')
      navigate('/flashcards')
    } finally {
      setLoading(false)
    }
  }

  const nextCard = () => {
    if (currentIndex < flashcard.cards.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setIsFlipped(false)
    }
  }

  const markCard = async (mastered) => {
    try {
      await flashcardApi.review(id, {
        card_id: flashcard.cards[currentIndex].card_id,
        mastered
      })
      nextCard()
    } catch (error) {
      console.error('Error marking card:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!flashcard || !flashcard.cards?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No flashcards found</p>
      </div>
    )
  }

  const currentCard = flashcard.cards[currentIndex]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{flashcard.subject} - {flashcard.topic}</h1>
          <p className="text-gray-500">Card {currentIndex + 1} of {flashcard.cards.length}</p>
        </div>
        <button onClick={() => navigate('/flashcards')} className="btn-secondary">
          Exit
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / flashcard.cards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        className={`flashcard h-80 cursor-pointer ${isFlipped ? 'flipped' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="flashcard-inner">
          {/* Front */}
          <div className="flashcard-front card flex items-center justify-center p-8 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <div className="text-center">
              <p className="text-sm opacity-75 mb-2">Question</p>
              <p className="text-xl font-medium">{currentCard.question}</p>
            </div>
          </div>

          {/* Back */}
          <div className="flashcard-back card flex items-center justify-center p-8 bg-gradient-to-br from-green-500 to-green-700 text-white">
            <div className="text-center">
              <p className="text-sm opacity-75 mb-2">Answer</p>
              <p className="text-lg">{currentCard.answer}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500">Click card to flip</p>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <FiChevronLeft /> Previous
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => markCard(false)}
            className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
            title="Need more practice"
          >
            <FiX className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="p-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            title="Flip card"
          >
            <FiRotateCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => markCard(true)}
            className="p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
            title="Mastered"
          >
            <FiCheck className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={nextCard}
          disabled={currentIndex === flashcard.cards.length - 1}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          Next <FiChevronRight />
        </button>
      </div>
    </div>
  )
}

export default FlashcardStudy
