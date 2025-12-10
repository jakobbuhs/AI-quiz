import { getPool, verifyAdminSession } from '../db.js'
import crypto from 'crypto'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const pool = getPool()
  const token = req.headers.authorization

  // Verify admin session for all operations
  const admin = await verifyAdminSession(token)
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // GET - List all admins
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM admin_users ORDER BY created_at DESC')
      return res.json(result.rows.map(a => ({
        id: a.id,
        username: a.username,
        pin: a.pin,
        aiLimit: a.ai_limit,
        createdAt: a.created_at,
      })))
    }

    // POST - Create admin
    if (req.method === 'POST') {
      const { username, pin, aiLimit } = req.body

      if (!username || !pin || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: 'Invalid input' })
      }

      const existing = await pool.query(
        'SELECT * FROM admin_users WHERE username = $1 OR pin = $2',
        [username, pin]
      )

      if (existing.rows.length > 0) {
        return res.status(400).json({ 
          error: existing.rows[0].username === username 
            ? 'Username already exists' 
            : 'PIN already exists' 
        })
      }

      const result = await pool.query(
        'INSERT INTO admin_users (username, pin, ai_limit) VALUES ($1, $2, $3) RETURNING *',
        [username, pin, aiLimit || 100]
      )

      return res.json({
        id: result.rows[0].id,
        username: result.rows[0].username,
        pin: result.rows[0].pin,
        aiLimit: result.rows[0].ai_limit,
        createdAt: result.rows[0].created_at,
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Admin admins error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

