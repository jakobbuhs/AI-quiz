import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import QuizApp from './components/QuizApp'
import Login from './components/Login'
import AdminDashboard from './components/AdminDashboard'
import { getCurrentAdmin } from './utils/apiAuth'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const admin = await getCurrentAdmin()
      setIsAuthorized(!!admin)
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return isAuthorized ? children : <Navigate to="/admin/login" replace />
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if admin is already logged in
    const checkAuth = async () => {
      const admin = await getCurrentAdmin()
      setIsAuthenticated(!!admin)
    }
    checkAuth()
  }, [])

  const handleLogin = (admin) => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  return (
    <Routes>
      <Route path="/" element={<QuizApp />} />
      <Route 
        path="/admin/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/admin" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        } 
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
