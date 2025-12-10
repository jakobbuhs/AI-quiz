import { memo } from 'react'
import { ChevronLeft, ChevronRight, Send, Tag } from 'lucide-react'

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
}) {
  if (!question) return null

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
          Press {questionNumber} to select • Arrow keys to navigate
        </span>
      </div>

      {/* Question Text */}
      <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-8 leading-relaxed">
        {question.question}
      </h3>

      {/* Answer Options */}
      <div className="space-y-3 mb-8">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelect(option)}
            className={`quiz-option flex items-start gap-4 group ${
              selectedAnswer === option ? 'quiz-option-selected' : ''
            }`}
            aria-pressed={selectedAnswer === option}
          >
            {/* Option letter */}
            <span
              className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm transition-colors ${
                selectedAnswer === option
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
              }`}
            >
              {String.fromCharCode(65 + index)}
            </span>
            
            {/* Option text */}
            <span className="text-left flex-1 pt-1">{option}</span>
            
            {/* Keyboard shortcut hint */}
            <span className="flex-shrink-0 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Press {index + 1}
            </span>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className="btn-secondary flex items-center justify-center gap-2 sm:flex-1 order-2 sm:order-1"
          aria-label="Previous question"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        {/* Next or Submit Button */}
        {isLast ? (
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
        )}
      </div>

      {/* Answer status indicator */}
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
    </div>
  )
})

export default QuizQuestion

