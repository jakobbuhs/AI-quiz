import { getPool } from '../db.js'
import crypto from 'crypto'

export default async function handler(req, res) {
  // Enable CORS
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
    const { pin } = req.body
    const pool = getPool()

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'Invalid PIN format' })
    }

    const result = await pool.query('SELECT * FROM admin_users WHERE pin = $1', [pin])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    const admin = result.rows[0]
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await pool.query(
      'INSERT INTO admin_sessions (admin_id, session_token, expires_at) VALUES ($1, $2, $3)',
      [admin.id, sessionToken, expiresAt]
    )

    res.json({
      admin: { id: admin.id, username: admin.username, aiLimit: admin.ai_limit },
      sessionToken,
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

