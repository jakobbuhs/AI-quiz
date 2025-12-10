import { useState, useEffect, useCallback } from 'react'
import QuizSetup from './components/QuizSetup'
import QuizQuestion from './components/QuizQuestion'
import QuizResults from './components/QuizResults'
import QuizTimer from './components/QuizTimer'
import ProgressBar from './components/ProgressBar'
import questions from './data/questions.json'
import { Brain, RotateCcw, AlertTriangle } from 'lucide-react'

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

function App() {
  // State management
  const [quizStatus, setQuizStatus] = useState(QUIZ_STATUS.SETUP)
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(20)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timeTaken, setTimeTaken] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Calculate time limit: 10 minutes per 20 questions
  const calculateTimeLimit = useCallback((questionCount) => {
    return Math.ceil((questionCount / 20) * 10 * 60) // in seconds
  }, [])

  // Start quiz handler
  const handleStartQuiz = useCallback(() => {
    const availableQuestions = Math.min(selectedQuestionCount, questions.length)
    const shuffledQuestions = shuffleArray(questions).slice(0, availableQuestions)
    
    // Shuffle options for each question
    const questionsWithShuffledOptions = shuffledQuestions.map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }))

    setSelectedQuestions(questionsWithShuffledOptions)
    setUserAnswers(new Array(availableQuestions).fill(null))
    setTimeRemaining(calculateTimeLimit(availableQuestions))
    setTimeTaken(0)
    setCurrentQuestionIndex(0)
    setQuizStatus(QUIZ_STATUS.IN_PROGRESS)
  }, [selectedQuestionCount, calculateTimeLimit])

  // Handle answer selection
  const handleAnswerSelect = useCallback((answer) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev]
      newAnswers[currentQuestionIndex] = answer
      return newAnswers
    })
  }, [currentQuestionIndex])

  // Navigation handlers
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }, [currentQuestionIndex, selectedQuestions.length])

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
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

  // Restart quiz handler
  const handleRestartQuiz = useCallback(() => {
    setQuizStatus(QUIZ_STATUS.SETUP)
    setCurrentQuestionIndex(0)
    setSelectedQuestions([])
    setUserAnswers([])
    setTimeRemaining(0)
    setTimeTaken(0)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (quizStatus !== QUIZ_STATUS.IN_PROGRESS) return

      switch (e.key) {
        case 'ArrowRight':
          handleNextQuestion()
          break
        case 'ArrowLeft':
          handlePreviousQuestion()
          break
        case '1':
        case '2':
        case '3':
        case '4':
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
  }, [quizStatus, handleNextQuestion, handlePreviousQuestion, handleAnswerSelect, currentQuestionIndex, selectedQuestions])

  // Check if all questions are answered
  const allQuestionsAnswered = userAnswers.every((answer) => answer !== null)
  const answeredCount = userAnswers.filter((answer) => answer !== null).length

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
          <p className="text-gray-500 text-lg">Test your knowledge with our interactive quiz</p>
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
              {/* Timer and Progress */}
              <div className="card p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <QuizTimer
                    timeRemaining={timeRemaining}
                    setTimeRemaining={setTimeRemaining}
                    onTimeExpired={handleTimeExpired}
                    isRunning={quizStatus === QUIZ_STATUS.IN_PROGRESS}
                  />
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
              />
            </div>
          )}

          {quizStatus === QUIZ_STATUS.COMPLETED && (
            <QuizResults
              questions={selectedQuestions}
              userAnswers={userAnswers}
              timeTaken={timeTaken}
              onRestart={handleRestartQuiz}
            />
          )}
        </main>

        {/* Confirmation Dialog */}
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
          <p>Press arrow keys to navigate • Number keys (1-4) to select answers</p>
        </footer>
      </div>
    </div>
  )
}

export default App

