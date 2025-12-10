import { getPool, verifyAdminSession } from '../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const pool = getPool()
  const adminToken = req.headers['x-admin-token']
  const { id } = req.query

  // Verify admin session
  const admin = await verifyAdminSession(adminToken)
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // PUT - Update user
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

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM users WHERE id = $1', [id])
      return res.json({ message: 'User deleted successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Users/[id] error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

