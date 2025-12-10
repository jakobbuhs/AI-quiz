// API-based authentication utilities (replaces localStorage-based auth)

import { adminAPI, userAPI } from '../services/api'

// Admin authentication
export const authenticateAdmin = async (pin) => {
  try {
    const data = await adminAPI.login(pin)
    return data.admin
  } catch (error) {
    throw new Error(error.message || 'Authentication failed')
  }
}

export const getCurrentAdmin = async () => {
  try {
    const data = await adminAPI.verify()
    return data.admin
  } catch (e) {
    return null
  }
}

export const logoutAdmin = async () => {
  try {
    await adminAPI.logout()
  } catch (error) {
    console.error('Logout error:', error)
  }
}

export const getAdminUsers = async () => {
  try {
    return await adminAPI.getAdmins()
  } catch (e) {
    return []
  }
}

export const addAdminUser = async (username, pin, aiLimit) => {
  try {
    return await adminAPI.addAdmin(username, pin, aiLimit)
  } catch (error) {
    throw new Error(error.message || 'Failed to add admin')
  }
}

export const updateAdminUser = async (id, updates) => {
  try {
    return await adminAPI.updateAdmin(id, updates)
  } catch (error) {
    throw new Error(error.message || 'Failed to update admin')
  }
}

export const deleteAdminUser = async (id) => {
  try {
    await adminAPI.deleteAdmin(id)
  } catch (error) {
    throw new Error(error.message || 'Failed to delete admin')
  }
}

// User authentication
export const registerUser = async (username, password, pin, email) => {
  try {
    const data = await userAPI.register(username, password, pin, email)
    return data.user
  } catch (error) {
    throw new Error(error.message || 'Registration failed')
  }
}

export const loginUserByCredentials = async (username, password, pin) => {
  try {
    const data = await userAPI.login(username, password, pin)
    return data.user
  } catch (error) {
    throw new Error(error.message || 'Login failed')
  }
}

export const getCurrentUser = async () => {
  try {
    const data = await userAPI.verify()
    return data.user
  } catch (e) {
    return null
  }
}

export const logoutUser = async () => {
  try {
    await userAPI.logout()
  } catch (error) {
    console.error('Logout error:', error)
  }
}

export const getUsers = async () => {
  try {
    return await userAPI.getUsers()
  } catch (e) {
    return []
  }
}

export const createUserByAdmin = async (username, password, pin, email, unlimitedAI, dailyAILimit) => {
  try {
    return await userAPI.createUser(username, password, pin, email, unlimitedAI, dailyAILimit)
  } catch (error) {
    throw new Error(error.message || 'Failed to create user')
  }
}

export const updateUser = async (id, updates) => {
  try {
    return await userAPI.updateUser(id, updates)
  } catch (error) {
    throw new Error(error.message || 'Failed to update user')
  }
}

export const deleteUser = async (id) => {
  try {
    await userAPI.deleteUser(id)
  } catch (error) {
    throw new Error(error.message || 'Failed to delete user')
  }
}

export const getUserDailyAICalls = async () => {
  try {
    const data = await userAPI.getDailyCalls()
    return data.dailyUsed || 0
  } catch (e) {
    return 0
  }
}

export const recordUserDailyAICall = async () => {
  try {
    await userAPI.recordCall()
  } catch (error) {
    console.error('Error recording call:', error)
  }
}

export const hasUnlimitedAI = async () => {
  try {
    const data = await userAPI.getDailyCalls()
    return data.unlimited === true
  } catch (e) {
    return false
  }
}

export const getUserDailyAILimit = async () => {
  try {
    const data = await userAPI.getDailyCalls()
    return data.unlimited ? Infinity : (data.dailyLimit || 10)
  } catch (e) {
    return 0
  }
}

export const hasExceededDailyAILimit = async () => {
  try {
    const data = await userAPI.getDailyCalls()
    if (data.unlimited) return false
    return (data.dailyUsed || 0) >= (data.dailyLimit || 10)
  } catch (e) {
    return false
  }
}

// Validation functions
export const validatePIN = (pin) => {
  return /^\d{4}$/.test(pin)
}

export const validatePassword = (password) => {
  return password && password.length >= 6
}

