import { useState, useRef, useEffect } from 'react'
import { X, User, LogIn, UserPlus, AlertCircle, CheckCircle, Lock, Key } from 'lucide-react'
import { registerUser, loginUserByCredentials, getCurrentUser, logoutUser, validatePIN, validatePassword } from '../utils/apiAuth'

const UserLogin = ({ isOpen, onClose, onLogin, onLogout }) => {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const pinInputRefs = useRef([])

  const [currentUser, setCurrentUser] = useState(null)

  // Load current user on mount
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)
    }
    if (isOpen) {
      loadUser()
    }
  }, [isOpen])

  // Focus first PIN input when PIN field is shown
  useEffect(() => {
    if (isOpen && pinInputRefs.current[0]) {
      pinInputRefs.current[0]?.focus()
    }
  }, [isOpen, mode])

  // Handle PIN input change
  const handlePinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    setError('')

    // Auto-focus next input
    if (value && index < 3) {
      pinInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle PIN backspace
  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus()
    }
  }

  // Handle PIN paste
  const handlePinPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    
    if (/^\d{4}$/.test(pastedData)) {
      const newPin = pastedData.split('')
      setPin(newPin)
      setError('')
      pinInputRefs.current[3]?.focus()
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    if (!username.trim()) {
      setError('Please enter a username')
      setIsLoading(false)
      return
    }

    if (!password) {
      setError('Please enter your password')
      setIsLoading(false)
      return
    }

    const pinString = pin.join('')
    if (!validatePIN(pinString)) {
      setError('Please enter a valid 4-digit PIN')
      setIsLoading(false)
      return
    }

    try {
      const user = await loginUserByCredentials(username.trim(), password, pinString)
      if (user) {
        setSuccess(`Welcome back, ${user.username}!`)
        setCurrentUser(user)
        setTimeout(() => {
          onLogin(user)
          handleClose()
        }, 1000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    if (!username.trim()) {
      setError('Please enter a username')
      setIsLoading(false)
      return
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long')
      setIsLoading(false)
      return
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    const pinString = pin.join('')
    if (!validatePIN(pinString)) {
      setError('PIN must be exactly 4 digits')
      setIsLoading(false)
      return
    }

    try {
      const user = await registerUser(username.trim(), password, pinString, email.trim())
      setSuccess(`Account created! Welcome, ${user.username}!`)
      setCurrentUser(user)
      setTimeout(() => {
        onLogin(user)
        handleClose()
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    setCurrentUser(null)
    onLogout()
    handleClose()
  }

  const handleClose = () => {
    setMode('login')
    setUsername('')
    setPassword('')
    setPin(['', '', '', ''])
    setEmail('')
    setError('')
    setSuccess('')
    setShowPassword(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card p-6 max-w-md w-full animate-slide-up relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          // Logged in view
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30 mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Logged In</h2>
            <p className="text-gray-600 mb-1">
              Welcome, <span className="font-semibold text-indigo-600">{currentUser.username}</span>!
            </p>
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-6">
              <div className="flex items-center gap-2 text-indigo-700 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>
                  {currentUser.unlimitedAI 
                    ? 'You have unlimited AI access' 
                    : `You have ${currentUser.dailyAILimit || 10} AI explanations per day`}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Logout
            </button>
          </div>
        ) : (
          // Login/Register view
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {mode === 'login' ? 'Login' : 'Create Account'}
              </h2>
              <p className="text-gray-500 text-sm">
                {mode === 'login' 
                  ? 'Login to get daily AI explanations' 
                  : 'Create a free account for 10 AI explanations per day'}
              </p>
            </div>

            {/* Toggle Mode */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => {
                  setMode('login')
                  setError('')
                  setSuccess('')
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMode('register')
                  setError('')
                  setSuccess('')
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === 'register'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Register
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-600 text-sm animate-fade-in">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50"
                  placeholder="Enter your username"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 pr-10"
                    placeholder={mode === 'login' ? 'Enter your password' : 'At least 6 characters'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  PIN (4 digits)
                </label>
                <div className="flex justify-center gap-2">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (pinInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      onPaste={index === 0 ? handlePinPaste : undefined}
                      disabled={isLoading}
                      className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 font-mono"
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50"
                    placeholder="your@email.com"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password || pin.some(d => !d)}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{mode === 'login' ? 'Logging in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <>
                    {mode === 'login' ? (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Login</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                {mode === 'login' 
                  ? "Don't have an account? " 
                  : "Already have an account? "}
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login')
                    setError('')
                    setSuccess('')
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {mode === 'login' ? 'Register' : 'Login'}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default UserLogin

