import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheck, FiMic, FiVideo, FiBarChart2, FiUsers, FiBookOpen, FiAward, FiZap, FiShield, FiCpu } from 'react-icons/fi'

const LandingPage = () => {
  const features = [
    {
      icon: <FiMic className="w-6 h-6" />,
      title: 'AI-Powered Interviews',
      description: 'Practice with intelligent AI interviewers that adapt to your responses and provide real-time feedback.'
    },
    {
      icon: <FiVideo className="w-6 h-6" />,
      title: 'Video Proctoring',
      description: 'Advanced face detection, emotion analysis, and gaze tracking to simulate real interview conditions.'
    },
    {
      icon: <FiBarChart2 className="w-6 h-6" />,
      title: 'Deep Analytics',
      description: 'Comprehensive performance metrics, knowledge graphs, and personalized improvement suggestions.'
    },
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: 'Group Discussions',
      description: 'Practice GD rounds with AI participants who challenge and engage with your arguments.'
    },
    {
      icon: <FiBookOpen className="w-6 h-6" />,
      title: 'Smart Flashcards',
      description: 'AI-generated flashcards for OS, CN, DBMS, and OOPS with spaced repetition learning.'
    },
    {
      icon: <FiAward className="w-6 h-6" />,
      title: 'Company-Specific Prep',
      description: 'Tailored preparation for Amazon, Microsoft, Google, TCS, Infosys, and more.'
    }
  ]

  const stats = [
    { value: '10K+', label: 'Questions Generated' },
    { value: '95%', label: 'Accuracy Rate' },
    { value: '50+', label: 'Companies Covered' },
    { value: '24/7', label: 'AI Availability' }
  ]

  const companies = ['Amazon', 'Microsoft', 'Google', 'TCS', 'Infosys', 'CRED', 'Flipkart', 'Wipro']

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FiCpu className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                AI Interview
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-900 dark:to-gray-800" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <FiZap className="w-4 h-4" />
              Powered by Advanced AI Models
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Master Your
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"> Interview </span>
              with AI
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Experience the future of interview preparation. Our AI-powered platform provides personalized coaching,
              real-time feedback, and comprehensive analytics to help you land your dream job.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary-500/25"
              >
                Start Practicing Free
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all"
              >
                Watch Demo
              </Link>
            </div>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 shadow-2xl max-w-5xl mx-auto">
              <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                <div className="h-8 bg-gray-100 dark:bg-gray-800 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      <div className="h-32 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center">
                        <FiMic className="w-8 h-8 text-primary-600" />
                      </div>
                    </div>
                    <div className="w-48 space-y-3">
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                      <div className="h-4 bg-green-200 dark:bg-green-900 rounded" />
                      <div className="h-4 bg-primary-200 dark:bg-primary-900 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our comprehensive platform combines cutting-edge AI with proven interview techniques
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all hover:shadow-lg group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center text-primary-600 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Choose Your Focus', description: 'Select company, role, and interview type. Our AI customizes the experience for you.' },
              { step: '02', title: 'Practice with AI', description: 'Engage in realistic interviews with voice recognition, video proctoring, and instant feedback.' },
              { step: '03', title: 'Track & Improve', description: 'Review detailed analytics, identify weak areas, and get personalized improvement plans.' }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-8xl font-bold text-gray-100 dark:text-gray-800 absolute -top-4 -left-4">
                  {item.step}
                </div>
                <div className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
            Prepare for Top Companies
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            {companies.map((company, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 font-medium hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMiAyIDQgMiA0LTItMi00LTItNCAwLTQgMi0yIDQtMiA0IDItMiA0LTIgNCAwIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Ace Your Next Interview?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of successful candidates who prepared with our AI-powered platform.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Free Trial
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FiCpu className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AI Interview</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span>© 2024 AI Interview. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
