import { useState } from 'react'
import { FiUpload, FiFileText, FiCheckCircle, FiAlertCircle, FiTarget, FiTrendingUp } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../services/api'

const Resume = () => {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Please upload a PDF, DOCX, or TXT file')
        return
      }
      setFile(selectedFile)
    }
  }

  const analyzeResume = async () => {
    if (!file) {
      toast.error('Please upload a resume')
      return
    }

    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('resume', file)
      if (jobDescription.trim()) {
        formData.append('job_description', jobDescription)
      }

      const response = await api.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setAnalysis(response.data.analysis)
      toast.success('Resume analyzed successfully!')
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze resume')
    } finally {
      setAnalyzing(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Analyzer</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your resume to get AI-powered feedback and improvement suggestions
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Upload Resume</h2>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <FiUpload className="w-10 h-10 text-gray-400 mb-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, DOCX, or TXT (max 5MB)
                </span>
              </label>
            </div>

            {file && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <FiFileText className="text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">{file.name}</span>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Job Description (Optional)</h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to get tailored suggestions..."
              className="input-field h-40 resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Providing a job description helps us give more targeted recommendations
            </p>
          </div>

          <button
            onClick={analyzeResume}
            disabled={!file || analyzing}
            className="btn-primary w-full disabled:opacity-50"
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              'Analyze Resume'
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {analysis ? (
            <>
              {/* Scores */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Analysis Scores</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${getScoreBg(analysis.overall_score)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FiTarget className={getScoreColor(analysis.overall_score)} />
                      <span className="text-sm font-medium">Overall Score</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                      {analysis.overall_score}%
                    </span>
                  </div>
                  <div className={`p-4 rounded-lg ${getScoreBg(analysis.ats_score)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FiTrendingUp className={getScoreColor(analysis.ats_score)} />
                      <span className="text-sm font-medium">ATS Score</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.ats_score)}`}>
                      {analysis.ats_score}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {analysis.summary && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-3">Summary</h2>
                  <p className="text-gray-700 dark:text-gray-300">{analysis.summary}</p>
                </div>
              )}

              {/* Strengths */}
              {analysis.strengths?.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FiCheckCircle className="text-green-600" />
                    Strengths
                  </h2>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">+</span>
                        <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {analysis.weaknesses?.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FiAlertCircle className="text-red-600" />
                    Areas for Improvement
                  </h2>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">-</span>
                        <span className="text-gray-700 dark:text-gray-300">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Keywords */}
              {analysis.missing_keywords?.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-3">Missing Keywords</h2>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missing_keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions?.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-3">Suggestions</h2>
                  <ol className="space-y-3">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Format Improvements */}
              {analysis.format_improvements?.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-3">Format Improvements</h2>
                  <ul className="space-y-2">
                    {analysis.format_improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">*</span>
                        <span className="text-gray-700 dark:text-gray-300">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center h-64 text-center">
              <FiFileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Upload a resume to see analysis results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Resume
