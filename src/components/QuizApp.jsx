import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import QuizSetup from './QuizSetup'
import QuizQuestion from './QuizQuestion'
import QuizResults from './QuizResults'
import QuizTimer from './QuizTimer'
import ProgressBar from './ProgressBar'
import CookieConsent from './CookieConsent'
import UserLogin from './UserLogin'
import FocusVideo from './FocusVideo'
import questions from '../data/questions.json'
import { Brain, AlertTriangle, LogOut, Shield, User } from 'lucide-react'
import { saveQuizState, loadQuizState, clearQuizState, hasAcceptedCookies } from '../utils/storage'
import { getCurrentUser } from '../utils/apiAuth'

// Utility function to shuffle an array
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Quiz status constants
const QUIZ_STATUS = {
  SETUP: 'setup',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
}

// Quiz mode constants
const QUIZ_MODE = {
  LEARN: 'learn',
  EXAM: 'exam',
}

function QuizApp() {
  // State management
  const [quizStatus, setQuizStatus] = useState(QUIZ_STATUS.SETUP)
  const [quizMode, setQuizMode] = useState(QUIZ_MODE.EXAM)
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(20)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timeTaken, setTimeTaken] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false) // For learn mode
  const [answerResults, setAnswerResults] = useState([]) // Track correct/incorrect for each question
  const [cookiesAccepted, setCookiesAccepted] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showUserLogin, setShowUserLogin] = useState(false)

  // Load saved quiz state on mount (if cookies accepted)
  useEffect(() => {
    const savedState = loadQuizState()
    if (savedState && savedState.quizStatus === QUIZ_STATUS.IN_PROGRESS) {
      // Restore quiz state
      setQuizStatus(savedState.quizStatus)
      setQuizMode(savedState.quizMode)
      setSelectedQuestionCount(savedState.selectedQuestionCount)
      setCurrentQuestionIndex(savedState.currentQuestionIndex)
      setSelectedQuestions(savedState.selectedQuestions)
      setUserAnswers(savedState.userAnswers)
      setTimeRemaining(savedState.timeRemaining)
      setTimeTaken(savedState.timeTaken)
      setAnswerResults(savedState.answerResults || [])
    }
    
    // Check if cookies were previously accepted
    setCookiesAccepted(hasAcceptedCookies())
    
    // Check if user is logged in
    const loadUser = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)
    }
    loadUser()
  }, [])

  // Save quiz state whenever it changes (only if cookies accepted and quiz is in progress)
  useEffect(() => {
    if (cookiesAccepted && quizStatus === QUIZ_STATUS.IN_PROGRESS) {
      saveQuizState({
        quizStatus,
        quizMode,
        selectedQuestionCount,
        currentQuestionIndex,
        selectedQuestions,
        userAnswers,
        timeRemaining,
        timeTaken,
        answerResults,
      })
    }
  }, [
    cookiesAccepted,
    quizStatus,
    quizMode,
    selectedQuestionCount,
    currentQuestionIndex,
    selectedQuestions,
    userAnswers,
    timeRemaining,
    timeTaken,
    answerResults,
  ])

  // Calculate time limit: 10 minutes per 20 questions
  const calculateTimeLimit = useCallback((questionCount) => {
    return Math.ceil((questionCount / 20) * 10 * 60) // in seconds
  }, [])

  // Start quiz handler
  const handleStartQuiz = useCallback((mode) => {
    const availableQuestions = Math.min(selectedQuestionCount, questions.length)
    const shuffledQuestions = shuffleArray(questions).slice(0, availableQuestions)
    
    // Shuffle options for each question
    const questionsWithShuffledOptions = shuffledQuestions.map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }))

    setQuizMode(mode)
    setSelectedQuestions(questionsWithShuffledOptions)
    setUserAnswers(new Array(availableQuestions).fill(null))
    setAnswerResults(new Array(availableQuestions).fill({ answered: false, correct: null }))
    setTimeRemaining(calculateTimeLimit(availableQuestions))
    setTimeTaken(0)
    setCurrentQuestionIndex(0)
    setShowFeedback(false)
    setQuizStatus(QUIZ_STATUS.IN_PROGRESS)
  }, [selectedQuestionCount, calculateTimeLimit])

  // Handle answer selection
  const handleAnswerSelect = useCallback((answer) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev]
      newAnswers[currentQuestionIndex] = answer
      return newAnswers
    })
    
    // In learn mode, show feedback immediately after selecting and track result
    if (quizMode === QUIZ_MODE.LEARN) {
      const isCorrect = answer === selectedQuestions[currentQuestionIndex]?.correct
      setAnswerResults((prev) => {
        const newResults = [...prev]
        newResults[currentQuestionIndex] = { answered: true, correct: isCorrect }
        return newResults
      })
      setShowFeedback(true)
    }
  }, [currentQuestionIndex, quizMode, selectedQuestions])

  // Navigation handlers
  const handleNextQuestion = useCallback(() => {
    // In learn mode, if feedback is showing and it's the last question, complete the quiz
    if (quizMode === QUIZ_MODE.LEARN && showFeedback && currentQuestionIndex === selectedQuestions.length - 1) {
      const totalTime = calculateTimeLimit(selectedQuestions.length)
      setTimeTaken(totalTime - timeRemaining)
      setQuizStatus(QUIZ_STATUS.COMPLETED)
      return
    }
    
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setShowFeedback(false)
    }
  }, [currentQuestionIndex, selectedQuestions.length, quizMode, showFeedback, calculateTimeLimit, timeRemaining])

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
      setShowFeedback(false)
    }
  }, [currentQuestionIndex])

  // Submit quiz handler
  const handleSubmitQuiz = useCallback(() => {
    const totalTime = calculateTimeLimit(selectedQuestions.length)
    setTimeTaken(totalTime - timeRemaining)
    setQuizStatus(QUIZ_STATUS.COMPLETED)
    setShowConfirmDialog(false)
  }, [timeRemaining, selectedQuestions.length, calculateTimeLimit])

  // Time expired handler
  const handleTimeExpired = useCallback(() => {
    const totalTime = calculateTimeLimit(selectedQuestions.length)
    setTimeTaken(totalTime)
    setQuizStatus(QUIZ_STATUS.COMPLETED)
  }, [selectedQuestions.length, calculateTimeLimit])

  // Exit quiz handler
  const handleExitQuiz = useCallback(() => {
    clearQuizState()
    setQuizStatus(QUIZ_STATUS.SETUP)
    setCurrentQuestionIndex(0)
    setSelectedQuestions([])
    setUserAnswers([])
    setAnswerResults([])
    setTimeRemaining(0)
    setTimeTaken(0)
    setShowFeedback(false)
    setShowExitDialog(false)
  }, [])

  // Restart quiz handler
  const handleRestartQuiz = useCallback(() => {
    clearQuizState()
    setQuizStatus(QUIZ_STATUS.SETUP)
    setCurrentQuestionIndex(0)
    setSelectedQuestions([])
    setUserAnswers([])
    setAnswerResults([])
    setTimeRemaining(0)
    setTimeTaken(0)
    setShowFeedback(false)
  }, [])

  // Cookie consent handlers
  const handleCookieAccept = useCallback(() => {
    setCookiesAccepted(true)
  }, [])

  const handleCookieDecline = useCallback(() => {
    setCookiesAccepted(false)
    clearQuizState()
  }, [])

  // User login handlers
  const handleUserLogin = useCallback((user) => {
    setCurrentUser(user)
  }, [])

  const handleUserLogout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (quizStatus !== QUIZ_STATUS.IN_PROGRESS) return
      
      // Don't handle keys if dialogs are open
      if (showConfirmDialog || showExitDialog) return

      switch (e.key) {
        case 'Enter':
          // In learn mode with feedback showing, go to next
          if (quizMode === QUIZ_MODE.LEARN && showFeedback) {
            handleNextQuestion()
          } else if (quizMode === QUIZ_MODE.EXAM && userAnswers[currentQuestionIndex]) {
            // In exam mode, Enter goes to next if answer is selected
            if (currentQuestionIndex === selectedQuestions.length - 1) {
              setShowConfirmDialog(true)
            } else {
              handleNextQuestion()
            }
          }
          break
        case 'ArrowRight':
          if (quizMode === QUIZ_MODE.EXAM || (quizMode === QUIZ_MODE.LEARN && showFeedback)) {
            handleNextQuestion()
          }
          break
        case 'ArrowLeft':
          if (quizMode === QUIZ_MODE.EXAM || (quizMode === QUIZ_MODE.LEARN && showFeedback)) {
            handlePreviousQuestion()
          }
          break
        case 'Escape':
          setShowExitDialog(true)
          break
        case '1':
        case '2':
        case '3':
        case '4':
          // Only allow selection if not showing feedback in learn mode
          if (quizMode === QUIZ_MODE.LEARN && showFeedback) break
          
          const optionIndex = parseInt(e.key) - 1
          if (selectedQuestions[currentQuestionIndex]?.options[optionIndex]) {
            handleAnswerSelect(selectedQuestions[currentQuestionIndex].options[optionIndex])
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [quizStatus, handleNextQuestion, handlePreviousQuestion, handleAnswerSelect, currentQuestionIndex, selectedQuestions, quizMode, showFeedback, userAnswers, showConfirmDialog, showExitDialog])

  // Check if all questions are answered
  const allQuestionsAnswered = userAnswers.every((answer) => answer !== null)
  const answeredCount = userAnswers.filter((answer) => answer !== null).length

  return (
    <div className="min-h-screen py-8 px-4 relative">
      {/* Focus Video - Left Side */}
      <FocusVideo />
      
      {/* Cookie Consent Dialog */}
      <CookieConsent onAccept={handleCookieAccept} onDecline={handleCookieDecline} />
      
      {/* User Login Dialog */}
      <UserLogin
        isOpen={showUserLogin}
        onClose={() => setShowUserLogin(false)}
        onLogin={handleUserLogin}
        onLogout={handleUserLogout}
      />
      
      {/* Main Content - Offset for video on large screens */}
      <div className="max-w-full mx-auto lg:ml-[50%] lg:w-1/2 px-4">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Quiz
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <p className="text-gray-500 text-lg">Test your knowledge with our interactive quiz</p>
            <div className="flex items-center gap-2">
              {currentUser ? (
                <button
                  onClick={() => setShowUserLogin(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="User Account"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentUser.username}</span>
                  {currentUser.unlimitedAI ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">∞ AI</span>
                  ) : (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {currentUser.dailyAILimit || 10}/day
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setShowUserLogin(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Login for unlimited AI"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
              <Link
                to="/admin/login"
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Admin Panel"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {quizStatus === QUIZ_STATUS.SETUP && (
            <QuizSetup
              questionCount={selectedQuestionCount}
              onQuestionCountChange={setSelectedQuestionCount}
              maxQuestions={Math.min(500, questions.length)}
              calculateTimeLimit={calculateTimeLimit}
              onStartQuiz={handleStartQuiz}
            />
          )}

          {quizStatus === QUIZ_STATUS.IN_PROGRESS && (
            <div className="space-y-6 animate-fade-in">
              {/* Timer, Progress, and Exit */}
              <div className="card p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Exit Button */}
                    <button
                      onClick={() => setShowExitDialog(true)}
                      className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Exit Quiz (Esc)"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="hidden sm:inline text-sm">Exit</span>
                    </button>
                    
                    {/* Timer - only show in exam mode */}
                    {quizMode === QUIZ_MODE.EXAM ? (
                      <QuizTimer
                        timeRemaining={timeRemaining}
                        setTimeRemaining={setTimeRemaining}
                        onTimeExpired={handleTimeExpired}
                        isRunning={quizStatus === QUIZ_STATUS.IN_PROGRESS}
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                        <span className="text-emerald-600 font-medium">📚 Learn Mode</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center sm:text-right">
                    <p className="text-sm text-gray-500 mb-1">Progress</p>
                    <p className="font-semibold text-indigo-600">
                      {answeredCount} of {selectedQuestions.length} answered
                    </p>
                  </div>
                </div>
                <ProgressBar
                  current={currentQuestionIndex + 1}
                  total={selectedQuestions.length}
                  answered={answeredCount}
                  quizMode={quizMode}
                  answerResults={answerResults}
                />
              </div>

              {/* Question */}
              <QuizQuestion
                question={selectedQuestions[currentQuestionIndex]}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={selectedQuestions.length}
                selectedAnswer={userAnswers[currentQuestionIndex]}
                onAnswerSelect={handleAnswerSelect}
                onNext={handleNextQuestion}
                onPrevious={handlePreviousQuestion}
                isFirst={currentQuestionIndex === 0}
                isLast={currentQuestionIndex === selectedQuestions.length - 1}
                onSubmit={() => setShowConfirmDialog(true)}
                allAnswered={allQuestionsAnswered}
                quizMode={quizMode}
                showFeedback={showFeedback}
              />
            </div>
          )}

          {quizStatus === QUIZ_STATUS.COMPLETED && (
            <QuizResults
              questions={selectedQuestions}
              userAnswers={userAnswers}
              timeTaken={timeTaken}
              onRestart={handleRestartQuiz}
              quizMode={quizMode}
            />
          )}
        </main>

        {/* Exit Confirmation Dialog */}
        {showExitDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card p-6 max-w-md w-full animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-xl">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Exit Quiz?</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to exit? {cookiesAccepted ? 'Your saved progress will be cleared.' : 'Your progress will be lost.'}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitDialog(false)}
                  className="btn-secondary flex-1"
                >
                  Continue Quiz
                </button>
                <button
                  onClick={handleExitQuiz}
                  className="btn-primary flex-1 !bg-gradient-to-r !from-red-500 !to-rose-500 !shadow-red-500/30"
                >
                  Exit Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card p-6 max-w-md w-full animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Submit Quiz?</h3>
              </div>
              
              {!allQuestionsAnswered && (
                <p className="text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                  You have {selectedQuestions.length - answeredCount} unanswered question(s).
                </p>
              )}
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to submit your quiz? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  className="btn-primary flex-1"
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-400 text-sm">
          <p>Enter for next • Arrow keys to navigate • Number keys (1-4) to select • Esc to exit</p>
        </footer>
      </div>
    </div>
  )
}

export default QuizApp

