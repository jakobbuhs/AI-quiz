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

const AdminDashboard = ({ onLogout }) => {
  const [admins, setAdmins] = useState([])
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    pin: '',
    aiLimit: '100',
  })

  // Load admins on mount
  useEffect(() => {
    loadAdmins()
    setCurrentAdmin(getCurrentAdmin())
  }, [])

  const loadAdmins = () => {
    setAdmins(getAdminUsers())
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
      </div>
    </div>
  )
}

export default AdminDashboard

