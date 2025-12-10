import { memo, useMemo } from 'react'
import { Play, Clock, HelpCircle, Zap, Target } from 'lucide-react'

const QuizSetup = memo(function QuizSetup({
  questionCount,
  onQuestionCountChange,
  maxQuestions,
  calculateTimeLimit,
  onStartQuiz,
}) {
  // Calculate and format time
  const timeInfo = useMemo(() => {
    const totalSeconds = calculateTimeLimit(questionCount)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    let formatted = ''
    if (hours > 0) {
      formatted = `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      formatted = `${minutes} minute${minutes !== 1 ? 's' : ''}`
    } else {
      formatted = `${seconds} second${seconds !== 1 ? 's' : ''}`
    }

    return { hours, minutes, seconds, formatted, totalSeconds }
  }, [questionCount, calculateTimeLimit])

  // Slider tick marks
  const tickMarks = [1, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500].filter(
    (tick) => tick <= maxQuestions
  )

  return (
    <div className="card p-8 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Ready to Challenge Yourself?
        </h2>
        <p className="text-gray-500">
          Choose how many questions you want to tackle
        </p>
      </div>

      {/* Question Count Display */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-2xl shadow-lg shadow-indigo-500/30">
          <HelpCircle className="w-6 h-6" />
          <span className="text-4xl font-bold">{questionCount}</span>
          <span className="text-lg opacity-90">Questions</span>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="range"
            min="1"
            max={maxQuestions}
            value={questionCount}
            onChange={(e) => onQuestionCountChange(parseInt(e.target.value))}
            className="w-full h-3 rounded-full cursor-pointer"
            aria-label="Select number of questions"
          />
          
          {/* Tick marks */}
          <div className="flex justify-between mt-2 px-1">
            {tickMarks.map((tick) => (
              <button
                key={tick}
                onClick={() => onQuestionCountChange(tick)}
                className={`text-xs transition-colors ${
                  questionCount >= tick
                    ? 'text-indigo-600 font-semibold'
                    : 'text-gray-400'
                } hover:text-indigo-500`}
              >
                {tick}
              </button>
            ))}
          </div>
        </div>

        {/* Quick selection buttons */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {[10, 20, 50, 100, 200].filter(n => n <= maxQuestions).map((num) => (
            <button
              key={num}
              onClick={() => onQuestionCountChange(num)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                questionCount === num
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
              }`}
            >
              {num} Q
            </button>
          ))}
        </div>
      </div>

      {/* Time and Info Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Time Limit Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Time Limit</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{timeInfo.formatted}</p>
          <p className="text-xs text-amber-600 mt-1">10 min per 20 questions</p>
        </div>

        {/* Per Question Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Per Question</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {(timeInfo.totalSeconds / questionCount).toFixed(0)}s
          </p>
          <p className="text-xs text-blue-600 mt-1">Average time available</p>
        </div>

        {/* Challenge Level Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Challenge</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {questionCount <= 20 ? 'Quick' : questionCount <= 50 ? 'Medium' : questionCount <= 100 ? 'Long' : 'Epic'}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {questionCount <= 20 ? 'Perfect for a quick test' : questionCount <= 50 ? 'Balanced challenge' : questionCount <= 100 ? 'Test your endurance' : 'Ultimate marathon'}
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gray-50 rounded-xl p-4 mb-8">
        <h4 className="font-semibold text-gray-700 mb-2">💡 Quick Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use number keys (1-4) to quickly select answers</li>
          <li>• Arrow keys navigate between questions</li>
          <li>• You can review and change answers before submitting</li>
        </ul>
      </div>

      {/* Start Button */}
      <button
        onClick={onStartQuiz}
        disabled={questionCount < 1}
        className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 group"
      >
        <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
        Start Quiz
      </button>
    </div>
  )
})

export default QuizSetup

