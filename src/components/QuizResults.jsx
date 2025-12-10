import { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { 
  Trophy, 
  Clock, 
  Target, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Tag,
  Award,
  TrendingUp,
  Lightbulb,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { getInDepthExplanation, isOpenAIConfigured, getRateLimitStatus } from '../services/openai'

const QUIZ_MODE = {
  LEARN: 'learn',
  EXAM: 'exam',
}

const QuizResults = memo(function QuizResults({
  questions,
  userAnswers,
  timeTaken,
  onRestart,
  quizMode = QUIZ_MODE.EXAM,
}) {
  const isLearnMode = quizMode === QUIZ_MODE.LEARN
  const [expandedQuestions, setExpandedQuestions] = useState(new Set())
  const [showAll, setShowAll] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [aiExplanations, setAiExplanations] = useState({}) // { questionIndex: explanation }
  const [loadingAI, setLoadingAI] = useState({}) // { questionIndex: true/false }
  const [aiErrors, setAiErrors] = useState({}) // { questionIndex: errorMessage }
  const questionRefs = useRef({}) // Refs for scrolling to questions

  // Calculate results
  const results = useMemo(() => {
    let correct = 0
    let incorrect = 0
    let unanswered = 0

    const questionResults = questions.map((question, index) => {
      const userAnswer = userAnswers[index]
      const isCorrect = userAnswer === question.correct
      
      if (userAnswer === null) {
        unanswered++
      } else if (isCorrect) {
        correct++
      } else {
        incorrect++
      }

      return {
        ...question,
        userAnswer,
        isCorrect,
        questionNumber: index + 1,
      }
    })

    const percentage = Math.round((correct / questions.length) * 100)

    return {
      correct,
      incorrect,
      unanswered,
      total: questions.length,
      percentage,
      questionResults,
    }
  }, [questions, userAnswers])

  // Format time taken
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  // Get grade based on percentage
  const getGrade = (percentage) => {
    if (percentage >= 90) return { letter: 'A', color: 'text-emerald-500', bg: 'bg-emerald-100' }
    if (percentage >= 80) return { letter: 'B', color: 'text-green-500', bg: 'bg-green-100' }
    if (percentage >= 70) return { letter: 'C', color: 'text-yellow-500', bg: 'bg-yellow-100' }
    if (percentage >= 60) return { letter: 'D', color: 'text-orange-500', bg: 'bg-orange-100' }
    return { letter: 'F', color: 'text-red-500', bg: 'bg-red-100' }
  }

  const grade = getGrade(results.percentage)

  // Toggle question expansion
  const toggleQuestion = (index) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        // When collapsing, clear AI explanation for this question
        setAiExplanations(prev => {
          const newExplanations = { ...prev }
          delete newExplanations[index]
          return newExplanations
        })
        setAiErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[index]
          return newErrors
        })
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // Navigate to next question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < results.questionResults.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      // Auto-expand the next question
      setExpandedQuestions(prev => new Set([...prev, nextIndex]))
      // Clear AI explanation from previous question
      clearAIExplanationForIndex(currentQuestionIndex)
      // Scroll to the question
      scrollToQuestion(nextIndex)
    }
  }, [currentQuestionIndex, results.questionResults.length, clearAIExplanationForIndex, scrollToQuestion])

  // Navigate to previous question
  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(prevIndex)
      // Auto-expand the previous question
      setExpandedQuestions(prev => new Set([...prev, prevIndex]))
      // Clear AI explanation from current question
      clearAIExplanationForIndex(currentQuestionIndex)
      // Scroll to the question
      scrollToQuestion(prevIndex)
    }
  }, [currentQuestionIndex, clearAIExplanationForIndex, scrollToQuestion])

  // Clear AI explanation for a specific index
  const clearAIExplanationForIndex = useCallback((index) => {
    setAiExplanations(prev => {
      const newExplanations = { ...prev }
      delete newExplanations[index]
      return newExplanations
    })
    setAiErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[index]
      return newErrors
    })
  }, [])

  // Scroll to a specific question
  const scrollToQuestion = useCallback((index) => {
    const questionElement = questionRefs.current[index]
    if (questionElement) {
      questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  // Expand/collapse all
  const toggleAll = () => {
    if (showAll) {
      setExpandedQuestions(new Set())
    } else {
      setExpandedQuestions(new Set(questions.map((_, i) => i)))
    }
    setShowAll(!showAll)
  }

  // Fetch AI explanation for a specific question
  const handleGetAIExplanation = async (index, result) => {
    setLoadingAI(prev => ({ ...prev, [index]: true }))
    setAiErrors(prev => ({ ...prev, [index]: null }))
    
    try {
      const explanation = await getInDepthExplanation({
        question: result.question,
        correctAnswer: result.correct,
        userAnswer: result.userAnswer || 'No answer provided',
        topic: result.topic || 'General',
        basicExplanation: result.explanation || 'No basic explanation provided.',
      })
      setAiExplanations(prev => ({ ...prev, [index]: explanation }))
    } catch (error) {
      setAiErrors(prev => ({ ...prev, [index]: error.message || 'Failed to get explanation' }))
    } finally {
      setLoadingAI(prev => ({ ...prev, [index]: false }))
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle keys if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          handleNextQuestion()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlePreviousQuestion()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNextQuestion, handlePreviousQuestion])

  // Auto-expand first question on mount
  useEffect(() => {
    if (results.questionResults.length > 0) {
      setExpandedQuestions(new Set([0]))
      setCurrentQuestionIndex(0)
    }
  }, [results.questionResults.length])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Results Header */}
      <div className="card p-8 text-center">
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4 ${
            isLearnMode 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'
          }`}>
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isLearnMode ? 'Learning Complete!' : 'Quiz Complete!'}
          </h2>
          <p className="text-gray-500">
            {isLearnMode ? 'Great job practicing!' : "Here's how you performed"}
          </p>
        </div>

        {/* Score Circle */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-100"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - results.percentage / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-gray-800">{results.percentage}%</span>
            <span className={`text-2xl font-bold ${grade.color}`}>{grade.letter}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{results.correct}</p>
            <p className="text-sm text-emerald-600">Correct</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{results.incorrect}</p>
            <p className="text-sm text-red-600">Incorrect</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
            <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{formatTime(timeTaken)}</p>
            <p className="text-sm text-amber-600">Time Taken</p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
            <Target className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-indigo-600">{results.total}</p>
            <p className="text-sm text-indigo-600">Questions</p>
          </div>
        </div>
      </div>

      {/* Performance Message */}
      <div className={`card p-6 ${grade.bg}`}>
        <div className="flex items-center gap-4">
          <Award className={`w-8 h-8 ${grade.color}`} />
          <div>
            <h3 className={`font-bold text-lg ${grade.color}`}>
              {results.percentage >= 90 && "Outstanding Performance! 🎉"}
              {results.percentage >= 80 && results.percentage < 90 && "Great Job! 👏"}
              {results.percentage >= 70 && results.percentage < 80 && "Good Work! 👍"}
              {results.percentage >= 60 && results.percentage < 70 && "Not Bad! Keep Practicing 📚"}
              {results.percentage < 60 && "Keep Learning! You'll Get Better 💪"}
            </h3>
            <p className="text-gray-600 text-sm">
              You answered {results.correct} out of {results.total} questions correctly.
              {results.unanswered > 0 && ` (${results.unanswered} unanswered)`}
            </p>
          </div>
        </div>
      </div>

      {/* Question Review */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Question Review
          </h3>
          <div className="flex items-center gap-3">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="p-2 rounded-lg border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                title="Previous Question (←)"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 font-medium px-2">
                {currentQuestionIndex + 1} / {results.questionResults.length}
              </span>
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === results.questionResults.length - 1}
                className="p-2 rounded-lg border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                title="Next Question (→)"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <button
              onClick={toggleAll}
              className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
            >
              {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAll ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {results.questionResults.map((result, index) => (
            <div
              key={index}
              ref={(el) => (questionRefs.current[index] = el)}
              className={`rounded-xl border-2 transition-all duration-200 ${
                index === currentQuestionIndex
                  ? 'ring-4 ring-indigo-300 ring-offset-2'
                  : ''
              } ${
                result.isCorrect
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : result.userAnswer === null
                  ? 'border-gray-200 bg-gray-50/50'
                  : 'border-red-200 bg-red-50/50'
              }`}
            >
              {/* Question Header */}
              <button
                onClick={() => {
                  // Clear AI explanation from previous question if switching
                  if (index !== currentQuestionIndex) {
                    clearAIExplanationForIndex(currentQuestionIndex)
                  }
                  setCurrentQuestionIndex(index)
                  toggleQuestion(index)
                }}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      result.isCorrect
                        ? 'bg-emerald-200 text-emerald-700'
                        : result.userAnswer === null
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-red-200 text-red-700'
                    }`}
                  >
                    {result.questionNumber}
                  </span>
                  <span className="font-medium text-gray-700 line-clamp-1">
                    {result.question}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {result.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : result.userAnswer === null ? (
                    <span className="text-xs text-gray-500">Skipped</span>
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  {expandedQuestions.has(index) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {expandedQuestions.has(index) && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-200/50 animate-fade-in">
                  {/* Topic */}
                  {result.topic && (
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{result.topic}</span>
                    </div>
                  )}

                  {/* Full Question */}
                  <p className="font-medium text-gray-800 mb-4">{result.question}</p>

                  {/* Options */}
                  <div className="space-y-2 mb-4">
                    {result.options.map((option, optIndex) => {
                      const isCorrectOption = option === result.correct
                      const isUserAnswer = option === result.userAnswer
                      
                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg flex items-center gap-3 ${
                            isCorrectOption
                              ? 'bg-emerald-100 border border-emerald-300'
                              : isUserAnswer
                              ? 'bg-red-100 border border-red-300'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              isCorrectOption
                                ? 'bg-emerald-500 text-white'
                                : isUserAnswer
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span
                            className={`flex-1 ${
                              isCorrectOption
                                ? 'text-emerald-800 font-medium'
                                : isUserAnswer
                                ? 'text-red-800'
                                : 'text-gray-700'
                            }`}
                          >
                            {option}
                          </span>
                          {isCorrectOption && (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          )}
                          {isUserAnswer && !isCorrectOption && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Explanation */}
                  {result.explanation && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100 mb-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-indigo-800 mb-1">Explanation</p>
                          <p className="text-gray-700 text-sm">{result.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Explanation Button - show for wrong/skipped answers */}
                  {!result.isCorrect && !aiExplanations[index] && (
                    <div className="mt-4">
                      {(() => {
                        const apiConfigured = isOpenAIConfigured()
                        const { remainingCalls, resetInSeconds, unlimited } = apiConfigured ? getRateLimitStatus() : { remainingCalls: 0, resetInSeconds: 0, unlimited: false }
                        const isRateLimited = apiConfigured && !unlimited && remainingCalls <= 0
                        const isLoading = loadingAI[index]
                        
                        return (
                          <>
                            <button
                              onClick={() => handleGetAIExplanation(index, result)}
                              disabled={isLoading || isRateLimited || !apiConfigured}
                              className="w-full p-3 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {!apiConfigured ? (
                                <>
                                  <AlertCircle className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-500 text-sm">AI Explanations - API key not configured</span>
                                </>
                              ) : isLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                                  <span className="text-purple-700 text-sm">Getting AI explanation...</span>
                                </>
                              ) : isRateLimited ? (
                                <>
                                  <AlertCircle className="w-4 h-4 text-amber-500" />
                                  <span className="text-amber-700 text-sm">Rate limited - wait {resetInSeconds}s</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                                  <span className="text-purple-700 text-sm font-medium">Get AI-Powered Explanation</span>
                                  {unlimited ? (
                                    <span className="text-xs text-emerald-600 font-semibold">(∞ Unlimited)</span>
                                  ) : (
                                    <span className="text-xs text-purple-400">({remainingCalls}/10)</span>
                                  )}
                                </>
                              )}
                            </button>
                            
                            {aiErrors[index] && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-600">{aiErrors[index]}</p>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* AI Explanation Display */}
                  {aiExplanations[index] && (
                    <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="font-bold text-purple-700 text-sm">AI-Powered Explanation</span>
                      </div>
                      <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {aiExplanations[index]}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Restart Button */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-500 mb-4">
          Use arrow keys (← →) or click the arrows above to navigate between questions
        </p>
        <button
          onClick={onRestart}
          className="btn-primary py-4 px-8 text-lg flex items-center justify-center gap-3 mx-auto"
        >
          <RotateCcw className="w-6 h-6" />
          Start New Quiz
        </button>
      </div>
    </div>
  )
})

export default QuizResults
