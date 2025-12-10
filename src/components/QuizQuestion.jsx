import { memo, useState } from 'react'
import { ChevronLeft, ChevronRight, Send, Tag, CheckCircle, XCircle, Lightbulb, CornerDownLeft, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { getInDepthExplanation, isOpenAIConfigured } from '../services/openai'
import { useRateLimit } from '../hooks/useRateLimit'

const QUIZ_MODE = {
  LEARN: 'learn',
  EXAM: 'exam',
}

const QuizQuestion = memo(function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  onSubmit,
  allAnswered,
  quizMode = QUIZ_MODE.EXAM,
  showFeedback = false,
}) {
  const [aiExplanation, setAiExplanation] = useState(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiError, setAiError] = useState(null)
  const rateLimit = useRateLimit()

  if (!question) return null

  const isCorrect = selectedAnswer === question.correct
  const isLearnMode = quizMode === QUIZ_MODE.LEARN
  const showAIButton = isLearnMode && showFeedback && !isCorrect

  // Fetch in-depth explanation from OpenAI
  const handleGetAIExplanation = async () => {
    setIsLoadingAI(true)
    setAiError(null)
    
    try {
      const explanation = await getInDepthExplanation({
        question: question.question,
        correctAnswer: question.correct,
        userAnswer: selectedAnswer,
        topic: question.topic || 'General',
        basicExplanation: question.explanation || 'No basic explanation provided.',
      })
      setAiExplanation(explanation)
    } catch (error) {
      setAiError(error.message || 'Failed to get explanation. Please try again.')
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Reset AI state when moving to next question
  const handleNext = () => {
    setAiExplanation(null)
    setAiError(null)
    onNext()
  }

  return (
    <div className="card p-6 md:p-8 animate-slide-up">
      {/* Question Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
            Question {questionNumber} of {totalQuestions}
          </span>
          {question.topic && (
            <span className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              <Tag className="w-3 h-3" />
              {question.topic}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-400">
          {isLearnMode 
            ? 'Select answer to see explanation'
            : 'Press number to select • Arrow keys to navigate'
          }
        </span>
      </div>

      {/* Question Text */}
      <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-8 leading-relaxed">
        {question.question}
      </h3>

      {/* Answer Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          const isCorrectOption = option === question.correct
          const showCorrectWrong = isLearnMode && showFeedback
          
          let optionClasses = 'quiz-option flex items-start gap-4 group'
          let letterClasses = 'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm transition-colors'
          
          if (showCorrectWrong) {
            if (isCorrectOption) {
              optionClasses = 'quiz-option quiz-option-correct flex items-start gap-4'
              letterClasses = 'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm bg-emerald-500 text-white'
            } else if (isSelected && !isCorrectOption) {
              optionClasses = 'quiz-option quiz-option-incorrect flex items-start gap-4'
              letterClasses = 'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm bg-red-500 text-white'
            } else {
              optionClasses = 'quiz-option flex items-start gap-4 opacity-50'
              letterClasses = 'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm bg-gray-100 text-gray-400'
            }
          } else if (isSelected) {
            optionClasses = 'quiz-option quiz-option-selected flex items-start gap-4 group'
            letterClasses = 'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm bg-indigo-500 text-white'
          } else {
            letterClasses += ' bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
          }

          return (
            <button
              key={index}
              onClick={() => !showFeedback && onAnswerSelect(option)}
              disabled={showFeedback}
              className={optionClasses}
              aria-pressed={isSelected}
            >
              {/* Option letter */}
              <span className={letterClasses}>
                {String.fromCharCode(65 + index)}
              </span>
              
              {/* Option text */}
              <span className="text-left flex-1 pt-1">{option}</span>
              
              {/* Status icon for learn mode feedback */}
              {showCorrectWrong && isCorrectOption && (
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              )}
              {showCorrectWrong && isSelected && !isCorrectOption && (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              
              {/* Keyboard shortcut hint - only in exam mode */}
              {!showFeedback && !isLearnMode && (
                <span className="flex-shrink-0 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Press {index + 1}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Learn Mode Feedback */}
      {isLearnMode && showFeedback && (
        <div className={`mb-6 p-4 rounded-xl border-2 animate-fade-in ${
          isCorrect 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-emerald-700">Correct! 🎉</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="font-bold text-red-700">Incorrect</span>
              </>
            )}
          </div>
          
          {!isCorrect && (
            <p className="text-sm text-gray-700 mb-2">
              The correct answer is: <span className="font-semibold text-emerald-600">{question.correct}</span>
            </p>
          )}
          
          {question.explanation && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-200">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">{question.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* AI In-Depth Explanation Button & Display */}
      {showAIButton && !aiExplanation && (
        <div className="mb-6">
          {(() => {
            const apiConfigured = isOpenAIConfigured()
            const { remainingCalls, resetInSeconds, unlimited } = apiConfigured ? rateLimit : { remainingCalls: 0, resetInSeconds: 0, unlimited: false }
            const isRateLimited = apiConfigured && !unlimited && remainingCalls <= 0
            
            return (
              <>
                <button
                  onClick={handleGetAIExplanation}
                  disabled={isLoadingAI || isRateLimited || !apiConfigured}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all duration-200 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!apiConfigured ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-500 font-medium">AI Explanations - API key not configured</span>
                    </>
                  ) : isLoadingAI ? (
                    <>
                      <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                      <span className="text-purple-700 font-medium">Getting in-depth explanation...</span>
                    </>
                  ) : isRateLimited ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <span className="text-amber-700 font-medium">Rate limited - wait {resetInSeconds}s</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                      <span className="text-purple-700 font-medium">Get AI-Powered In-Depth Explanation</span>
                      {unlimited ? (
                        <span className="text-xs text-emerald-600 font-semibold">(∞ Unlimited)</span>
                      ) : remainingCalls === Infinity ? (
                        <span className="text-xs text-purple-400">(Checking...)</span>
                      ) : (
                        <span className="text-xs text-purple-400">
                          ({remainingCalls}{typeof remainingCalls === 'number' && remainingCalls < 1000 ? '/10' : ''} left)
                        </span>
                      )}
                    </>
                  )}
                </button>
                
                {aiError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{aiError}</p>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* AI Explanation Display */}
      {aiExplanation && (
        <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-bold text-purple-700">AI-Powered Explanation</span>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {aiExplanation}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Previous Button - show in exam mode or learn mode (when feedback is shown) */}
        {(!isLearnMode || showFeedback) && (
          <button
            onClick={onPrevious}
            disabled={isFirst}
            className="btn-secondary flex items-center justify-center gap-2 sm:flex-1 order-2 sm:order-1"
            aria-label="Previous question"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
        )}

        {/* Next or Submit Button */}
        {isLearnMode ? (
          // Learn mode - navigation buttons
          showFeedback ? (
            <div className="flex gap-3 w-full order-1">
              {isLast ? (
                <button
                  onClick={handleNext}
                  className="btn-primary flex items-center justify-center gap-2 flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30 hover:shadow-emerald-500/40"
                  aria-label="Finish"
                >
                  Finish
                  <CornerDownLeft className="w-5 h-5" />
                  <span className="text-xs opacity-75 ml-1">Enter</span>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="btn-primary flex items-center justify-center gap-2 flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30 hover:shadow-emerald-500/40"
                  aria-label="Next question"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-full text-center py-3 text-gray-400">
              Select an answer to continue
            </div>
          )
        ) : (
          // Exam mode - previous/next or submit
          isLast ? (
            <button
              onClick={onSubmit}
              className={`btn-primary flex items-center justify-center gap-2 sm:flex-1 order-1 sm:order-2 ${
                allAnswered ? 'animate-pulse-slow' : ''
              }`}
              aria-label="Submit quiz"
            >
              <Send className="w-5 h-5" />
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={onNext}
              className="btn-primary flex items-center justify-center gap-2 sm:flex-1 order-1 sm:order-2"
              aria-label="Next question"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )
        )}
      </div>

      {/* Answer status indicator - only in exam mode */}
      {!isLearnMode && (
        <div className="mt-4 text-center">
          {selectedAnswer ? (
            <span className="text-sm text-green-600">
              ✓ Answer selected
            </span>
          ) : (
            <span className="text-sm text-amber-600">
              ○ No answer selected
            </span>
          )}
        </div>
      )}
    </div>
  )
})

export default QuizQuestion
