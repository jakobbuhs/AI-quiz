// Admin authentication and user management utilities

const STORAGE_KEYS = {
  ADMIN_USERS: 'adminUsers',
  CURRENT_ADMIN: 'currentAdmin',
  DEFAULT_PIN: 'defaultAdminPIN',
}

// Initialize default admin if none exists
const initializeDefaultAdmin = () => {
  const existingAdmins = getAdminUsers()
  if (existingAdmins.length === 0) {
    // Create default admin with PIN 0000
    const defaultAdmin = {
      id: Date.now().toString(),
      username: 'admin',
      pin: '0000',
      aiLimit: 100, // Default AI calls per day
      createdAt: new Date().toISOString(),
    }
    saveAdminUsers([defaultAdmin])
    return defaultAdmin
  }
  return null
}

// Get all admin users
export const getAdminUsers = () => {
  try {
    const admins = localStorage.getItem(STORAGE_KEYS.ADMIN_USERS)
    if (!admins) {
      initializeDefaultAdmin()
      return getAdminUsers()
    }
    return JSON.parse(admins)
  } catch (error) {
    console.error('Error getting admin users:', error)
    return []
  }
}

// Save admin users
export const saveAdminUsers = (admins) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(admins))
  } catch (error) {
    console.error('Error saving admin users:', error)
  }
}

// Authenticate admin with PIN
export const authenticateAdmin = (pin) => {
  const admins = getAdminUsers()
  const admin = admins.find(a => a.pin === pin)
  
  if (admin) {
    // Store current admin session
    localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify({
      id: admin.id,
      username: admin.username,
      loginTime: new Date().toISOString(),
    }))
    return admin
  }
  return null
}

// Get current logged-in admin
export const getCurrentAdmin = () => {
  try {
    const current = localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN)
    if (!current) return null
    const adminData = JSON.parse(current)
    
    // Verify admin still exists
    const admins = getAdminUsers()
    const admin = admins.find(a => a.id === adminData.id)
    return admin || null
  } catch (error) {
    console.error('Error getting current admin:', error)
    return null
  }
}

// Logout admin
export const logoutAdmin = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN)
}

// Add new admin user
export const addAdminUser = (username, pin, aiLimit) => {
  const admins = getAdminUsers()
  
  // Check if PIN already exists
  if (admins.some(a => a.pin === pin)) {
    throw new Error('PIN already exists. Please choose a different PIN.')
  }
  
  // Check if username already exists
  if (admins.some(a => a.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Username already exists. Please choose a different username.')
  }
  
  const newAdmin = {
    id: Date.now().toString(),
    username: username.trim(),
    pin: pin,
    aiLimit: parseInt(aiLimit) || 100,
    createdAt: new Date().toISOString(),
  }
  
  admins.push(newAdmin)
  saveAdminUsers(admins)
  return newAdmin
}

// Update admin user
export const updateAdminUser = (id, updates) => {
  const admins = getAdminUsers()
  const index = admins.findIndex(a => a.id === id)
  
  if (index === -1) {
    throw new Error('Admin user not found')
  }
  
  // Check if PIN is being changed and already exists
  if (updates.pin && admins.some(a => a.pin === updates.pin && a.id !== id)) {
    throw new Error('PIN already exists. Please choose a different PIN.')
  }
  
  // Check if username is being changed and already exists
  if (updates.username && admins.some(a => a.username.toLowerCase() === updates.username.toLowerCase() && a.id !== id)) {
    throw new Error('Username already exists. Please choose a different username.')
  }
  
  admins[index] = {
    ...admins[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  saveAdminUsers(admins)
  return admins[index]
}

// Delete admin user
export const deleteAdminUser = (id) => {
  const admins = getAdminUsers()
  
  // Prevent deleting the last admin
  if (admins.length <= 1) {
    throw new Error('Cannot delete the last admin user')
  }
  
  const filtered = admins.filter(a => a.id !== id)
  saveAdminUsers(filtered)
  
  // If deleted admin was logged in, logout
  const current = getCurrentAdmin()
  if (current && current.id === id) {
    logoutAdmin()
  }
  
  return filtered
}

// Validate PIN format (4 digits)
export const validatePIN = (pin) => {
  return /^\d{4}$/.test(pin)
}

// Initialize on first load
initializeDefaultAdmin()

