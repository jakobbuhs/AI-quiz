import { getPool, verifyUserSession } from '../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = req.headers.authorization
    const user = await verifyUserSession(token)

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    // Don't track for unlimited users
    if (user.unlimited_ai) {
      return res.json({ message: 'Call recorded (unlimited user)' })
    }

    const pool = getPool()
    const today = new Date().toISOString().split('T')[0]

    // Upsert daily call count
    await pool.query(
      `INSERT INTO user_daily_calls (user_id, call_date, call_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, call_date)
       DO UPDATE SET call_count = user_daily_calls.call_count + 1`,
      [user.id, today]
    )

    res.json({ message: 'Call recorded successfully' })
  } catch (error) {
    console.error('Record call error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

