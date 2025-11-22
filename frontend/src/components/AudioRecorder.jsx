import { useState, useRef } from 'react'
import { FiMic, FiSquare } from 'react-icons/fi'
import RecordRTC from 'recordrtc'
import { interviewApi } from '../services/api'

const AudioRecorder = ({ onTranscription, onRecordingChange }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000
      })

      recorderRef.current.startRecording()
      setIsRecording(true)
      onRecordingChange?.(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = async () => {
    if (!recorderRef.current) return

    setIsRecording(false)
    setIsProcessing(true)
    onRecordingChange?.(false)

    recorderRef.current.stopRecording(async () => {
      const blob = recorderRef.current.getBlob()

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Send to backend for transcription
      try {
        const formData = new FormData()
        formData.append('audio', blob, 'recording.wav')

        const response = await interviewApi.transcribe(formData)
        onTranscription?.(response.data.transcription)
      } catch (error) {
        console.error('Transcription error:', error)
        onTranscription?.('')
      } finally {
        setIsProcessing(false)
      }
    })
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-primary-600 hover:bg-primary-700 text-white'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isRecording ? (
          <>
            <FiSquare className="w-5 h-5" />
            Stop Recording
          </>
        ) : isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            Processing...
          </>
        ) : (
          <>
            <FiMic className="w-5 h-5" />
            Start Recording
          </>
        )}
      </button>

      {isRecording && (
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full recording-pulse" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Recording...</span>
        </div>
      )}
    </div>
  )
}

export default AudioRecorder
