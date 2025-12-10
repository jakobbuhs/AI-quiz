import { getPool } from '../db.js'

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
    const token = req.headers.authorization?.replace('Bearer ', '')
    const pool = getPool()

    if (token) {
      await pool.query('DELETE FROM admin_sessions WHERE session_token = $1', [token])
    }

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Admin logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

