import pg from 'pg'
const { Pool } = pg

let pool

export function getPool() {
  if (!pool) {
    // Support both DB_CREDS and Vercel's POSTGRES_URL
    const connectionString = process.env.DB_CREDS || process.env.POSTGRES_URL || process.env.DATABASE_URL
    
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  }
  return pool
}

// Helper to verify admin session
export async function verifyAdminSession(token) {
  if (!token) return null
  
  const pool = getPool()
  const result = await pool.query(
    `SELECT a.* FROM admin_users a
     JOIN admin_sessions s ON a.id = s.admin_id
     WHERE s.session_token = $1 AND s.expires_at > NOW()`,
    [token.replace('Bearer ', '')]
  )
  
  return result.rows.length > 0 ? result.rows[0] : null
}

// Helper to verify user session
export async function verifyUserSession(token) {
  if (!token) return null
  
  const pool = getPool()
  const result = await pool.query(
    `SELECT u.* FROM users u
     JOIN user_sessions s ON u.id = s.user_id
     WHERE s.session_token = $1 AND s.expires_at > NOW()`,
    [token.replace('Bearer ', '')]
  )
  
  return result.rows.length > 0 ? result.rows[0] : null
}

