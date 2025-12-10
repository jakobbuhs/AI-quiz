// Storage utility functions for quiz progress
// Only saves/loads if user has accepted cookies

const STORAGE_KEYS = {
  QUIZ_STATE: 'quizState',
  COOKIE_CONSENT: 'cookieConsent',
}

/**
 * Check if user has accepted cookies
 */
export const hasAcceptedCookies = () => {
  return localStorage.getItem(STORAGE_KEYS.COOKIE_CONSENT) === 'accepted'
}

/**
 * Save quiz state to localStorage (only if cookies accepted)
 */
export const saveQuizState = (state) => {
  if (!hasAcceptedCookies()) {
    return false
  }

  try {
    const stateToSave = {
      quizStatus: state.quizStatus,
      quizMode: state.quizMode,
      selectedQuestionCount: state.selectedQuestionCount,
      currentQuestionIndex: state.currentQuestionIndex,
      selectedQuestions: state.selectedQuestions,
      userAnswers: state.userAnswers,
      timeRemaining: state.timeRemaining,
      timeTaken: state.timeTaken,
      answerResults: state.answerResults,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEYS.QUIZ_STATE, JSON.stringify(stateToSave))
    return true
  } catch (error) {
    console.error('Error saving quiz state:', error)
    return false
  }
}

/**
 * Load quiz state from localStorage (only if cookies accepted)
 */
export const loadQuizState = () => {
  if (!hasAcceptedCookies()) {
    return null
  }

  try {
    const savedState = localStorage.getItem(STORAGE_KEYS.QUIZ_STATE)
    if (!savedState) {
      return null
    }

    const state = JSON.parse(savedState)
    
    // Check if state is too old (e.g., older than 24 hours)
    const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours
    if (state.timestamp && Date.now() - state.timestamp > MAX_AGE) {
      clearQuizState()
      return null
    }

    return state
  } catch (error) {
    console.error('Error loading quiz state:', error)
    return null
  }
}

/**
 * Clear quiz state from localStorage
 */
export const clearQuizState = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.QUIZ_STATE)
  } catch (error) {
    console.error('Error clearing quiz state:', error)
  }
}

/**
 * Get cookie consent status
 */
export const getCookieConsent = () => {
  return localStorage.getItem(STORAGE_KEYS.COOKIE_CONSENT)
}

