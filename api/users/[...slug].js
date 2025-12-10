import { getPool, verifyAdminSession, verifyUserSession } from '../db.js'
import crypto from 'crypto'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const pool = getPool()
  const slug = req.query.slug || []
  const route = Array.isArray(slug) ? slug.join('/') : slug
  const token = req.headers.authorization
  const adminToken = req.headers['x-admin-token']

  try {
    // Parse route segments
    const segments = route.split('/')
    const endpoint = segments[0] || ''
    const id = segments[1] || req.query.id

    // Public routes (no auth required)
    if (endpoint === 'register' && req.method === 'POST') {
      const { username, password, pin, email } = req.body

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

      return res.json({
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
    }

    if (endpoint === 'login' && req.method === 'POST') {
      const { username, password, pin } = req.body

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

      return res.json({
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
    }

    // Verify route (returns error if invalid)
    if (endpoint === 'verify' && req.method === 'GET') {
      const user = await verifyUserSession(token)
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired session' })
      }
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          unlimitedAI: user.unlimited_ai,
          dailyAILimit: user.daily_ai_limit,
        },
      })
    }

    // Logout route
    if (endpoint === 'logout' && req.method === 'POST') {
      if (token) {
        await pool.query('DELETE FROM user_sessions WHERE session_token = $1', [
          token.replace('Bearer ', '')
        ])
      }
      return res.json({ message: 'Logged out successfully' })
    }

    // Daily calls route (user auth required)
    if (endpoint === 'daily-calls' && req.method === 'GET') {
      const user = await verifyUserSession(token)
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired session' })
      }

      const today = new Date().toISOString().split('T')[0]

      // Get today's call count
      const callResult = await pool.query(
        'SELECT call_count FROM user_daily_calls WHERE user_id = $1 AND call_date = $2',
        [user.id, today]
      )

      const callCount = callResult.rows.length > 0 ? callResult.rows[0].call_count : 0

      return res.json({
        dailyUsed: callCount,
        dailyLimit: user.unlimited_ai ? Infinity : user.daily_ai_limit,
        unlimited: user.unlimited_ai,
      })
    }

    // Record call route (user auth required)
    if (endpoint === 'record-call' && req.method === 'POST') {
      const user = await verifyUserSession(token)
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired session' })
      }

      // Don't track for unlimited users
      if (user.unlimited_ai) {
        return res.json({ message: 'Call recorded (unlimited user)' })
      }

      const today = new Date().toISOString().split('T')[0]

      // Upsert daily call count
      await pool.query(
        `INSERT INTO user_daily_calls (user_id, call_date, call_count)
         VALUES ($1, $2, 1)
         ON CONFLICT (user_id, call_date)
         DO UPDATE SET call_count = user_daily_calls.call_count + 1`,
        [user.id, today]
      )

      return res.json({ message: 'Call recorded successfully' })
    }

    // Admin-only routes - require admin auth
    if (endpoint === '' && (req.method === 'GET' || req.method === 'POST')) {
      // List users (GET) or create user (POST)
      const admin = await verifyAdminSession(adminToken)
      if (!admin) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

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
    }

    // User by ID (admin only - update/delete)
    if (id && (req.method === 'PUT' || req.method === 'DELETE')) {
      const admin = await verifyAdminSession(adminToken)
      if (!admin) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (req.method === 'PUT') {
        const { username, password, pin, email, unlimitedAI, dailyAILimit } = req.body

        // Check if PIN is being changed and already exists
        if (pin && /^\d{4}$/.test(pin)) {
          const pinCheck = await pool.query(
            'SELECT * FROM users WHERE pin = $1 AND id != $2',
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
          values.push(username.toLowerCase())
        }
        if (password && password.length >= 6) {
          updates.push(`password = $${paramCount++}`)
          values.push(password)
        }
        if (pin && /^\d{4}$/.test(pin)) {
          updates.push(`pin = $${paramCount++}`)
          values.push(pin)
        }
        if (email !== undefined) {
          updates.push(`email = $${paramCount++}`)
          values.push(email || null)
        }
        if (unlimitedAI !== undefined) {
          updates.push(`unlimited_ai = $${paramCount++}`)
          values.push(unlimitedAI)
        }
        if (dailyAILimit !== undefined) {
          updates.push(`daily_ai_limit = $${paramCount++}`)
          values.push(unlimitedAI ? 999999 : dailyAILimit)
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No updates provided' })
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`)
        values.push(id)

        const result = await pool.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
          values
        )

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' })
        }

        return res.json({
          id: result.rows[0].id,
          username: result.rows[0].username,
          email: result.rows[0].email,
          role: result.rows[0].role,
          unlimitedAI: result.rows[0].unlimited_ai,
          dailyAILimit: result.rows[0].daily_ai_limit,
          updatedAt: result.rows[0].updated_at,
        })
      }

      if (req.method === 'DELETE') {
        await pool.query('DELETE FROM users WHERE id = $1', [id])
        return res.json({ message: 'User deleted successfully' })
      }
    }

    return res.status(404).json({ error: 'Route not found' })
  } catch (error) {
    console.error('Users API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
