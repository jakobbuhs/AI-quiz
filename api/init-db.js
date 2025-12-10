import { getPool } from './db.js'

// Database initialization endpoint - call once to set up tables
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to initialize database.' })
  }

  // Optional: Add a secret key check for security
  const initSecret = req.headers['x-init-secret']
  if (process.env.INIT_SECRET && initSecret !== process.env.INIT_SECRET) {
    return res.status(401).json({ error: 'Invalid initialization secret' })
  }

  try {
    const pool = getPool()

    // Create admin_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        pin VARCHAR(4) UNIQUE NOT NULL,
        ai_limit INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        pin VARCHAR(4) UNIQUE NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'self-registered',
        unlimited_ai BOOLEAN DEFAULT FALSE,
        daily_ai_limit INTEGER DEFAULT 10,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create user_daily_calls table for tracking AI usage
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_daily_calls (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        call_date DATE NOT NULL,
        call_count INTEGER DEFAULT 0,
        UNIQUE(user_id, call_date)
      )
    `)

    // Create admin_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `)

    // Create user_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `)

    // Create indexes for better performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_pin ON users(pin)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_users_pin ON admin_users(pin)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_daily_calls_user_date ON user_daily_calls(user_id, call_date)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(session_token)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)`)

    // Insert default admin if none exists
    const adminCheck = await pool.query('SELECT COUNT(*) FROM admin_users')
    let defaultAdminCreated = false
    if (parseInt(adminCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO admin_users (username, pin, ai_limit)
        VALUES ('admin', '0000', 100)
      `)
      defaultAdminCreated = true
    }

    res.json({ 
      success: true, 
      message: 'Database initialized successfully',
      defaultAdminCreated,
      tables: [
        'admin_users',
        'users',
        'user_daily_calls',
        'admin_sessions',
        'user_sessions'
      ]
    })
  } catch (error) {
    console.error('Database initialization error:', error)
    res.status(500).json({ error: 'Failed to initialize database', details: error.message })
  }
}

