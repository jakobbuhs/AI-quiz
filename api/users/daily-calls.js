import { getPool, verifyUserSession } from '../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = req.headers.authorization
    const user = await verifyUserSession(token)

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    const pool = getPool()
    const today = new Date().toISOString().split('T')[0]

    // Get today's call count
    const callResult = await pool.query(
      'SELECT call_count FROM user_daily_calls WHERE user_id = $1 AND call_date = $2',
      [user.id, today]
    )

    const callCount = callResult.rows.length > 0 ? callResult.rows[0].call_count : 0

    res.json({
      dailyUsed: callCount,
      dailyLimit: user.unlimited_ai ? Infinity : user.daily_ai_limit,
      unlimited: user.unlimited_ai,
    })
  } catch (error) {
    console.error('Get daily calls error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

