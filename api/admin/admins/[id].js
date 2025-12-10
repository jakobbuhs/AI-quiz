import { getPool, verifyAdminSession } from '../../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const pool = getPool()
  const token = req.headers.authorization
  const { id } = req.query

  // Verify admin session
  const admin = await verifyAdminSession(token)
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // PUT - Update admin
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

    // DELETE - Delete admin
    if (req.method === 'DELETE') {
      const countResult = await pool.query('SELECT COUNT(*) FROM admin_users')
      if (parseInt(countResult.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' })
      }

      await pool.query('DELETE FROM admin_users WHERE id = $1', [id])
      return res.json({ message: 'Admin deleted successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Admin admins/[id] error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

