// OpenAI API service for in-depth explanations
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

// Rate limiting: max 10 calls per minute (for non-logged-in users)
const RATE_LIMIT = {
  maxCalls: 10,
  windowMs: 60 * 1000, // 1 minute
  calls: [],
}

// Check if user has unlimited AI access (check localStorage directly to avoid circular deps)
// Note: This is a synchronous check for rate limiting. For accurate data, use API.
function hasUnlimitedAI() {
  try {
    // Check if we have a session token (user is logged in)
    const sessionToken = localStorage.getItem('sessionToken')
    if (!sessionToken) return false
    
    // For now, we'll check localStorage as fallback
    // In production, this should be checked via API before making the call
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) return false
    const userData = JSON.parse(currentUser)
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const user = users.find(u => u.id === userData.id)
    return user !== null && user.unlimitedAI === true
  } catch (e) {
    return false
  }
}

const SYSTEM_PROMPT = `You are an expert tutor helping students understand quiz questions they got wrong. 
Your explanations should be:
- Clear and educational
- Include relevant examples or analogies
- Break down complex concepts into simpler parts
- Mention common misconceptions if relevant
- Keep responses concise but thorough (2-4 paragraphs max)

Format your response in a friendly, encouraging tone.`

/**
 * Check if rate limit has been exceeded
 * @returns {{ allowed: boolean, remainingCalls: number, resetInSeconds: number }}
 */
function checkRateLimit() {
  const now = Date.now()
  
  // Remove calls outside the time window
  RATE_LIMIT.calls = RATE_LIMIT.calls.filter(
    (timestamp) => now - timestamp < RATE_LIMIT.windowMs
  )
  
  const remainingCalls = RATE_LIMIT.maxCalls - RATE_LIMIT.calls.length
  const oldestCall = RATE_LIMIT.calls[0]
  const resetInSeconds = oldestCall 
    ? Math.ceil((RATE_LIMIT.windowMs - (now - oldestCall)) / 1000)
    : 0
  
  return {
    allowed: remainingCalls > 0,
    remainingCalls,
    resetInSeconds,
  }
}

/**
 * Record an API call for rate limiting
 */
function recordCall() {
  RATE_LIMIT.calls.push(Date.now())
}

// Cache for rate limit status (to avoid too many API calls)
let rateLimitCache = {
  data: null,
  timestamp: 0,
  cacheDuration: 5000, // 5 seconds
}

/**
 * Get the current rate limit status
 * @returns {{ remainingCalls: number, resetInSeconds: number, unlimited: boolean, dailyLimit?: number, dailyUsed?: number }}
 */
export async function getRateLimitStatus() {
  // Check cache first
  const now = Date.now()
  if (rateLimitCache.data && (now - rateLimitCache.timestamp) < rateLimitCache.cacheDuration) {
    return rateLimitCache.data
  }

  // Check if user is logged in via API
  try {
    const sessionToken = localStorage.getItem('sessionToken')
    if (sessionToken) {
      const API_BASE_URL = import.meta.env.VITE_API_URL || (
        typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
          ? '/api' 
          : 'http://localhost:3001/api'
      )
      const response = await fetch(`${API_BASE_URL}/users/daily-calls`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const result = {
          remainingCalls: data.unlimited ? Infinity : Math.max(0, data.dailyLimit - data.dailyUsed),
          resetInSeconds: 0,
          unlimited: data.unlimited,
          dailyLimit: data.dailyLimit,
          dailyUsed: data.dailyUsed,
        }
        
        // Cache the result
        rateLimitCache = {
          data: result,
          timestamp: now,
          cacheDuration: 5000,
        }
        
        return result
      }
    }
  } catch (error) {
    console.error('Error checking daily limits via API:', error)
  }

  // Fallback: Check localStorage
  if (hasUnlimitedAI()) {
    const result = { remainingCalls: Infinity, resetInSeconds: 0, unlimited: true }
    rateLimitCache = { data: result, timestamp: now, cacheDuration: 5000 }
    return result
  }

  // Check localStorage for daily limits
  try {
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const user = users.find(u => u.id === userData.id)
      
      if (user && !user.unlimitedAI) {
        const dailyLimit = user.dailyAILimit || 10
        const dailyCalls = JSON.parse(localStorage.getItem('userDailyCalls') || '{}')
        const today = new Date().toDateString()
        const userCalls = dailyCalls[user.id] || {}
        
        if (userCalls.date !== today) {
          const result = { 
            remainingCalls: dailyLimit, 
            resetInSeconds: 0, 
            unlimited: false,
            dailyLimit: dailyLimit,
            dailyUsed: 0
          }
          rateLimitCache = { data: result, timestamp: now, cacheDuration: 5000 }
          return result
        }
        
        const dailyUsed = userCalls.count || 0
        const remaining = Math.max(0, dailyLimit - dailyUsed)
        const result = { 
          remainingCalls: remaining, 
          resetInSeconds: 0, 
          unlimited: false,
          dailyLimit: dailyLimit,
          dailyUsed: dailyUsed
        }
        rateLimitCache = { data: result, timestamp: now, cacheDuration: 5000 }
        return result
      }
    }
  } catch (error) {
    console.error('Error checking daily limits:', error)
  }
  
  // Not logged in - use per-minute rate limit
  const { remainingCalls, resetInSeconds } = checkRateLimit()
  const result = { remainingCalls, resetInSeconds, unlimited: false }
  rateLimitCache = { data: result, timestamp: now, cacheDuration: 5000 }
  return result
}

/**
 * Get an in-depth explanation for a quiz question from OpenAI
 * @param {Object} params - The parameters
 * @param {string} params.question - The quiz question
 * @param {string} params.correctAnswer - The correct answer
 * @param {string} params.userAnswer - The user's incorrect answer
 * @param {string} params.topic - The topic/category of the question
 * @param {string} params.basicExplanation - The basic explanation from the quiz
 * @returns {Promise<string>} - The in-depth explanation
 */
export async function getInDepthExplanation({ question, correctAnswer, userAnswer, topic, basicExplanation }) {
  // Check API key
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please add your API key to the .env file.')
  }

  // Check rate limit (skip if user has unlimited AI access)
  const sessionToken = localStorage.getItem('sessionToken')
  
  if (sessionToken) {
    // User is logged in - check daily limits via API
    try {
      const status = await getRateLimitStatus()
      
      if (status.unlimited) {
        // Unlimited access, proceed
      } else if (status.remainingCalls <= 0) {
        throw new Error(
          `Daily limit exceeded. You've used all ${status.dailyLimit || 10} AI explanations for today. ` +
          `Your limit will reset tomorrow. Contact an admin for unlimited access.`
        )
      }
    } catch (error) {
      // If it's already an Error with message, rethrow it
      if (error.message && error.message.includes('Daily limit exceeded')) {
        throw error
      }
      // Fallback to per-minute limit
      const { allowed, remainingCalls, resetInSeconds } = checkRateLimit()
      if (!allowed) {
        throw new Error(
          `Rate limit exceeded. You've used all 10 AI explanations for this minute. ` +
          `Please wait ${resetInSeconds} seconds before trying again.`
        )
      }
    }
  } else {
    // Not logged in - use per-minute rate limit
    const { allowed, remainingCalls, resetInSeconds } = checkRateLimit()
    if (!allowed) {
      throw new Error(
        `Rate limit exceeded. You've used all 10 AI explanations for this minute. ` +
        `Please wait ${resetInSeconds} seconds before trying again. ` +
        `Login for daily AI access!`
      )
    }
  }

  const userPrompt = `I got this question wrong and need help understanding it better:

**Topic:** ${topic}

**Question:** ${question}

**My Answer:** ${userAnswer}

**Correct Answer:** ${correctAnswer}

**Basic Explanation:** ${basicExplanation}

Please give me a more in-depth explanation to help me truly understand this concept. Why is the correct answer right, and why might someone choose my wrong answer?`

  try {
    // Record the call before making the request (only if not unlimited)
    const sessionToken = localStorage.getItem('sessionToken')
    
    if (sessionToken) {
      // User is logged in - record via API
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || (
        typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
          ? '/api' 
          : 'http://localhost:3001/api'
      )
        await fetch(`${API_BASE_URL}/users/record-call`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        })
        // Clear cache to force refresh
        rateLimitCache = { data: null, timestamp: 0, cacheDuration: 5000 }
      } catch (error) {
        console.error('Error recording call via API:', error)
        // Fallback to localStorage
        try {
          const currentUser = localStorage.getItem('currentUser')
          if (currentUser) {
            const userData = JSON.parse(currentUser)
            const users = JSON.parse(localStorage.getItem('users') || '[]')
            const user = users.find(u => u.id === userData.id)
            
            if (user && !user.unlimitedAI) {
              const dailyCalls = JSON.parse(localStorage.getItem('userDailyCalls') || '{}')
              const today = new Date().toDateString()
              const userCalls = dailyCalls[user.id] || {}
              
              if (userCalls.date !== today) {
                userCalls.date = today
                userCalls.count = 0
              }
              
              userCalls.count = (userCalls.count || 0) + 1
              dailyCalls[user.id] = userCalls
              localStorage.setItem('userDailyCalls', JSON.stringify(dailyCalls))
            }
          }
        } catch (e) {
          // Ignore localStorage errors
        }
      }
    } else {
      // Not logged in - record per-minute call
      recordCall()
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Unable to generate explanation.'
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
}

/**
 * Check if the OpenAI API key is configured
 * @returns {boolean}
 */
export function isOpenAIConfigured() {
  // Debug: Log what we're getting (safely)
  const keyExists = !!OPENAI_API_KEY
  const keyLength = OPENAI_API_KEY ? OPENAI_API_KEY.length : 0
  const keyStartsWith = OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 7) : 'none'
  
  console.log('🔍 OpenAI API Key Check:', {
    exists: keyExists,
    length: keyLength,
    startsWith: keyStartsWith,
    isDefault: OPENAI_API_KEY === 'your_openai_api_key_here',
    isEmpty: OPENAI_API_KEY === '',
    envMode: import.meta.env.MODE,
    allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('OPENAI'))
  })
  
  const hasKey = OPENAI_API_KEY && 
                 OPENAI_API_KEY !== 'your_openai_api_key_here' && 
                 OPENAI_API_KEY.trim().length > 0 &&
                 OPENAI_API_KEY.startsWith('sk-')
  
  if (!hasKey) {
    console.warn('⚠️ OpenAI API key not configured correctly.')
    console.warn('   For GitHub Pages: Set secret VITE_OPENAI_API_KEY in repo settings')
    console.warn('   For local dev: Create .env file with VITE_OPENAI_API_KEY=sk-...')
  } else {
    console.log('✅ OpenAI API key is configured')
  }
  
  return hasKey
}
