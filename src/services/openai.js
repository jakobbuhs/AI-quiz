// OpenAI API service for in-depth explanations
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

// Rate limiting: max 10 calls per minute
const RATE_LIMIT = {
  maxCalls: 10,
  windowMs: 60 * 1000, // 1 minute
  calls: [],
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

/**
 * Get the current rate limit status
 * @returns {{ remainingCalls: number, resetInSeconds: number }}
 */
export function getRateLimitStatus() {
  const { remainingCalls, resetInSeconds } = checkRateLimit()
  return { remainingCalls, resetInSeconds }
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

  // Check rate limit
  const { allowed, remainingCalls, resetInSeconds } = checkRateLimit()
  if (!allowed) {
    throw new Error(
      `Rate limit exceeded. You've used all 10 AI explanations for this minute. ` +
      `Please wait ${resetInSeconds} seconds before trying again.`
    )
  }

  const userPrompt = `I got this question wrong and need help understanding it better:

**Topic:** ${topic}

**Question:** ${question}

**My Answer:** ${userAnswer}

**Correct Answer:** ${correctAnswer}

**Basic Explanation:** ${basicExplanation}

Please give me a more in-depth explanation to help me truly understand this concept. Why is the correct answer right, and why might someone choose my wrong answer?`

  try {
    // Record the call before making the request
    recordCall()

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
  return OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here'
}
