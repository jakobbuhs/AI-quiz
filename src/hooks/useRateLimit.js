import { useState, useEffect } from 'react'
import { getRateLimitStatus } from '../services/openai'

export function useRateLimit() {
  const [rateLimit, setRateLimit] = useState({
    remainingCalls: 0,
    resetInSeconds: 0,
    unlimited: false,
    dailyLimit: null,
    dailyUsed: null,
    loading: true,
  })

  const updateRateLimit = async () => {
    try {
      const status = await getRateLimitStatus()
      setRateLimit({
        ...status,
        loading: false,
      })
    } catch (error) {
      console.error('Error fetching rate limit:', error)
      setRateLimit(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    updateRateLimit()
    // Update every 5 seconds
    const interval = setInterval(updateRateLimit, 5000)
    return () => clearInterval(interval)
  }, [])

  return { ...rateLimit, refresh: updateRateLimit }
}

