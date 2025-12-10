import pg from 'pg'
const { Pool } = pg

// Parse DB_CREDS environment variable
// Format: DB_CREDS=postgresql://user:password@host:port/database
// Or: DB_CREDS=db key (if using a service like Railway, Render, etc.)
let connectionString = process.env.DB_CREDS

// If DB_CREDS is just a key, try to construct connection string from other env vars
if (!connectionString || connectionString === 'db key') {
  connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ai_quiz'}`
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err)
})

export default pool

