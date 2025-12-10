import { useState, useEffect } from 'react'
import { 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  LogOut, 
  Shield,
  Sparkles,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { 
  getAdminUsers, 
  addAdminUser, 
  updateAdminUser, 
  deleteAdminUser, 
  logoutAdmin,
  getCurrentAdmin,
  validatePIN 
} from '../utils/adminAuth'
import {
  getUsers,
  createUserByAdmin,
  updateUser,
  deleteUser,
  validatePIN,
  validatePassword,
} from '../utils/userAuth'

const AdminDashboard = ({ onLogout }) => {
  const [admins, setAdmins] = useState([])
  const [users, setUsers] = useState([])
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showAddUserForm, setShowAddUserForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Admin form state
  const [formData, setFormData] = useState({
    username: '',
    pin: '',
    aiLimit: '100',
  })
  
  // User form state
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    pin: '',
    email: '',
    unlimitedAI: false,
    dailyAILimit: '10',
  })

  // Load admins and users on mount
  useEffect(() => {
    loadAdmins()
    loadUsers()
    setCurrentAdmin(getCurrentAdmin())
  }, [])

  const loadAdmins = () => {
    setAdmins(getAdminUsers())
  }

  const loadUsers = () => {
    setUsers(getUsers())
  }

  const handleAddAdmin = () => {
    setError('')
    setSuccess('')
    
    if (!formData.username.trim()) {
      setError('Username is required')
      return
    }
    
    if (!validatePIN(formData.pin)) {
      setError('PIN must be exactly 4 digits')
      return
    }
    
    const aiLimit = parseInt(formData.aiLimit)
    if (isNaN(aiLimit) || aiLimit < 1 || aiLimit > 10000) {
      setError('AI limit must be between 1 and 10000')
      return
    }

    try {
      addAdminUser(formData.username, formData.pin, aiLimit)
      setSuccess('Admin user added successfully!')
      setFormData({ username: '', pin: '', aiLimit: '100' })
      setShowAddForm(false)
      loadAdmins()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (admin) => {
    setEditingId(admin.id)
    setFormData({
      username: admin.username,
      pin: admin.pin,
      aiLimit: admin.aiLimit.toString(),
    })
    setError('')
    setSuccess('')
    setShowAddForm(false)
  }

  const handleUpdate = (id) => {
    setError('')
    setSuccess('')
    
    if (!formData.username.trim()) {
      setError('Username is required')
      return
    }
    
    if (!validatePIN(formData.pin)) {
      setError('PIN must be exactly 4 digits')
      return
    }
    
    const aiLimit = parseInt(formData.aiLimit)
    if (isNaN(aiLimit) || aiLimit < 1 || aiLimit > 10000) {
      setError('AI limit must be between 1 and 10000')
      return
    }

    try {
      updateAdminUser(id, {
        username: formData.username.trim(),
        pin: formData.pin,
        aiLimit: aiLimit,
      })
      setSuccess('Admin user updated successfully!')
      setEditingId(null)
      setFormData({ username: '', pin: '', aiLimit: '100' })
      loadAdmins()
      
      // Update current admin if it was edited
      const updated = getCurrentAdmin()
      if (updated && updated.id === id) {
        setCurrentAdmin(updated)
      }
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this admin user?')) {
      return
    }

    try {
      deleteAdminUser(id)
      setSuccess('Admin user deleted successfully!')
      loadAdmins()
      
      // If current admin was deleted, logout
      if (currentAdmin && currentAdmin.id === id) {
        handleLogout()
      }
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({ username: '', pin: '', aiLimit: '100' })
    setError('')
    setSuccess('')
  }

  // User management handlers
  const handleAddUser = () => {
    setError('')
    setSuccess('')
    
    if (!userFormData.username.trim()) {
      setError('Username is required')
      return
    }
    
    if (!validatePassword(userFormData.password)) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    if (!validatePIN(userFormData.pin)) {
      setError('PIN must be exactly 4 digits')
      return
    }
    
    const dailyLimit = parseInt(userFormData.dailyAILimit)
    if (!userFormData.unlimitedAI && (isNaN(dailyLimit) || dailyLimit < 1 || dailyLimit > 10000)) {
      setError('Daily AI limit must be between 1 and 10000')
      return
    }

    try {
      createUserByAdmin(
        userFormData.username,
        userFormData.password,
        userFormData.pin,
        userFormData.email,
        userFormData.unlimitedAI,
        userFormData.unlimitedAI ? Infinity : dailyLimit
      )
      setSuccess('User created successfully!')
      setUserFormData({ username: '', password: '', pin: '', email: '', unlimitedAI: false, dailyAILimit: '10' })
      setShowAddUserForm(false)
      loadUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEditUser = (user) => {
    setEditingUserId(user.id)
    setUserFormData({
      username: user.username,
      password: '', // Don't show existing password
      pin: user.pin || '',
      email: user.email || '',
      unlimitedAI: user.unlimitedAI || false,
      dailyAILimit: user.unlimitedAI ? '10' : (user.dailyAILimit || '10').toString(),
    })
    setError('')
    setSuccess('')
    setShowAddUserForm(false)
  }

  const handleUpdateUser = (id) => {
    setError('')
    setSuccess('')
    
    if (!userFormData.username.trim()) {
      setError('Username is required')
      return
    }
    
    // Validate password if provided (required for new users, optional for updates)
    if (!editingUserId && !userFormData.password) {
      setError('Password is required')
      return
    }
    if (userFormData.password && !validatePassword(userFormData.password)) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    // Validate PIN if provided (required for new users, optional for updates)
    if (!editingUserId && !userFormData.pin) {
      setError('PIN is required')
      return
    }
    if (userFormData.pin && !validatePIN(userFormData.pin)) {
      setError('PIN must be exactly 4 digits')
      return
    }
    
    const dailyLimit = parseInt(userFormData.dailyAILimit)
    if (!userFormData.unlimitedAI && (isNaN(dailyLimit) || dailyLimit < 1 || dailyLimit > 10000)) {
      setError('Daily AI limit must be between 1 and 10000')
      return
    }

    try {
      const updates = {
        username: userFormData.username.trim(),
        email: userFormData.email.trim(),
        unlimitedAI: userFormData.unlimitedAI,
        dailyAILimit: userFormData.unlimitedAI ? Infinity : dailyLimit,
      }
      
      // Only update password if provided
      if (userFormData.password) {
        updates.password = userFormData.password
      }
      
      // Only update PIN if provided
      if (userFormData.pin) {
        updates.pin = userFormData.pin
      }
      
      updateUser(id, updates)
      setSuccess('User updated successfully!')
      setEditingUserId(null)
      setUserFormData({ username: '', password: '', pin: '', email: '', unlimitedAI: false, dailyAILimit: '10' })
      loadUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteUser = (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      deleteUser(id)
      setSuccess('User deleted successfully!')
      loadUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancelUser = () => {
    setEditingUserId(null)
    setShowAddUserForm(false)
    setUserFormData({ username: '', password: '', pin: '', email: '', unlimitedAI: false, dailyAILimit: '10' })
    setError('')
    setSuccess('')
  }

  const handleLogout = () => {
    logoutAdmin()
    onLogout()
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                {currentAdmin && (
                  <p className="text-sm text-gray-500 mt-1">
                    Logged in as: <span className="font-semibold text-indigo-600">{currentAdmin.username}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="card p-4 mb-6 bg-red-50 border-2 border-red-200 animate-fade-in">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="card p-4 mb-6 bg-emerald-50 border-2 border-emerald-200 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Add Admin Button */}
        {!showAddForm && !editingId && (
          <div className="mb-6">
            <button
              onClick={() => {
                setShowAddForm(true)
                setError('')
                setSuccess('')
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Admin User
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="card p-6 mb-6 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-500" />
              {editingId ? 'Edit Admin User' : 'Add New Admin User'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all"
                  placeholder="Enter username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN (4 digits)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={formData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setFormData({ ...formData, pin: value })
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all font-mono"
                  placeholder="0000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Limit (per day)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.aiLimit}
                  onChange={(e) => setFormData({ ...formData, aiLimit: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all"
                  placeholder="100"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={editingId ? () => handleUpdate(editingId) : handleAddAdmin}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingId ? 'Update' : 'Add'} Admin
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Admin Users List */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            Admin Users ({admins.length})
          </h2>
          
          {admins.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No admin users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">PIN</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">AI Limit</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr
                      key={admin.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        currentAdmin?.id === admin.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{admin.username}</span>
                          {currentAdmin?.id === admin.id && (
                            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-gray-600">{admin.pin}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-gray-700">{admin.aiLimit}</span>
                          <span className="text-sm text-gray-500">/ day</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(admin)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
                            disabled={admins.length <= 1}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={admins.length <= 1 ? "Cannot delete last admin" : "Delete"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Management Section */}
        <div className="card p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              Regular Users ({users.length})
            </h2>
            {!showAddUserForm && !editingUserId && (
              <button
                onClick={() => {
                  setShowAddUserForm(true)
                  setError('')
                  setSuccess('')
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create User
              </button>
            )}
          </div>

          {/* Add/Edit User Form */}
          {(showAddUserForm || editingUserId) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 animate-slide-up">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {editingUserId ? 'Edit User' : 'Create New User'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all"
                    placeholder="Enter username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all"
                    placeholder="user@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {editingUserId ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all"
                    placeholder={editingUserId ? 'Enter new password' : 'At least 6 characters'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN (4 digits) {editingUserId ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={userFormData.pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setUserFormData({ ...userFormData, pin: value })
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all font-mono"
                    placeholder="0000"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={userFormData.unlimitedAI}
                      onChange={(e) => setUserFormData({ 
                        ...userFormData, 
                        unlimitedAI: e.target.checked 
                      })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Grant Unlimited AI Access
                    </span>
                  </label>
                </div>
                
                {!userFormData.unlimitedAI && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily AI Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={userFormData.dailyAILimit}
                      onChange={(e) => setUserFormData({ ...userFormData, dailyAILimit: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 transition-all"
                      placeholder="10"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={editingUserId ? () => handleUpdateUser(editingUserId) : handleAddUser}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingUserId ? 'Update' : 'Create'} User
                </button>
                <button
                  onClick={handleCancelUser}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">AI Access</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-800">{user.username}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{user.email || '-'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.role === 'admin-created' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role === 'admin-created' ? 'Admin Created' : 'Self-Registered'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {user.unlimitedAI ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <Sparkles className="w-4 h-4" />
                            Unlimited
                          </span>
                        ) : (
                          <span className="text-gray-700">
                            {user.dailyAILimit || 10} / day
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

