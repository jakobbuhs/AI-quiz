// User authentication utilities (separate from admin)

const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  USERS: 'users',
  USER_DAILY_CALLS: 'userDailyCalls', // Track daily AI calls per user
}

// User roles
export const USER_ROLES = {
  SELF_REGISTERED: 'self-registered',
  ADMIN_CREATED: 'admin-created',
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

// Validate PIN format (4 digits)
export const validatePIN = (pin) => {
  return /^\d{4}$/.test(pin)
}

// Validate password (minimum 6 characters)
export const validatePassword = (password) => {
  return password && password.length >= 6
}

// Register a new user (self-registered, gets default 10 calls per day)
export const registerUser = (username, password, pin, email = '') => {
  const users = getUsers()
  
  // Validation
  if (!username.trim()) {
    throw new Error('Username is required')
  }
  
  if (username.trim().length < 3) {
    throw new Error('Username must be at least 3 characters long')
  }
  
  if (!validatePassword(password)) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  if (!validatePIN(pin)) {
    throw new Error('PIN must be exactly 4 digits')
  }
  
  // Check if username already exists
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Username already exists. Please choose a different username.')
  }
  
  // Check if PIN already exists
  if (users.some(u => u.pin === pin)) {
    throw new Error('PIN already exists. Please choose a different PIN.')
  }
  
  const newUser = {
    id: Date.now().toString(),
    username: username.trim(),
    password: password, // In production, this should be hashed
    pin: pin,
    email: email.trim(),
    createdAt: new Date().toISOString(),
    role: USER_ROLES.SELF_REGISTERED,
    unlimitedAI: false, // Self-registered users get default limits
    dailyAILimit: 10, // 10 calls per day
  }
  
  users.push(newUser)
  saveUsers(users)
  
  // Auto-login after registration
  loginUser(newUser.id)
  
  return newUser
}

// Create user by admin (can grant unlimited AI access)
export const createUserByAdmin = (username, password, pin, email = '', unlimitedAI = false, dailyAILimit = 10) => {
  const users = getUsers()
  
  // Validation
  if (!username.trim()) {
    throw new Error('Username is required')
  }
  
  if (!validatePassword(password)) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  if (!validatePIN(pin)) {
    throw new Error('PIN must be exactly 4 digits')
  }
  
  // Check if username already exists
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Username already exists. Please choose a different username.')
  }
  
  // Check if PIN already exists
  if (users.some(u => u.pin === pin)) {
    throw new Error('PIN already exists. Please choose a different PIN.')
  }
  
  const newUser = {
    id: Date.now().toString(),
    username: username.trim(),
    password: password, // In production, this should be hashed
    pin: pin,
    email: email.trim(),
    createdAt: new Date().toISOString(),
    role: USER_ROLES.ADMIN_CREATED,
    unlimitedAI: unlimitedAI,
    dailyAILimit: unlimitedAI ? Infinity : dailyAILimit,
    createdBy: 'admin',
  }
  
  users.push(newUser)
  saveUsers(users)
  
  return newUser
}

// Update user (admin only)
export const updateUser = (id, updates) => {
  const users = getUsers()
  const index = users.findIndex(u => u.id === id)
  
  if (index === -1) {
    throw new Error('User not found')
  }
  
  // Check if username is being changed and already exists
  if (updates.username && users.some(u => u.username.toLowerCase() === updates.username.toLowerCase() && u.id !== id)) {
    throw new Error('Username already exists. Please choose a different username.')
  }
  
  // Check if PIN is being changed and already exists
  if (updates.pin && users.some(u => u.pin === updates.pin && u.id !== id)) {
    throw new Error('PIN already exists. Please choose a different PIN.')
  }
  
  // Validate password if being updated
  if (updates.password && !validatePassword(updates.password)) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  // Validate PIN if being updated
  if (updates.pin && !validatePIN(updates.pin)) {
    throw new Error('PIN must be exactly 4 digits')
  }
  
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  // Update daily limit if unlimited status changes
  if (updates.unlimitedAI !== undefined) {
    users[index].dailyAILimit = updates.unlimitedAI ? Infinity : (users[index].dailyAILimit || 10)
  }
  
  saveUsers(users)
  return users[index]
}

// Delete user (admin only)
export const deleteUser = (id) => {
  const users = getUsers()
  const filtered = users.filter(u => u.id !== id)
  saveUsers(filtered)
  
  // If deleted user was logged in, logout
  const current = getCurrentUser()
  if (current && current.id === id) {
    logoutUser()
  }
  
  return filtered
}

// Login user by username and password/PIN
export const loginUserByCredentials = (username, password, pin) => {
  const users = getUsers()
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase())
  
  if (!user) {
    return null
  }
  
  // Check password
  if (user.password !== password) {
    throw new Error('Incorrect password')
  }
  
  // Check PIN
  if (user.pin !== pin) {
    throw new Error('Incorrect PIN')
  }
  
  loginUser(user.id)
  return user
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

// Get user's daily AI limit
export const getUserDailyAILimit = () => {
  const user = getCurrentUser()
  if (!user) return 0
  if (user.unlimitedAI) return Infinity
  return user.dailyAILimit || 10
}

// Get user's daily AI calls used today
export const getUserDailyAICalls = () => {
  try {
    const user = getCurrentUser()
    if (!user) return 0
    
    const dailyCalls = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DAILY_CALLS) || '{}')
    const today = new Date().toDateString()
    const userCalls = dailyCalls[user.id] || {}
    
    // Reset if it's a new day
    if (userCalls.date !== today) {
      return 0
    }
    
    return userCalls.count || 0
  } catch (e) {
    return 0
  }
}

// Record a daily AI call for user
export const recordUserDailyAICall = () => {
  try {
    const user = getCurrentUser()
    if (!user || user.unlimitedAI) return // Don't track for unlimited users
    
    const dailyCalls = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DAILY_CALLS) || '{}')
    const today = new Date().toDateString()
    const userCalls = dailyCalls[user.id] || {}
    
    // Reset if it's a new day
    if (userCalls.date !== today) {
      userCalls.date = today
      userCalls.count = 0
    }
    
    userCalls.count = (userCalls.count || 0) + 1
    dailyCalls[user.id] = userCalls
    
    localStorage.setItem(STORAGE_KEYS.USER_DAILY_CALLS, JSON.stringify(dailyCalls))
  } catch (error) {
    console.error('Error recording daily AI call:', error)
  }
}

// Check if user has exceeded daily AI limit
export const hasExceededDailyAILimit = () => {
  const user = getCurrentUser()
  if (!user || user.unlimitedAI) return false
  
  const limit = user.dailyAILimit || 10
  const used = getUserDailyAICalls()
  return used >= limit
}

