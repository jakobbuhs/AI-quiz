import { getPool, verifyAdminSession } from '../db.js'
import crypto from 'crypto'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const pool = getPool()
  const slug = req.query.slug || []
  const route = Array.isArray(slug) ? slug.join('/') : slug
  const token = req.headers.authorization

  try {
    // Parse route segments
    const segments = route.split('/')
    const endpoint = segments[0] || ''
    const id = segments[1] || req.query.id

    // Public routes (no auth required)
    if (endpoint === 'login' && req.method === 'POST') {
      const { pin } = req.body

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

      return res.json({
        admin: { id: admin.id, username: admin.username, aiLimit: admin.ai_limit },
        sessionToken,
      })
    }

    // Verify route (no auth check, but returns error if invalid)
    if (endpoint === 'verify' && req.method === 'GET') {
      const admin = await verifyAdminSession(token)
      if (!admin) {
        return res.status(401).json({ error: 'Invalid or expired session' })
      }
      return res.json({
        admin: {
          id: admin.id,
          username: admin.username,
          aiLimit: admin.ai_limit,
        },
      })
    }

    // Logout route
    if (endpoint === 'logout' && req.method === 'POST') {
      if (token) {
        await pool.query('DELETE FROM admin_sessions WHERE session_token = $1', [
          token.replace('Bearer ', '')
        ])
      }
      return res.json({ message: 'Logged out successfully' })
    }

    // Protected routes - require auth
    const admin = await verifyAdminSession(token)
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Admins list/create
    if (endpoint === 'admins') {
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
    }

    // Admin by ID (update/delete)
    if (endpoint === 'admins' && id) {
      if (req.method === 'PUT') {
        const { username, pin, aiLimit } = req.body

        if (pin && /^\d{4}$/.test(pin)) {
          const pinCheck = await pool.query(
            'SELECT * FROM admin_users WHERE pin = $1 AND id != $2',
            [pin, id]
          )
          if (pinCheck.rows.length > 0) {
            return res.status(400).json({ error: 'PIN already exists' })
          }
        }

        const updates = []
        const values = []
        let paramCount = 1

        if (username) {
          updates.push(`username = $${paramCount++}`)
          values.push(username)
        }
        if (pin && /^\d{4}$/.test(pin)) {
          updates.push(`pin = $${paramCount++}`)
          values.push(pin)
        }
        if (aiLimit !== undefined) {
          updates.push(`ai_limit = $${paramCount++}`)
          values.push(aiLimit)
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No updates provided' })
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`)
        values.push(id)

        const result = await pool.query(
          `UPDATE admin_users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
          values
        )

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Admin not found' })
        }

        return res.json({
          id: result.rows[0].id,
          username: result.rows[0].username,
          pin: result.rows[0].pin,
          aiLimit: result.rows[0].ai_limit,
          updatedAt: result.rows[0].updated_at,
        })
      }

      if (req.method === 'DELETE') {
        const countResult = await pool.query('SELECT COUNT(*) FROM admin_users')
        if (parseInt(countResult.rows[0].count) <= 1) {
          return res.status(400).json({ error: 'Cannot delete the last admin user' })
        }

        await pool.query('DELETE FROM admin_users WHERE id = $1', [id])
        return res.json({ message: 'Admin deleted successfully' })
      }
    }

    return res.status(404).json({ error: 'Route not found' })
  } catch (error) {
    console.error('Admin API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
