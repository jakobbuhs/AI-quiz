import { verifyAdminSession } from '../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = req.headers.authorization
    const admin = await verifyAdminSession(token)

    if (!admin) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

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
}

