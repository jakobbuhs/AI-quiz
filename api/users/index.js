import { getPool, verifyAdminSession } from '../db.js'
import crypto from 'crypto'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const pool = getPool()
  const adminToken = req.headers['x-admin-token']

  // Verify admin session for all operations
  const admin = await verifyAdminSession(adminToken)
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // GET - List all users
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC')
      return res.json(result.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        unlimitedAI: user.unlimited_ai,
        dailyAILimit: user.daily_ai_limit,
        createdAt: user.created_at,
      })))
    }

    // POST - Create user
    if (req.method === 'POST') {
      const { username, password, pin, email, unlimitedAI, dailyAILimit } = req.body

      if (!username || !password || !pin) {
        return res.status(400).json({ error: 'Username, password, and PIN are required' })
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
        `INSERT INTO users (username, password, pin, email, role, unlimited_ai, daily_ai_limit, created_by)
         VALUES ($1, $2, $3, $4, 'admin-created', $5, $6, 'admin')
         RETURNING id, username, email, role, unlimited_ai, daily_ai_limit, created_at`,
        [
          username.toLowerCase(),
          password,
          pin,
          email || null,
          unlimitedAI || false,
          unlimitedAI ? 999999 : (dailyAILimit || 10)
        ]
      )

      return res.json({
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        role: result.rows[0].role,
        unlimitedAI: result.rows[0].unlimited_ai,
        dailyAILimit: result.rows[0].daily_ai_limit,
        createdAt: result.rows[0].created_at,
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

