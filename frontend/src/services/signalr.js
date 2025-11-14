import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

class SignalRService {
  constructor() {
    this.connection = null
    this.isConnected = false
    this.eventHandlers = {}
  }

  async start() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      this.connection = new HubConnectionBuilder()
        .withUrl('http://localhost:5000/chat', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build()

      // Set up event handlers
      this.setupEventHandlers()

      await this.connection.start()
      this.isConnected = true
      console.log('SignalR connected successfully')

      // Log connection state
      this.connection.onreconnected(() => {
        console.log('SignalR reconnected')
        this.isConnected = true
      })

      this.connection.onreconnecting(() => {
        console.log('SignalR reconnecting...')
        this.isConnected = false
      })

      this.connection.onclose(() => {
        console.log('SignalR connection closed')
        this.isConnected = false
      })
    } catch (error) {
      console.error('SignalR connection failed:', error)
      this.isConnected = false
      throw error
    }
  }

  setupEventHandlers() {
    if (!this.connection) return

    // Message events
    this.connection.on('ReceiveMessage', (messageData) => {
      this.triggerEvent('ReceiveMessage', messageData)
    })

    this.connection.on('MessageError', (errorData) => {
      this.triggerEvent('MessageError', errorData)
    })

    // Room events
    this.connection.on('RoomCreated', (roomId, roomName) => {
      this.triggerEvent('RoomCreated', { roomId, roomName })
    })

    this.connection.on('RoomDeleted', (roomId) => {
      this.triggerEvent('RoomDeleted', roomId)
    })

    // User events
    this.connection.on('UserJoined', (data) => {
      this.triggerEvent('UserJoined', data)
    })

    this.connection.on('UserLeft', (data) => {
      this.triggerEvent('UserLeft', data)
    })

    // Room management events
    this.connection.on('RoomAdded', (data) => {
      this.triggerEvent('RoomAdded', data)
    })

    this.connection.on('UserAddedToRoom', (data) => {
      this.triggerEvent('UserAddedToRoom', data)
    })

    this.connection.on('AddUserError', (data) => {
      this.triggerEvent('AddUserError', data)
    })
  }

  // Hub method calls
  async sendMessage(message, roomId) {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }
    return await this.connection.invoke('Send', message, roomId)
  }

  async createRoom(roomName, isPrivate, userIds) {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }
    return await this.connection.invoke('CreateRoom', roomName, isPrivate, userIds)
  }

  async joinRoom(roomId) {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }
    return await this.connection.invoke('JoinRoom', roomId)
  }

  async leaveRoom(roomId) {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }
    return await this.connection.invoke('LeaveRoom', roomId)
  }

  async deleteRoom(roomId) {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }
    return await this.connection.invoke('DeleteRoom', roomId)
  }

  async addUserToRoom(userId, roomId) {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }
    return await this.connection.invoke('AddUserToRoom', userId, roomId)
  }

  // Event handling
  on(eventName, callback) {
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = []
    }
    this.eventHandlers[eventName].push(callback)
  }

  off(eventName, callback) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = this.eventHandlers[eventName].filter(cb => cb !== callback)
    }
  }

  triggerEvent(eventName, data) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${eventName} event handler:`, error)
        }
      })
    }
  }

  async stop() {
    if (this.connection) {
      await this.connection.stop()
      this.isConnected = false
      console.log('SignalR disconnected')
    }
  }
}

export const signalRService = new SignalRService()