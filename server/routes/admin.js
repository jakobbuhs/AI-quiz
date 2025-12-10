import express from 'express'
import pool from '../db/connection.js'
import crypto from 'crypto'

const router = express.Router()

// Generate session token
function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { pin } = req.body

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'Invalid PIN format' })
    }

    const result = await pool.query(
      'SELECT * FROM admin_users WHERE pin = $1',
      [pin]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    const admin = result.rows[0]

    // Create session
    const sessionToken = generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour session

    await pool.query(
      'INSERT INTO admin_sessions (admin_id, session_token, expires_at) VALUES ($1, $2, $3)',
      [admin.id, sessionToken, expiresAt]
    )

    res.json({
      admin: {
        id: admin.id,
        username: admin.username,
        aiLimit: admin.ai_limit,
      },
      sessionToken,
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Verify admin session
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const result = await pool.query(
      `SELECT a.* FROM admin_users a
       JOIN admin_sessions s ON a.id = s.admin_id
       WHERE s.session_token = $1 AND s.expires_at > NOW()`,
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    const admin = result.rows[0]
    res.json({
      admin: {
        id: admin.id,
        username: admin.username,
        aiLimit: admin.ai_limit,
      },
    })
  } catch (error) {
    console.error('Admin verify error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      await pool.query('DELETE FROM admin_sessions WHERE session_token = $1', [token])
    }

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Admin logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all admin users
router.get('/admins', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    // Verify admin session
    const sessionCheck = await pool.query(
      'SELECT admin_id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [token]
    )

    if (sessionCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await pool.query('SELECT * FROM admin_users ORDER BY created_at DESC')
    res.json(result.rows.map(admin => ({
      id: admin.id,
      username: admin.username,
      pin: admin.pin,
      aiLimit: admin.ai_limit,
      createdAt: admin.created_at,
    })))
  } catch (error) {
    console.error('Get admins error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add admin user
router.post('/admins', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    // Verify admin session
    const sessionCheck = await pool.query(
      'SELECT admin_id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [token]
    )

    if (sessionCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { username, pin, aiLimit } = req.body

    if (!username || !pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'Invalid input' })
    }

    // Check if username or PIN already exists
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

    res.json({
      id: result.rows[0].id,
      username: result.rows[0].username,
      pin: result.rows[0].pin,
      aiLimit: result.rows[0].ai_limit,
      createdAt: result.rows[0].created_at,
    })
  } catch (error) {
    console.error('Add admin error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update admin user
router.put('/admins/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    // Verify admin session
    const sessionCheck = await pool.query(
      'SELECT admin_id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [token]
    )

    if (sessionCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.params
    const { username, pin, aiLimit } = req.body

    // Check if PIN is being changed and already exists
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

    res.json({
      id: result.rows[0].id,
      username: result.rows[0].username,
      pin: result.rows[0].pin,
      aiLimit: result.rows[0].ai_limit,
      updatedAt: result.rows[0].updated_at,
    })
  } catch (error) {
    console.error('Update admin error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete admin user
router.delete('/admins/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    // Verify admin session
    const sessionCheck = await pool.query(
      'SELECT admin_id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [token]
    )

    if (sessionCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.params

    // Check if this is the last admin
    const countResult = await pool.query('SELECT COUNT(*) FROM admin_users')
    if (parseInt(countResult.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' })
    }

    await pool.query('DELETE FROM admin_users WHERE id = $1', [id])
    res.json({ message: 'Admin deleted successfully' })
  } catch (error) {
    console.error('Delete admin error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

