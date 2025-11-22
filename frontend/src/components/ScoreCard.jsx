const ScoreCard = ({ title, score, maxScore = 100, color = 'primary', icon: Icon }) => {
  const percentage = (score / maxScore) * 100

  const colorClasses = {
    primary: 'text-primary-600 bg-primary-100 dark:bg-primary-900/30',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
  }

  const progressColorClasses = {
    primary: 'bg-primary-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    blue: 'bg-blue-600'
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="text-3xl font-bold mb-2">
        {score.toFixed(1)}
        <span className="text-lg text-gray-500">/{maxScore}</span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${progressColorClasses[color]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default ScoreCard
