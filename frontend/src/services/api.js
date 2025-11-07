// API Base URL from environment variable or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7041/api'

// Generic API request helper
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('authToken')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || 'Request failed' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('API Error:', error)
    return { success: false, error: error.message }
  }
}

// Auth API
export const authAPI = {
  login: async (email, password) => {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  register: async (userName, email, password) => {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ userName, email, password }),
    })
  },

  logout: () => {
    localStorage.removeItem('authToken')
  },

  getCurrentUser: () => {
    const token = localStorage.getItem('authToken')
    if (!token) return null

    try {
      // Decode JWT token (simple base64 decode, not cryptographically secure but works for reading)
      const payload = JSON.parse(atob(token.split('.')[1]))
      return {
        id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub,
        userName: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.name,
        email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email,
        roles: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || []
      }
    } catch (error) {
      console.error('Token decode error:', error)
      return null
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken')
  }
}

// Rooms API
export const roomsAPI = {
  getAll: async () => {
    return await apiRequest('/rooms')
  },

  create: async (name, isPrivate = false) => {
    return await apiRequest('/rooms', {
      method: 'POST',
      body: JSON.stringify({ name, isPrivate }),
    })
  },

  getById: async (id) => {
    return await apiRequest(`/rooms/${id}`)
  }
}

// Messages API
export const messagesAPI = {
  getByRoom: async (roomId) => {
    return await apiRequest(`/rooms/${roomId}/messages`)
  },

  send: async (roomId, text) => {
    return await apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({ roomId, text }),
    })
  }
}

// Users API
export const usersAPI = {
  getProfile: async () => {
    return await apiRequest('/users/profile')
  },

  updateProfile: async (data) => {
    return await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}
