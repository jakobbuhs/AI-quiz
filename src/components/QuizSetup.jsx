import { memo, useMemo, useState } from 'react'
import { Play, Clock, HelpCircle, Zap, Target, BookOpen, GraduationCap } from 'lucide-react'

const QUIZ_MODE = {
  LEARN: 'learn',
  EXAM: 'exam',
}

const QuizSetup = memo(function QuizSetup({
  questionCount,
  onQuestionCountChange,
  maxQuestions,
  calculateTimeLimit,
  onStartQuiz,
}) {
  const [selectedMode, setSelectedMode] = useState(QUIZ_MODE.EXAM)

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

  const handleStart = () => {
    onStartQuiz(selectedMode)
  }

  return (
    <div className="card p-8 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Ready to Challenge Yourself?
        </h2>
        <p className="text-gray-500">
          Choose your mode and how many questions you want to tackle
        </p>
      </div>

      {/* Mode Selection */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Select Mode</h3>
        <div className="flex gap-4 max-w-lg mx-auto">
          {/* Learn Mode */}
          <button
            onClick={() => setSelectedMode(QUIZ_MODE.LEARN)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedMode === QUIZ_MODE.LEARN
                ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20'
                : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
              selectedMode === QUIZ_MODE.LEARN
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className={`font-bold mb-1 ${
              selectedMode === QUIZ_MODE.LEARN ? 'text-emerald-700' : 'text-gray-700'
            }`}>
              Learn Mode
            </h4>
            <p className="text-xs text-gray-500">
              See answers & explanations immediately after each question
            </p>
          </button>

          {/* Exam Mode */}
          <button
            onClick={() => setSelectedMode(QUIZ_MODE.EXAM)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedMode === QUIZ_MODE.EXAM
                ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/20'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
              selectedMode === QUIZ_MODE.EXAM
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <h4 className={`font-bold mb-1 ${
              selectedMode === QUIZ_MODE.EXAM ? 'text-indigo-700' : 'text-gray-700'
            }`}>
              Exam Mode
            </h4>
            <p className="text-xs text-gray-500">
              Timed quiz with results summary at the end
            </p>
          </button>
        </div>
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
        {/* Time Limit Card - only relevant for exam mode */}
        <div className={`rounded-xl p-5 border ${
          selectedMode === QUIZ_MODE.EXAM
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'
            : 'bg-gray-50 border-gray-200 opacity-60'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`w-5 h-5 ${selectedMode === QUIZ_MODE.EXAM ? 'text-amber-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${selectedMode === QUIZ_MODE.EXAM ? 'text-amber-800' : 'text-gray-500'}`}>
              {selectedMode === QUIZ_MODE.EXAM ? 'Time Limit' : 'No Time Limit'}
            </span>
          </div>
          <p className={`text-2xl font-bold ${selectedMode === QUIZ_MODE.EXAM ? 'text-amber-700' : 'text-gray-400'}`}>
            {selectedMode === QUIZ_MODE.EXAM ? timeInfo.formatted : '∞'}
          </p>
          <p className={`text-xs mt-1 ${selectedMode === QUIZ_MODE.EXAM ? 'text-amber-600' : 'text-gray-400'}`}>
            {selectedMode === QUIZ_MODE.EXAM ? '10 min per 20 questions' : 'Learn at your own pace'}
          </p>
        </div>

        {/* Per Question Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Per Question</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {selectedMode === QUIZ_MODE.EXAM 
              ? `${(timeInfo.totalSeconds / questionCount).toFixed(0)}s`
              : 'Unlimited'
            }
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {selectedMode === QUIZ_MODE.EXAM ? 'Average time available' : 'Take your time to learn'}
          </p>
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
          <li>• Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to go to the next question</li>
          <li>• Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to exit the quiz</li>
          {selectedMode === QUIZ_MODE.LEARN && (
            <li>• In Learn mode, you'll see the correct answer immediately!</li>
          )}
        </ul>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={questionCount < 1}
        className={`w-full py-4 text-lg flex items-center justify-center gap-3 group rounded-xl font-semibold shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${
          selectedMode === QUIZ_MODE.LEARN
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 focus:ring-emerald-300'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 focus:ring-indigo-300'
        }`}
      >
        <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
        Start {selectedMode === QUIZ_MODE.LEARN ? 'Learning' : 'Exam'}
      </button>
    </div>
  )
})

export default QuizSetup
