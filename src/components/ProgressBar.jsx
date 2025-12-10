import { memo } from 'react'

const ProgressBar = memo(function ProgressBar({ current, total, answered }) {
  const progressPercentage = (current / total) * 100
  const answeredPercentage = (answered / total) * 100

  return (
    <div className="mt-4">
      {/* Progress info */}
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Question {current} of {total}</span>
        <span>{Math.round(answeredPercentage)}% completed</span>
      </div>

      {/* Progress bar container */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* Answered progress (background) */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-200 to-teal-200 transition-all duration-500 ease-out"
          style={{ width: `${answeredPercentage}%` }}
          role="progressbar"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${answered} questions answered out of ${total}`}
        />

        {/* Current position indicator */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Animated shine effect */}
        <div
          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
          style={{ left: `${progressPercentage - 4}%` }}
        />
      </div>

      {/* Question dots indicator */}
      <div className="flex justify-center mt-3 gap-1 flex-wrap max-h-16 overflow-hidden">
        {total <= 50 && Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              i === current - 1
                ? 'bg-indigo-500 scale-125 ring-2 ring-indigo-200'
                : i < answered
                ? 'bg-emerald-400'
                : 'bg-gray-200'
            }`}
            title={`Question ${i + 1}`}
          />
        ))}
        {total > 50 && (
          <span className="text-xs text-gray-400">
            {answered} of {total} answered
          </span>
        )}
      </div>
    </div>
  )
})

export default ProgressBar

