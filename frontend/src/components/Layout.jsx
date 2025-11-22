import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  FiHome, FiVideo, FiBook, FiHelpCircle, FiBarChart2,
  FiUsers, FiUser, FiLogOut, FiSun, FiMoon, FiFileText
} from 'react-icons/fi'

const Layout = () => {
  const { user, logout } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', path: '/', icon: FiHome },
    { name: 'Interview', path: '/interview', icon: FiVideo },
    { name: 'Flashcards', path: '/flashcards', icon: FiBook },
    { name: 'Quiz', path: '/quiz', icon: FiHelpCircle },
    { name: 'Analytics', path: '/analytics', icon: FiBarChart2 },
    { name: 'Group Discussion', path: '/gd', icon: FiUsers },
    { name: 'Reports', path: '/reports', icon: FiFileText },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-primary-600">AI Interview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Preparation Platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/profile')
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FiUser className="w-5 h-5" />
            <span className="font-medium">{user?.name || 'Profile'}</span>
          </Link>

          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full transition-colors"
          >
            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
