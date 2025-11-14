import * as signalR from '@microsoft/signalr';

// For SignalR, we need the base URL without /api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SIGNALR_BASE_URL = API_BASE_URL.replace('/api', '');

class SignalRService {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('✅ SignalR already connected');
      return true;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found for SignalR connection');
        return false;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${SIGNALR_BASE_URL}/hubs/chat`, {
          accessTokenFactory: () => token,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      await this.connection.start();
      console.log('✅ SignalR Connected!', this.connection.connectionId);
      return true;
    } catch (error) {
      console.error('❌ SignalR Connection Error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('🔌 SignalR Disconnected');
      } catch (error) {
        console.error('❌ SignalR Disconnect Error:', error);
      }
    }
  }

  // Send message to a room
  async sendMessage(message, roomId) {
    if (!this.isConnected()) {
      console.error('❌ SignalR not connected');
      return false;
    }

    try {
      await this.connection.invoke('Send', message, roomId);
      console.log('📤 Message sent via SignalR:', { message, roomId });
      return true;
    } catch (error) {
      console.error('❌ Send message error:', error);
      return false;
    }
  }

  // Send message to multiple rooms
  async sendToSome(message, roomIds) {
    if (!this.isConnected()) {
      console.error('❌ SignalR not connected');
      return false;
    }

    try {
      await this.connection.invoke('SendToSome', message, roomIds);
      console.log('📤 Message sent to multiple rooms via SignalR:', { message, roomIds });
      return true;
    } catch (error) {
      console.error('❌ SendToSome error:', error);
      return false;
    }
  }

  // Create a new room
  async createRoom(roomName, isPrivate, userIds) {
    if (!this.isConnected()) {
      console.error('❌ SignalR not connected');
      return false;
    }

    try {
      await this.connection.invoke('CreateRoom', roomName, isPrivate, userIds);
      console.log('🏠 Room created via SignalR:', { roomName, isPrivate, userIds });
      return true;
    } catch (error) {
      console.error('❌ CreateRoom error:', error);
      return false;
    }
  }

  // Join a room
  async joinRoom(roomId) {
    if (!this.isConnected()) {
      console.error('❌ SignalR not connected');
      return false;
    }

    try {
      await this.connection.invoke('JoinRoom', roomId);
      console.log('🚪 Joined room via SignalR:', roomId);
      return true;
    } catch (error) {
      console.error('❌ JoinRoom error:', error);
      return false;
    }
  }

  // Leave a room
  async leaveRoom(roomId) {
    if (!this.isConnected()) {
      console.error('❌ SignalR not connected');
      return false;
    }

    try {
      await this.connection.invoke('LeaveRoom', roomId);
      console.log('👋 Left room via SignalR:', roomId);
      return true;
    } catch (error) {
      console.error('❌ LeaveRoom error:', error);
      return false;
    }
  }

  // Delete a room
  async deleteRoom(roomId) {
    if (!this.isConnected()) {
      console.error('❌ SignalR not connected');
      return false;
    }

    try {
      await this.connection.invoke('DeleteRoom', roomId);
      console.log('🗑️ Room deleted via SignalR:', roomId);
      return true;
    } catch (error) {
      console.error('❌ DeleteRoom error:', error);
      return false;
    }
  }

  // Event listeners
  onReceiveMessage(callback) {
    if (this.connection) {
      this.connection.off('ReceiveMessage'); // Remove any existing
      this.connection.on('ReceiveMessage', callback);
      console.log('🎧 ReceiveMessage listener registered');
    }
  }

  onRoomCreated(callback) {
    if (this.connection) {
      this.connection.off('RoomCreated');
      this.connection.on('RoomCreated', callback);
    }
  }

  onUserJoined(callback) {
    if (this.connection) {
      this.connection.off('UserJoined');
      this.connection.on('UserJoined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.connection) {
      this.connection.off('UserLeft');
      this.connection.on('UserLeft', callback);
    }
  }

  onRoomDeleted(callback) {
    if (this.connection) {
      this.connection.off('RoomDeleted');
      this.connection.on('RoomDeleted', callback);
    }
  }

  // Remove event listeners
  offReceiveMessage() {
    if (this.connection) {
      this.connection.off('ReceiveMessage');
    }
  }

  offRoomCreated() {
    if (this.connection) {
      this.connection.off('RoomCreated');
    }
  }

  offUserJoined() {
    if (this.connection) {
      this.connection.off('UserJoined');
    }
  }

  offUserLeft() {
    if (this.connection) {
      this.connection.off('UserLeft');
    }
  }

  offRoomDeleted() {
    if (this.connection) {
      this.connection.off('RoomDeleted');
    }
  }

  isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
