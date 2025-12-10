// User authentication utilities (separate from admin)

const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  USERS: 'users',
}

// Get all users (for registration/login)
export const getUsers = () => {
  try {
    const users = localStorage.getItem(STORAGE_KEYS.USERS)
    return users ? JSON.parse(users) : []
  } catch (error) {
    console.error('Error getting users:', error)
    return []
  }
}

// Save users
export const saveUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  } catch (error) {
    console.error('Error saving users:', error)
  }
}

// Register a new user
export const registerUser = (username, email = '') => {
  const users = getUsers()
  
  // Check if username already exists
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Username already exists. Please choose a different username.')
  }
  
  const newUser = {
    id: Date.now().toString(),
    username: username.trim(),
    email: email.trim(),
    createdAt: new Date().toISOString(),
    unlimitedAI: true, // Logged-in users get unlimited AI access
  }
  
  users.push(newUser)
  saveUsers(users)
  
  // Auto-login after registration
  loginUser(newUser.id)
  
  return newUser
}

// Login user by username
export const loginUserByUsername = (username) => {
  const users = getUsers()
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase())
  
  if (user) {
    loginUser(user.id)
    return user
  }
  
  return null
}

// Login user by ID
export const loginUser = (userId) => {
  const users = getUsers()
  const user = users.find(u => u.id === userId)
  
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({
      id: user.id,
      username: user.username,
      loginTime: new Date().toISOString(),
    }))
    return user
  }
  
  return null
}

// Get current logged-in user
export const getCurrentUser = () => {
  try {
    const current = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    if (!current) return null
    
    const userData = JSON.parse(current)
    
    // Verify user still exists
    const users = getUsers()
    const user = users.find(u => u.id === userData.id)
    return user || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Check if user is logged in
export const isUserLoggedIn = () => {
  return getCurrentUser() !== null
}

// Logout user
export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
}

// Check if user has unlimited AI access
export const hasUnlimitedAI = () => {
  const user = getCurrentUser()
  return user !== null && user.unlimitedAI === true
}

