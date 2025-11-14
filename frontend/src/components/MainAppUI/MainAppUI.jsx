import { useState, useEffect, useRef, useCallback } from 'react'
import { authAPI, roomsAPI, messagesAPI, userRoomsAPI } from '../../services/api'
import { signalRService } from '../../services/signalr'
import RoomManager from '../RoomManager/RoomManager'
import './MainAppUI.css'

const MainAppUI = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isRoomManagerOpen, setIsRoomManagerOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [rooms, setRooms] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [signalRConnected, setSignalRConnected] = useState(false)
  const messagesEndRef = useRef(null)

  // ⭐ FIX: persist the *actual latest* room & user so SignalR handlers use correct values
  const selectedRoomRef = useRef(null)
  const currentUserRef = useRef(null)

  useEffect(() => {
    selectedRoomRef.current = selectedRoom
  }, [selectedRoom])

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  // Load current user
  useEffect(() => {
    const user = authAPI.getCurrentUser()
    if (user) {
      setCurrentUser({
        id: user.id,
        name: user.userName || user.email?.split('@')[0] || 'User',
        email: user.email,
        avatar: (user.userName || user.email?.split('@')[0] || 'U')
          .substring(0, 2)
          .toUpperCase()
      })
    } else {
      setCurrentUser({
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        avatar: 'DU'
      })
    }
  }, [])

  // Initialize SignalR
  useEffect(() => {
    if (currentUser && currentUser.id !== 'demo-user') {
      initializeSignalR()
    }

    return () => {
      if (signalRService.connection) signalRService.stop()
    }
  }, [currentUser])

  const initializeSignalR = async () => {
    try {
      await signalRService.start()
      setSignalRConnected(true)

      // ⭐ All handlers now use refs (new stable functions)
      signalRService.on('ReceiveMessage', onReceiveMessage)
      signalRService.on('RoomCreated', () => loadRooms())
      signalRService.on('UserJoined', data => console.log('User joined', data))
      signalRService.on('UserLeft', data => console.log('User left', data))

      signalRService.on('RoomAdded', data => {
        if (data.userId === currentUserRef.current?.id) loadRooms()
      })

    } catch (error) {
      console.error('SignalR connection failed:', error)
      setSignalRConnected(false)
    }
  }

  // ⭐ FIXED ReceiveMessage (no more stale closures!)
  const onReceiveMessage = (data) => {
    const realId = data.id

    const incoming = {
      id: realId,
      text: data.message,
      time: formatTime(new Date(data.sentAt)),
      isMine: data.userId === currentUserRef.current?.id,
      sender: data.userName,
      avatar: (() => {
        const name = data.userName;
        if (name.length >= 2) return name.substring(0, 2).toUpperCase();
        return (name + name).substring(0, 2).toUpperCase(); // Repeat first letter if only 1 char
      })()
    }

    setMessages(prev => {
      // ⭐ Remove the temp message from this user, if any
      const filtered = prev.filter(m =>
        !(m.isMine && m.tempId)    // remove temp
      )

      // ⭐ Prevent accidental duplicates
      if (filtered.some(m => m.id === realId)) return filtered

      return [...filtered, incoming]
    })
  }


  // Load rooms
  const loadRooms = useCallback(async () => {
    if (!currentUser?.id || currentUser.id === 'demo-user') {
      setLoading(false)
      return
    }

    setLoading(true)
    const result = await userRoomsAPI.getUserRooms(currentUser.id)

    if (result.success && result.data) {
      const formatted = result.data.map(room => ({
        id: room.id,
        name: room.name,
        avatar: room.name.substring(0, 2).toUpperCase(),
        lastMessage: 'Click to load messages',
        time: formatTime(room.createdAt),
        unread: 0,
        online: false,
        isPrivate: room.isPrivate,
        createdById: room.createdById
      }))
      setRooms(formatted)
      if (formatted.length > 0 && !selectedRoomRef.current) {
        setSelectedRoom(formatted[0])
      }
    } else {
      setRooms([])
      setSelectedRoom(null)
    }
    setLoading(false)
  }, [currentUser])

  // Load messages for room
  const loadMessages = useCallback(async (roomId) => {
    setLoadingMessages(true)
    const result = await messagesAPI.getByRoom(roomId)

    if (result.success && result.data) {
      const formatted = result.data.map(msg => ({
        id: msg.id,
        text: msg.text,
        time: formatTime(msg.sentAt),
        isMine: msg.userId === currentUser?.id,
        sender: msg.userName || 'Unknown User',
        avatar: (() => {
          const name = msg.userName || 'U';
          if (name.length >= 2) return name.substring(0, 2).toUpperCase();
          return (name + name).substring(0, 2).toUpperCase(); // Repeat first letter if only 1 char
        })()
      }))
      setMessages(formatted)
    } else {
      setMessages([])
    }
    setLoadingMessages(false)
  }, [currentUser?.id])

  // ⭐ FIX: Force message to appear instantly on send
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return

    const msg = newMessage.trim()
    setNewMessage('')

    // Create a provisional local message
    const tempId = "local-" + Date.now()
    const tempMsg = {
      id: tempId,
      tempId,         
      text: msg,
      time: formatTime(new Date()),
      isMine: true,
      sender: currentUser?.name,
      avatar: currentUser?.avatar
    }

    setMessages(prev => [...prev, tempMsg])

    try {
      if (signalRConnected) {
        await signalRService.sendMessage(msg, selectedRoom.id)
      } else {
        await messagesAPI.send(selectedRoom.id, msg)
      }
    } catch (e) {
      console.error("Send message failed", e)
    }
  }

  // Time formatting
  const formatTime = (date) => {
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Load rooms on mount
  useEffect(() => {
    if (currentUser) loadRooms()
  }, [currentUser, loadRooms])

  // Load messages when room changes
  useEffect(() => {
    if (selectedRoom) loadMessages(selectedRoom.id)
  }, [selectedRoom, loadMessages])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLogout = () => {
    authAPI.logout()
    window.location.href = '/'
  }

  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Web Chat</h2>
          <button
            className="new-chat-btn"
            title="Manage Rooms"
            onClick={() => setIsRoomManagerOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="chat-list">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <p className="loading-text">Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              No rooms yet
            </div>
          ) : (
            rooms.map((room) => (
              <div 
                key={room.id}
                className={`chat-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="chat-avatar">
                  {room.avatar}
                  {room.online && <span className="online-dot"></span>}
                </div>
                <div className="chat-info">
                  <div className="chat-top">
                    <span className="chat-name">{room.name}</span>
                    <div className="room-actions">
                      {room.createdById === currentUser?.id ? (
                        <button 
                          className="action-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRoom(room.id, room.name)
                          }}
                          title="Delete room"
                        >
                          🗑️
                        </button>
                      ) : (
                        <button 
                          className="action-btn leave-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLeaveRoom(room.id, room.name)
                          }}
                          title="Leave room"
                        >
                          🚪
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="chat-bottom">
                    <span className="chat-last-message">{room.lastMessage}</span>
                    {room.unread > 0 && <span className="unread-badge">{room.unread}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="user-avatar">{currentUser?.avatar || 'DU'}</div>
            <div className="user-info">
              <span className="user-name">{currentUser?.name || 'Demo User'}</span>
              <span className="user-status">Online</span>
            </div>
            <svg className={`chevron-icon ${isProfileOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <button className="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 13C3 10.2386 5.23858 8 8 8C10.7614 8 13 10.2386 13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Profile
              </button>
              <button className="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Settings
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 13H3V3H6M11 10L14 7M14 7L11 4M14 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="chat-area">
        {selectedRoom ? (
          <>
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-header-avatar">{selectedRoom.avatar}</div>
                <div className="chat-header-info">
                  <h3>{selectedRoom.name}</h3>
                  <span className="online-status">{selectedRoom.online ? 'Online' : 'Offline'}</span>
                </div>
          </div>
          <div className="chat-header-actions">
            <button className="header-btn" title="Search">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="header-btn" title="More">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="4" r="1" fill="currentColor"/>
                <circle cx="9" cy="9" r="1" fill="currentColor"/>
                <circle cx="9" cy="14" r="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

            <div className="message-list">
              {loadingMessages ? (
                <div className="messages-loading-container">
                  <div className="messages-loading-spinner"></div>
                  <p className="messages-loading-text">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="messages-empty-state">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                    <path d="M20 28C20 24.6863 22.6863 22 26 22H38C41.3137 22 44 24.6863 44 28V36C44 39.3137 41.3137 42 38 42H26C22.6863 42 20 39.3137 20 36V28Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M28 30H36M28 34H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p>No messages yet</p>
                  <span>Start the conversation!</span>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`message ${msg.isMine ? 'mine' : 'theirs'}`}>
                    {!msg.isMine && <div className="message-avatar">{msg.avatar}</div>}
                    <div className="message-content">
                      <div className="message-bubble">{msg.text}</div>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-area">
              <button className="input-btn" title="Attach file">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 15V6M10 6L7 9M10 6L13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="message-input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <button className="input-btn" title="Emoji">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="7.5" cy="8.5" r="1" fill="currentColor"/>
                  <circle cx="12.5" cy="8.5" r="1" fill="currentColor"/>
                  <path d="M7 12C7 12 8 14 10 14C12 14 13 12 13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="send-btn" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M16 2L8 10M16 2L11 16L8 10M16 2L2 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-secondary)' }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
              <path d="M20 28h24M20 36h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
            </svg>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Select a room to start chatting</h3>
            <p style={{ fontSize: '14px', margin: 0 }}>Choose from your existing rooms or create a new one</p>
          </div>
        )}
      </div>

      {/* Room Manager Modal */}
      {isRoomManagerOpen && (
        <RoomManager
          currentUser={currentUser}
          onRoomCreated={() => {
            loadRooms()
            setIsRoomManagerOpen(false)
          }}
          onRoomUpdated={() => {
            loadRooms()
          }}
          onClose={() => setIsRoomManagerOpen(false)}
        />
      )}
    </div>
  )
}

export default MainAppUI
