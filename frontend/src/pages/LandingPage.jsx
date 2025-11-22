import { Link } from 'react-router-dom'
import { FiArrowRight, FiMic, FiVideo, FiBarChart2, FiUsers, FiBookOpen, FiAward, FiPlay, FiCheck } from 'react-icons/fi'

const LandingPage = () => {
  const features = [
    {
      icon: <FiMic className="w-5 h-5" />,
      title: 'Voice-Based Interviews',
      description: 'Practice speaking your answers with real-time transcription and natural conversation flow.'
    },
    {
      icon: <FiVideo className="w-5 h-5" />,
      title: 'Smart Proctoring',
      description: 'Face detection, emotion tracking, and attention monitoring for realistic interview simulation.'
    },
    {
      icon: <FiBarChart2 className="w-5 h-5" />,
      title: 'Detailed Analytics',
      description: 'Track your progress with comprehensive metrics and personalized improvement insights.'
    },
    {
      icon: <FiUsers className="w-5 h-5" />,
      title: 'Group Discussions',
      description: 'Practice GD rounds with AI participants that respond intelligently to your arguments.'
    },
    {
      icon: <FiBookOpen className="w-5 h-5" />,
      title: 'Study Materials',
      description: 'AI-generated flashcards and quizzes covering DSA, OS, DBMS, CN, and OOPs concepts.'
    },
    {
      icon: <FiAward className="w-5 h-5" />,
      title: 'Company Preparation',
      description: 'Tailored interview prep for Amazon, Microsoft, Google, TCS, Infosys, and more.'
    }
  ]

  const benefits = [
    'Unlimited practice sessions',
    'Instant AI feedback',
    'Progress tracking',
    'PDF reports',
    'Multiple interview types',
    'Dark mode support'
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                PlacementPrep
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-medium mb-6">
              <span className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"></span>
              AI-Powered Interview Training
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
              Prepare for interviews
              <br />
              <span className="text-gray-400 dark:text-gray-500">with confidence</span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
              Practice mock interviews with intelligent AI feedback, track your improvement,
              and get ready for your dream job with personalized coaching.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Start Practicing
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Everything you need to succeed
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Comprehensive tools designed to help you ace any interview
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-700 dark:text-gray-300 mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Simple process,
                <br />powerful results
              </h2>

              <div className="space-y-6">
                {[
                  { step: '01', title: 'Choose your focus', desc: 'Select company type, interview round, and topics you want to practice.' },
                  { step: '02', title: 'Practice with AI', desc: 'Answer questions using voice, get real-time transcription and feedback.' },
                  { step: '03', title: 'Review and improve', desc: 'Analyze your performance metrics and track progress over time.' }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="text-sm font-mono text-gray-400 dark:text-gray-500 pt-1">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8">
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  What's included
                </div>
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <FiCheck className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies */}
      <section className="py-16 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
            Prepare for interviews at top companies
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {['Amazon', 'Microsoft', 'Google', 'TCS', 'Infosys', 'Wipro', 'CRED', 'Flipkart'].map((company) => (
              <span
                key={company}
                className="text-sm font-medium text-gray-400 dark:text-gray-500"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to start practicing?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of candidates who improved their interview skills with our platform.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Create Free Account
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">AI</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">PlacementPrep</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 All rights reserved
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
