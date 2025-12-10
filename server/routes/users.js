import express from 'express'
import pool from '../db/connection.js'
import crypto from 'crypto'

const router = express.Router()

// Generate session token
function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// User registration
router.post('/register', async (req, res) => {
  try {
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
    const sessionToken = generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24 * 7) // 7 day session

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
})

// User login
router.post('/login', async (req, res) => {
  try {
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
    const sessionToken = generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24 * 7) // 7 day session

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
})

// Verify user session
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const result = await pool.query(
      `SELECT u.* FROM users u
       JOIN user_sessions s ON u.id = s.user_id
       WHERE s.session_token = $1 AND s.expires_at > NOW()`,
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        unlimitedAI: user.unlimited_ai,
        dailyAILimit: user.daily_ai_limit,
      },
    })
  } catch (error) {
    console.error('User verify error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      await pool.query('DELETE FROM user_sessions WHERE session_token = $1', [token])
    }

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('User logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const adminToken = req.headers['x-admin-token']?.replace('Bearer ', '')

    // Verify admin session
    const adminCheck = await pool.query(
      'SELECT admin_id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [adminToken]
    )

    if (adminCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC')
    res.json(result.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      unlimitedAI: user.unlimited_ai,
      dailyAILimit: user.daily_ai_limit,
      createdAt: user.created_at,
    })))
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create user (admin only)
router.post('/', async (req, res) => {
  try {
    const adminToken = req.headers['x-admin-token']?.replace('Bearer ', '')

    // Verify admin session
    const adminCheck = await pool.query(
      'SELECT admin_id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [adminToken]
    )

    if (adminCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

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

    res.json({
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email,
      role: result.rows[0].role,
      unlimitedAI: result.rows[0].unlimited_ai,
      dailyAILimit: result.rows[0].daily_ai_limit,
      createdAt: result.rows[0].created_at,
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user (admin only)
router.put('/:id', async (req, res) => {
  try {
    const adminToken = req.headers['x-admin-token']?.replace('Bearer ', '')

    // Verify admin session
    const adminCheck = await pool.query(
      'SELECT admin_id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [adminToken]
    )

    if (adminCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.params
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

    res.json({
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email,
      role: result.rows[0].role,
      unlimitedAI: result.rows[0].unlimited_ai,
      dailyAILimit: result.rows[0].daily_ai_limit,
      updatedAt: result.rows[0].updated_at,
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete user (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const adminToken = req.headers['x-admin-token']?.replace('Bearer ', '')

    // Verify admin session
    const adminCheck = await pool.query(
      'SELECT admin_id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [adminToken]
    )

    if (adminCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.params
    await pool.query('DELETE FROM users WHERE id = $1', [id])
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's daily AI call count
router.get('/daily-calls', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Get user from session
    const userResult = await pool.query(
      `SELECT u.* FROM users u
       JOIN user_sessions s ON u.id = s.user_id
       WHERE s.session_token = $1 AND s.expires_at > NOW()`,
      [token]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    const user = userResult.rows[0]
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
})

// Record AI call
router.post('/record-call', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Get user from session
    const userResult = await pool.query(
      `SELECT u.* FROM users u
       JOIN user_sessions s ON u.id = s.user_id
       WHERE s.session_token = $1 AND s.expires_at > NOW()`,
      [token]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    const user = userResult.rows[0]

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

    res.json({ message: 'Call recorded successfully' })
  } catch (error) {
    console.error('Record call error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

