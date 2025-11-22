import { useRef, useCallback, useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import { proctoringApi } from '../services/api'

const WebcamCapture = ({ onProctoringUpdate, interviewId, isActive = true }) => {
  const webcamRef = useRef(null)
  const [violations, setViolations] = useState([])
  const [integrityScore, setIntegrityScore] = useState(100)

  // Debug: Log when component mounts and props change
  useEffect(() => {
    console.log('WebcamCapture mounted/updated - isActive:', isActive, 'interviewId:', interviewId)
  }, [isActive, interviewId])

  const captureFrame = useCallback(async () => {
    console.log('captureFrame called, isActive:', isActive, 'webcamRef:', !!webcamRef.current)

    if (!webcamRef.current || !isActive) {
      console.log('Webcam not ready or not active')
      return
    }

    const imageSrc = webcamRef.current.getScreenshot()
    console.log('Screenshot captured:', imageSrc ? 'success' : 'failed')

    if (!imageSrc) {
      console.log('Failed to get screenshot from webcam')
      return
    }

    try {
      const response = await proctoringApi.analyzeFrame({
        interview_id: interviewId,
        frame: imageSrc
      })

      const data = response.data
      setViolations(data.violations || [])
      setIntegrityScore(data.integrity_score || 100)

      if (onProctoringUpdate) {
        onProctoringUpdate({
          face_detected: data.face_detected,
          emotion: data.emotion || 'neutral',
          confidence_level: data.confidence_level || 70,
          integrity_score: data.integrity_score || 100,
          violations: data.violations || []
        })
      }
    } catch (error) {
      console.error('Proctoring analysis error:', error)
    }
  }, [interviewId, isActive, onProctoringUpdate])

  useEffect(() => {
    if (!isActive) {
      console.log('Proctoring not active, skipping capture setup')
      return
    }

    console.log('Setting up proctoring capture interval')
    let interval

    // Wait for webcam to initialize before starting capture
    const startDelay = setTimeout(() => {
      console.log('Starting proctoring capture')
      captureFrame() // Initial capture
      interval = setInterval(captureFrame, 3000) // Analyze every 3 seconds
    }, 2000)

    return () => {
      console.log('Cleaning up proctoring capture')
      clearTimeout(startDelay)
      if (interval) clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, interviewId])

  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        className="rounded-lg w-full"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: 'user'
        }}
      />

      {/* Proctoring overlay */}
      <div className="absolute top-2 right-2 space-y-1">
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          integrityScore >= 80 ? 'bg-green-500' :
          integrityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
        } text-white`}>
          Integrity: {integrityScore}%
        </div>

        {violations.map((v, i) => (
          <div
            key={i}
            className={`px-2 py-1 rounded text-xs ${
              v.severity === 'high' ? 'bg-red-500' :
              v.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
            } text-white`}
          >
            {v.type.replace(/_/g, ' ')}
          </div>
        ))}
      </div>
    </div>
  )
}

export default WebcamCapture
