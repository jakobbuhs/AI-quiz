import { getPool } from '../db.js'
import crypto from 'crypto'

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
    const { username, password, pin } = req.body
    const pool = getPool()

    if (!username || !password || !pin) {
      return res.status(400).json({ error: 'Username, password, and PIN are required' })
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]

    // Verify password and PIN
    if (user.password !== password || user.pin !== pin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await pool.query(
      'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)',
      [user.id, sessionToken, expiresAt]
    )

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        unlimitedAI: user.unlimited_ai,
        dailyAILimit: user.daily_ai_limit,
      },
      sessionToken,
    })
  } catch (error) {
    console.error('User login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

