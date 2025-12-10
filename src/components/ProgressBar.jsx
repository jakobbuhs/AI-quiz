import { memo } from 'react'

const QUIZ_MODE = {
  LEARN: 'learn',
  EXAM: 'exam',
}

const ProgressBar = memo(function ProgressBar({ 
  current, 
  total, 
  answered,
  quizMode = QUIZ_MODE.EXAM,
  answerResults = [], // Array of { answered: boolean, correct: boolean | null }
}) {
  const progressPercentage = (current / total) * 100
  const answeredPercentage = (answered / total) * 100
  const isLearnMode = quizMode === QUIZ_MODE.LEARN

  // Get dot color based on answer result
  const getDotClass = (index) => {
    const isCurrent = index === current - 1
    const result = answerResults[index]
    
    if (isCurrent) {
      return 'bg-indigo-500 scale-125 ring-2 ring-indigo-200'
    }
    
    if (!result?.answered) {
      return 'bg-gray-200'
    }
    
    // In learn mode, show correct/incorrect colors
    if (isLearnMode && result.correct !== null) {
      return result.correct 
        ? 'bg-emerald-500 ring-1 ring-emerald-300' 
        : 'bg-red-500 ring-1 ring-red-300'
    }
    
    // In exam mode or if no result yet, just show answered
    return 'bg-emerald-400'
  }

  // Get dot title based on answer result
  const getDotTitle = (index) => {
    const result = answerResults[index]
    let title = `Question ${index + 1}`
    
    if (isLearnMode && result?.answered && result.correct !== null) {
      title += result.correct ? ' ✓ Correct' : ' ✗ Incorrect'
    }
    
    return title
  }

  // Count correct/incorrect for learn mode stats
  const correctCount = answerResults.filter(r => r?.correct === true).length
  const incorrectCount = answerResults.filter(r => r?.correct === false).length

  return (
    <div className="mt-4">
      {/* Progress info */}
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Question {current} of {total}</span>
        {isLearnMode && answered > 0 ? (
          <span className="flex items-center gap-2">
            <span className="text-emerald-600">✓ {correctCount}</span>
            <span className="text-red-500">✗ {incorrectCount}</span>
          </span>
        ) : (
          <span>{Math.round(answeredPercentage)}% completed</span>
        )}
      </div>

      {/* Progress bar container */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* Answered progress (background) */}
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
            isLearnMode 
              ? 'bg-gradient-to-r from-indigo-200 to-purple-200'
              : 'bg-gradient-to-r from-emerald-200 to-teal-200'
          }`}
          style={{ width: `${answeredPercentage}%` }}
          role="progressbar"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${answered} questions answered out of ${total}`}
        />

        {/* Current position indicator */}
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-300 ease-out ${
            isLearnMode
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Animated shine effect */}
        <div
          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
          style={{ left: `${progressPercentage - 4}%` }}
        />
      </div>

      {/* Question dots indicator */}
      <div className="flex justify-center mt-3 gap-1 flex-wrap max-h-20 overflow-hidden">
        {total <= 50 && Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 cursor-default ${getDotClass(i)}`}
            title={getDotTitle(i)}
          />
        ))}
        {total > 50 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-400">{answered} of {total} answered</span>
            {isLearnMode && answered > 0 && (
              <>
                <span className="text-emerald-600 font-medium">✓ {correctCount}</span>
                <span className="text-red-500 font-medium">✗ {incorrectCount}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default ProgressBar
