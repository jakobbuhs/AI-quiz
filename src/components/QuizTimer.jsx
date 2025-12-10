import { memo, useEffect, useRef, useCallback } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

const QuizTimer = memo(function QuizTimer({
  timeRemaining,
  setTimeRemaining,
  onTimeExpired,
  isRunning,
}) {
  const intervalRef = useRef(null)
  const isVisibleRef = useRef(true)
  const lastTimeRef = useRef(Date.now())

  // Format time for display
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Handle visibility change for accurate timing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false
        lastTimeRef.current = Date.now()
      } else {
        isVisibleRef.current = true
        // Calculate elapsed time while tab was hidden
        const elapsedSeconds = Math.floor((Date.now() - lastTimeRef.current) / 1000)
        if (elapsedSeconds > 0 && isRunning) {
          setTimeRemaining((prev) => Math.max(0, prev - elapsedSeconds))
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isRunning, setTimeRemaining])

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onTimeExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeRemaining, setTimeRemaining, onTimeExpired])

  // Determine timer status
  const isWarning = timeRemaining <= 60 && timeRemaining > 0
  const isCritical = timeRemaining <= 30 && timeRemaining > 0

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        isCritical
          ? 'bg-red-100 border-2 border-red-300 timer-warning'
          : isWarning
          ? 'bg-amber-100 border-2 border-amber-300'
          : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-100'
      }`}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
    >
      {isCritical ? (
        <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
      ) : (
        <Clock
          className={`w-5 h-5 ${
            isWarning ? 'text-amber-600' : 'text-indigo-600'
          }`}
        />
      )}
      
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 uppercase tracking-wide">Time Left</span>
        <span
          className={`text-xl font-bold font-mono ${
            isCritical
              ? 'text-red-600'
              : isWarning
              ? 'text-amber-600'
              : 'text-indigo-600'
          }`}
        >
          {formatTime(timeRemaining)}
        </span>
      </div>

      {isWarning && (
        <span className={`text-xs font-medium px-2 py-1 rounded ${
          isCritical ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'
        }`}>
          {isCritical ? 'Hurry!' : 'Almost done!'}
        </span>
      )}
    </div>
  )
})

export default QuizTimer

