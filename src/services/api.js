// API service for backend communication

// Use relative /api path for Vercel deployment, fallback to localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? '/api' 
    : 'http://localhost:3001/api'
)

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const token = localStorage.getItem('sessionToken')
  const adminToken = localStorage.getItem('adminSessionToken')

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (adminToken) {
    headers['X-Admin-Token'] = `Bearer ${adminToken}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'API request failed')
    }

    return data
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

// Admin API
export const adminAPI = {
  login: async (pin) => {
    const data = await apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    })
    localStorage.setItem('adminSessionToken', data.sessionToken)
    return data
  },

  verify: async () => {
    return apiRequest('/admin/verify')
  },

  logout: async () => {
    await apiRequest('/admin/logout', { method: 'POST' })
    localStorage.removeItem('adminSessionToken')
  },

  getAdmins: async () => {
    return apiRequest('/admin/admins')
  },

  addAdmin: async (username, pin, aiLimit) => {
    return apiRequest('/admin/admins', {
      method: 'POST',
      body: JSON.stringify({ username, pin, aiLimit }),
    })
  },

  updateAdmin: async (id, updates) => {
    return apiRequest(`/admin/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  deleteAdmin: async (id) => {
    return apiRequest(`/admin/admins/${id}`, {
      method: 'DELETE',
    })
  },
}

// User API
export const userAPI = {
  register: async (username, password, pin, email) => {
    const data = await apiRequest('/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, pin, email }),
    })
    localStorage.setItem('sessionToken', data.sessionToken)
    return data
  },

  login: async (username, password, pin) => {
    const data = await apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, pin }),
    })
    localStorage.setItem('sessionToken', data.sessionToken)
    return data
  },

  verify: async () => {
    return apiRequest('/users/verify')
  },

  logout: async () => {
    await apiRequest('/users/logout', { method: 'POST' })
    localStorage.removeItem('sessionToken')
  },

  getUsers: async () => {
    return apiRequest('/users')
  },

  createUser: async (username, password, pin, email, unlimitedAI, dailyAILimit) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, pin, email, unlimitedAI, dailyAILimit }),
    })
  },

  updateUser: async (id, updates) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  deleteUser: async (id) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    })
  },

  getDailyCalls: async () => {
    return apiRequest('/users/daily-calls')
  },

  recordCall: async () => {
    return apiRequest('/users/record-call', {
      method: 'POST',
    })
  },
}

