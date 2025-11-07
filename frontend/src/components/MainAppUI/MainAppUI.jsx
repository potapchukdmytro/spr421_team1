import { useState, useEffect, useRef, useCallback } from 'react'
import { authAPI, roomsAPI, messagesAPI } from '../../services/api'
import './MainAppUI.css'

const MainAppUI = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [rooms, setRooms] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef(null)

  // Get current user from token or use demo user
  useEffect(() => {
    const user = authAPI.getCurrentUser()
    if (user) {
      setCurrentUser({
        id: user.id,
        name: user.userName || user.email?.split('@')[0] || 'User',
        email: user.email,
        avatar: (user.userName || user.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase()
      })
    } else {
      // Demo user for development
      setCurrentUser({
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        avatar: 'DU'
      })
    }
  }, [])

  // Load rooms from API
  const loadRooms = useCallback(async () => {
    setLoading(true)
    const result = await roomsAPI.getAll()
    
    if (result.success && result.data && result.data.length > 0) {
      const formattedRooms = result.data.map(room => ({
        id: room.id,
        name: room.name,
        avatar: room.name.substring(0, 2).toUpperCase(),
        lastMessage: 'Click to load messages',
        time: formatTime(room.createdAt),
        unread: 0,
        online: false,
        isPrivate: room.isPrivate
      }))
      setRooms(formattedRooms)
      if (formattedRooms.length > 0) {
        setSelectedRoom(formattedRooms[0])
      }
    } else {
      // No rooms found - show empty state
      setRooms([])
      setSelectedRoom(null)
    }
    setLoading(false)
  }, [])

  // Load messages for selected room
  const loadMessages = useCallback(async (roomId) => {
    setLoadingMessages(true)
    const result = await messagesAPI.getByRoom(roomId)
    
    if (result.success && result.data) {
      const formattedMessages = result.data.map(msg => ({
        id: msg.id,
        text: msg.text,
        time: formatTime(msg.sentAt),
        isMine: msg.userId === currentUser?.id,
        sender: msg.user?.userName || 'User',
        avatar: (msg.user?.userName || 'U').substring(0, 2).toUpperCase()
      }))
      setMessages(formattedMessages)
    } else {
      // Fallback to mock messages
      setMessages([
        { id: 1, sender: 'Dmytro Potapchuk', avatar: 'DP', text: 'Hey! How are you?', time: '10:25', isMine: false },
        { id: 2, sender: 'Me', text: 'Great! Just working on the chat UI', time: '10:26', isMine: true },
        { id: 3, sender: 'Dmytro Potapchuk', avatar: 'DP', text: 'Awesome! Can\'t wait to see it', time: '10:28', isMine: false },
        { id: 4, sender: 'Me', text: 'It\'s looking really good! Check it out soon 🚀', time: '10:30', isMine: true },
      ])
    }
    setLoadingMessages(false)
  }, [currentUser?.id])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return

    // Optimistic update
    const tempMessage = {
      id: Date.now(),
      text: newMessage,
      time: formatTime(new Date()),
      isMine: true,
      sender: currentUser?.name || 'Me'
    }
    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')

    // Send to backend
    const result = await messagesAPI.send(selectedRoom.id, newMessage)
    if (result.success) {
      loadMessages(selectedRoom.id) // Reload to get real message
    }
  }

  // Format time helper
  const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'long' })
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Load rooms on mount
  useEffect(() => {
    if (currentUser) {
      loadRooms()
    }
  }, [currentUser, loadRooms])

  // Load messages when room changes
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id)
    }
  }, [selectedRoom, loadMessages])

  // Auto scroll to bottom
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
          <button className="new-chat-btn" title="New Chat">
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
                    <span className="chat-time">{room.time}</span>
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
    </div>
  )
}

export default MainAppUI
