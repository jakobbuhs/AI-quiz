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
    const { username, password, pin, email } = req.body
    const pool = getPool()

    if (!username || !password || !pin) {
      return res.status(400).json({ error: 'Username, password, and PIN are required' })
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' })
    }

    // Check if username or PIN already exists
    const existing = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR pin = $2',
      [username.toLowerCase(), pin]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        error: existing.rows[0].username.toLowerCase() === username.toLowerCase()
          ? 'Username already exists' 
          : 'PIN already exists' 
      })
    }

    const result = await pool.query(
      `INSERT INTO users (username, password, pin, email, role, unlimited_ai, daily_ai_limit)
       VALUES ($1, $2, $3, $4, 'self-registered', FALSE, 10)
       RETURNING id, username, email, role, unlimited_ai, daily_ai_limit, created_at`,
      [username.toLowerCase(), password, pin, email || null]
    )

    const user = result.rows[0]

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
    console.error('User registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

