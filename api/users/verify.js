import { verifyUserSession } from '../db.js'

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
    const user = await verifyUserSession(token)

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

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
}

