// API Base URL from environment variable or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7041/api'

// Generic API request helper
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token') // Changed from 'authToken' to 'token'
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // Get response text first
    const responseText = await response.text()
    
    // If response is empty, return error
    if (!responseText || responseText.trim() === '') {
      console.error('Empty response from server')
      return {
        success: false,
        isSuccess: false,
        error: 'Empty response from server',
        message: 'Empty response from server'
      }
    }

    // Try to parse JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw response:', responseText)
      return {
        success: false,
        isSuccess: false,
        error: 'Invalid response from server',
        message: 'Invalid response from server'
      }
    }

    // Backend returns: { isSuccess, message, payload }
    // Check if response indicates failure
    if (data.isSuccess === false) {
      return { 
        success: false, 
        isSuccess: false,
        error: data.message || 'Request failed',
        message: data.message || 'Request failed'
      }
    }

    // Success response
    return { 
      success: true, 
      isSuccess: true,
      data: data.payload,
      payload: data.payload,
      message: data.message
    }
  } catch (error) {
    console.error('API Error:', error)
    return { 
      success: false, 
      isSuccess: false,
      error: error.message,
      message: error.message
    }
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
    localStorage.removeItem('token')
  },

  getCurrentUser: () => {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
      // Decode JWT token (simple base64 decode, not cryptographically secure but works for reading)
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('Decoded JWT payload:', payload) // Debug log
      return {
        id: payload.id || payload.sub,
        userName: payload.userName || payload.name,
        email: payload.email,
        roles: payload.roles || []
      }
    } catch (error) {
      console.error('Token decode error:', error)
      return null
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token')
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
