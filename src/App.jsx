import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import QuizApp from './components/QuizApp'
import Login from './components/Login'
import AdminDashboard from './components/AdminDashboard'
import { getCurrentAdmin } from './utils/adminAuth'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const admin = getCurrentAdmin()
  return admin ? children : <Navigate to="/admin/login" replace />
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if admin is already logged in
    const admin = getCurrentAdmin()
    setIsAuthenticated(!!admin)
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
