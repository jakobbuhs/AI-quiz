import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import adminRoutes from './routes/admin.js'
import userRoutes from './routes/users.js'
import { initDatabase } from './db/init.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
initDatabase().catch(console.error)

// Routes
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

