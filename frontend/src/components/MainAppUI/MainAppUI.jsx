import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { authAPI, roomsAPI, messagesAPI } from '../../services/api'
import { signalRService } from '../../services/signalr'
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
  const [showNewRoomModal, setShowNewRoomModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [showRoomMenu, setShowRoomMenu] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameRoomName, setRenameRoomName] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState(null)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [featureMessage, setFeatureMessage] = useState('')
  const messagesEndRef = useRef(null)
  const currentUserRef = useRef(null)
  const selectedRoomRef = useRef(null)
  const processedMessageIdsRef = useRef(new Set()) // Track actual message IDs from server
  const optimisticMessagesRef = useRef(new Map()) // Track optimistic messages: text -> timestamp

  // Format time helper (defined early so it's available in closures)
  const formatTime = useCallback((date) => {
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
  }, [])

  // Update selectedRoomRef when selectedRoom changes
  useEffect(() => {
    selectedRoomRef.current = selectedRoom
  }, [selectedRoom])

  // Get current user from token
  useEffect(() => {
    const user = authAPI.getCurrentUser()
    if (user) {
      const userData = {
        id: user.id,
        name: user.userName || user.email?.split('@')[0] || 'User',
        email: user.email,
        avatar: (user.userName || user.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase()
      }
      setCurrentUser(userData)
      currentUserRef.current = userData
    } else {
      // Redirect to login if not authenticated
      window.location.href = '/login'
    }
  }, [])

  // Load rooms from API
  const loadRooms = useCallback(async () => {
    console.log('🔄 Loading rooms from API...')
    setLoading(true)
    const result = await roomsAPI.getAll()
    console.log('📦 Rooms API result:', result)
    console.log('📦 Rooms data:', result.data)
    console.log('📦 Rooms data type:', typeof result.data, Array.isArray(result.data))
    
    if (result.success && result.data && result.data.length > 0) {
      console.log('✅ Found', result.data.length, 'rooms')
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
      console.log('⚠️ No rooms found or empty data')
      setRooms([])
      setSelectedRoom(null)
    }
    setLoading(false)
  }, [formatTime])

  // Load messages for selected room (with optional silent mode)
  const loadMessages = useCallback(async (roomId, silent = false) => {
    console.log('📥 Loading messages for room:', roomId, silent ? '(silent)' : '')
    if (!silent) {
      setLoadingMessages(true)
    }
    const result = await messagesAPI.getByRoom(roomId)
    console.log('📥 Messages API result:', result)
    console.log('📥 Messages data:', result.data)
    
    if (result.success && result.data && result.data.length > 0) {
      if (silent) {
        // Silent mode: only append new messages we haven't seen
        const newMessages = []
        
        result.data.forEach(msg => {
          // Skip if we already have this message ID
          if (processedMessageIdsRef.current.has(msg.id)) {
            return
          }
          
          // Track this message ID as processed
          processedMessageIdsRef.current.add(msg.id)
          
          newMessages.push({
            id: msg.id,
            text: msg.text,
            time: formatTime(msg.sentAt),
            isMine: msg.userId === currentUser?.id,
            sender: msg.user?.userName || 'User',
            avatar: (msg.user?.userName || 'U').substring(0, 2).toUpperCase()
          })
        })
        
        if (newMessages.length > 0) {
          console.log('📥 Silently adding', newMessages.length, 'new messages')
          setMessages(prev => {
            // Remove optimistic messages that match any new message
            const withoutOptimistic = prev.filter(m => {
              if (!m.id.startsWith('optimistic-')) return true
              return !newMessages.some(nm => nm.text === m.text && nm.isMine)
            })
            return [...withoutOptimistic, ...newMessages]
          })
        }
      } else {
        // Normal mode: clear and reload all messages (for initial load)
        processedMessageIdsRef.current.clear()
        
        const formattedMessages = result.data.map(msg => {
          // Track this message ID as processed
          processedMessageIdsRef.current.add(msg.id)
          
          return {
            id: msg.id,
            text: msg.text,
            time: formatTime(msg.sentAt),
            isMine: msg.userId === currentUser?.id,
            sender: msg.user?.userName || 'User',
            avatar: (msg.user?.userName || 'U').substring(0, 2).toUpperCase()
          }
        })
        
        console.log('📥 Formatted messages:', formattedMessages)
        setMessages(formattedMessages)
      }
    } else {
      if (!silent) {
        // Clear processed IDs only on initial load
        processedMessageIdsRef.current.clear()
        
        // Check if this is the official room and show welcome message
        const currentRoom = rooms.find(r => r.id === roomId)
        if (currentRoom && (currentRoom.name === 'Web Chat Official' || currentRoom.name === 'Official Web Chat')) {
          setMessages([
            { 
              id: 'welcome-1', 
              sender: 'Web Chat', 
              avatar: 'WC', 
              text: '🎉 Welcome to Web Chat Official!', 
              time: '', 
              isMine: false,
              isSystem: true
            },
            { 
              id: 'welcome-2', 
              sender: 'Web Chat', 
              avatar: 'WC', 
              text: '🚀 Made by the best developers in the whole world!\n\n👨‍💻 Team:\n• Kyuuto09\n• axneo27\n• SlavaMokrynskyi\n• da2045\n• samoliukrustam123', 
              time: '', 
              isMine: false,
              isSystem: true
            },
            { 
              id: 'welcome-3', 
              sender: 'Web Chat', 
              avatar: 'WC', 
              text: '✨ This is a real-time chat application powered by SignalR and React. Enjoy chatting!', 
              time: '', 
              isMine: false,
              isSystem: true
            }
          ])
        } else {
          setMessages([])
        }
      }
    }
    if (!silent) {
      setLoadingMessages(false)
    }
  }, [currentUser?.id, rooms, formatTime])

  // SignalR Connection
  useEffect(() => {
    const initSignalR = async () => {
      if (!currentUser) return

      const connected = await signalRService.connect()
      console.log('🔗 SignalR connection result:', connected)

      if (connected) {
        // Set up persistent message listener that works for all rooms
        signalRService.onReceiveMessage((data) => {
          // Only process if message is for the currently selected room
          if (!selectedRoomRef.current || data.roomId !== selectedRoomRef.current.id) {
            return
          }

          console.log('📨 SignalR message received:', data)

          // If this is our own message, check optimistic messages
          if (data.userName === currentUserRef.current?.name) {
            const messageText = data.message?.trim()
            if (messageText && optimisticMessagesRef.current.has(messageText)) {
              console.log('📨 Received own message that was sent optimistically, reloading silently')
              optimisticMessagesRef.current.delete(messageText)
              // Silent reload to get real message from server with proper ID
              if (selectedRoomRef.current) {
                loadMessages(selectedRoomRef.current.id, true) // silent = true
              }
              return
            }
          }

          // For messages from others, silently reload to ensure consistency
          console.log('📨 Received message from other user, reloading silently')
          if (selectedRoomRef.current) {
            loadMessages(selectedRoomRef.current.id, true) // silent = true
          }
        })

        // Listen for room created events
        signalRService.onRoomCreated(() => {
          loadRooms() // Reload rooms list
        })

        // Listen for user joined events
        signalRService.onUserJoined(() => {
          // Optionally show a notification
        })

        // Listen for user left events
        signalRService.onUserLeft(() => {
          // Optionally show a notification
        })

        // Listen for room deleted events
        signalRService.onRoomDeleted((roomId) => {
          loadRooms() // Reload rooms list
          if (selectedRoomRef.current?.id === roomId) {
            setSelectedRoom(null)
            setMessages([])
          }
        })
      }
    }

    initSignalR()

    // Cleanup on unmount
    return () => {
      if (signalRService.isConnected()) {
        signalRService.offReceiveMessage()
        signalRService.offRoomCreated()
        signalRService.offUserJoined()
        signalRService.offUserLeft()
        signalRService.offRoomDeleted()
      }
      signalRService.disconnect()
    }
  }, [currentUser, loadMessages, loadRooms])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return

    const messageText = newMessage.trim()
    setNewMessage('') // Clear input immediately

    // Track this as an optimistic message
    const timestamp = Date.now()
    optimisticMessagesRef.current.set(messageText, timestamp)

    // Add message optimistically to UI immediately
    const optimisticMessage = {
      id: `optimistic-${timestamp}`,
      text: messageText,
      time: formatTime(new Date()),
      isMine: true,
      sender: currentUser?.name || 'Me',
      avatar: (currentUser?.name || 'ME').substring(0, 2).toUpperCase()
    }

    setMessages(prev => [...prev, optimisticMessage])

    try {
      // Send via SignalR first
      console.log('📤 Attempting to send via SignalR:', messageText)
      const sentViaSignalR = await signalRService.sendMessage(messageText, selectedRoom.id)

      if (sentViaSignalR) {
        console.log('✅ Message sent successfully via SignalR')
        // Wait a bit for SignalR callback to trigger, then silently reload to be sure
        setTimeout(() => {
          if (selectedRoomRef.current?.id === selectedRoom.id) {
            loadMessages(selectedRoom.id, true) // silent = true
          }
        }, 500)
      } else {
        // Fallback to REST API
        console.log('⚠️ SignalR failed, using REST API fallback')
        const result = await messagesAPI.send(selectedRoom.id, messageText)

        if (result.success) {
          console.log('✅ Message sent successfully via REST API')
          // Clean up optimistic tracking
          optimisticMessagesRef.current.delete(messageText)
          // Reload messages to get the real message from server
          await loadMessages(selectedRoom.id)
        } else {
          console.error('❌ REST API also failed:', result.error)
          // Remove optimistic message if both methods failed
          optimisticMessagesRef.current.delete(messageText)
          setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
          alert('Failed to send message. Please try again.')
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error sending message:', error)
      // Remove optimistic message on error
      optimisticMessagesRef.current.delete(messageText)
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      alert('Failed to send message. Please check your connection.')
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
      // Clear tracking when switching rooms
      processedMessageIdsRef.current.clear()
      optimisticMessagesRef.current.clear()
      loadMessages(selectedRoom.id)
    }
  }, [selectedRoom, loadMessages])

  // Poll for new messages as fallback for SignalR
  useEffect(() => {
    if (!selectedRoom) return

    const pollInterval = setInterval(async () => {
      try {
        const result = await messagesAPI.getByRoom(selectedRoom.id)
        if (result.success && result.data && result.data.length > 0) {
          const newMessages = []
          
          result.data.forEach(msg => {
            // Skip if we already have this message ID
            if (processedMessageIdsRef.current.has(msg.id)) {
              return
            }
            
            // Add this message ID to processed set
            processedMessageIdsRef.current.add(msg.id)
            
            newMessages.push({
              id: msg.id,
              text: msg.text,
              time: formatTime(msg.sentAt),
              isMine: msg.userId === currentUser?.id,
              sender: msg.user?.userName || 'User',
              avatar: (msg.user?.userName || 'U').substring(0, 2).toUpperCase()
            })
          })
          
          if (newMessages.length > 0) {
            console.log('📊 Polling found', newMessages.length, 'new messages')
            setMessages(prev => {
              // Remove optimistic messages that match any new message text
              const withoutOptimistic = prev.filter(m => {
                if (!m.id.startsWith('optimistic-')) return true
                return !newMessages.some(nm => nm.text === m.text && nm.isMine)
              })
              return [...withoutOptimistic, ...newMessages]
            })
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [selectedRoom, currentUser?.id, formatTime, messages])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close room menu on click outside
  useEffect(() => {
    const handleClick = () => setShowRoomMenu(false)
    if (showRoomMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showRoomMenu])

  const handleLogout = () => {
    authAPI.logout()
    window.location.href = '/'
  }

  // Handle deleting a room
  const handleDeleteRoom = async () => {
    if (!roomToDelete) return

    const roomId = roomToDelete.id

    try {
      const result = await roomsAPI.delete(roomId)
      console.log('🗑️ Room deletion result:', result)
      
      if (result.success) {
        console.log('✅ Room deleted successfully')
        // Close modal
        setShowDeleteModal(false)
        setRoomToDelete(null)
        
        // If deleted room was selected, clear selection
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null)
          setMessages([])
        }
        await loadRooms() // Reload rooms list
      } else {
        alert('Failed to delete room: ' + (result.error || result.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('💥 Exception deleting room:', error)
      alert('Error deleting room: ' + error.message)
    }
  }

  // Handle renaming a room
  const handleRenameRoom = async () => {
    if (!renameRoomName.trim() || !selectedRoom) return

    try {
      const result = await roomsAPI.update(selectedRoom.id, renameRoomName.trim())
      console.log('✏️ Room rename result:', result)
      
      if (result.success) {
        console.log('✅ Room renamed successfully')
        setRenameRoomName('')
        setShowRenameModal(false)
        await loadRooms() // Reload rooms list
      } else {
        alert('Failed to rename room: ' + (result.error || result.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('💥 Exception renaming room:', error)
      alert('Error renaming room: ' + error.message)
    }
  }

  // Handle creating new room
  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || isCreatingRoom) return

    console.log('📝 Creating room:', newRoomName.trim())
    setIsCreatingRoom(true)
    
    try {
      const result = await roomsAPI.create(newRoomName.trim(), false) // Create public room
      console.log('📦 Room creation result:', result)
      
      if (result.success) {
        console.log('✅ Room created successfully')
        setNewRoomName('')
        setShowNewRoomModal(false)
        
        // Force reload rooms after a short delay to ensure backend has committed
        setTimeout(async () => {
          console.log('🔄 Reloading rooms after creation...')
          await loadRooms()
        }, 500)
      } else {
        console.error('❌ Failed to create room:', result.error)
        alert('Failed to create room: ' + (result.error || result.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('💥 Exception creating room:', error)
      alert('Error creating room: ' + error.message)
    } finally {
      setIsCreatingRoom(false)
    }
  }

  return (
    <div className="app-layout">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && roomToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 style={{ color: 'var(--brand-primary)', marginBottom: '16px' }}>Delete Room?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{roomToDelete.name}"</strong>? 
              This action cannot be undone and all messages will be permanently deleted.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => {
                  setShowDeleteModal(false)
                  setRoomToDelete(null)
                }}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-delete"
                onClick={handleDeleteRoom}
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Room Modal */}
      {showRenameModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Rename Room</h3>
            <input
              type="text"
              className="modal-input"
              placeholder="Enter new room name..."
              value={renameRoomName}
              onChange={(e) => setRenameRoomName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleRenameRoom()
              }}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => {
                  setShowRenameModal(false)
                  setRenameRoomName('')
                }}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-create"
                onClick={handleRenameRoom}
                disabled={!renameRoomName.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Room Modal */}
      {showNewRoomModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Room</h3>
            <input
              type="text"
              className="modal-input"
              placeholder="Enter room name..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateRoom()
              }}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => {
                  setShowNewRoomModal(false)
                  setNewRoomName('')
                }}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-create"
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || isCreatingRoom}
              >
                {isCreatingRoom ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Web Chat TEST</h2>
          <button 
            className="new-chat-btn" 
            title="New Chat"
            type="button"
            onClick={() => setShowNewRoomModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ pointerEvents: 'none' }}>
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
                onClick={async () => {
                  setSelectedRoom(room)
                  
                  // Join the room via SignalR first
                  if (signalRService.isConnected()) {
                    await signalRService.joinRoom(room.id)
                    console.log('🚪 Joined SignalR room:', room.id)
                  }
                  
                  // Then load messages for this room
                  await loadMessages(room.id)
                }}
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
              <span className="user-name">{currentUser?.name || 'User'}</span>
              <span className="user-status">Online</span>
            </div>
            <svg className={`chevron-icon ${isProfileOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <Link to="/profile" className="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 13C3 10.2386 5.23858 8 8 8C10.7614 8 13 10.2386 13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Profile
              </Link>
              <Link to="/profile" className="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Settings
              </Link>
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
                <div style={{ position: 'relative' }}>
                  <button 
                    className="header-btn" 
                    title="More"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowRoomMenu(!showRoomMenu)
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="4" r="1" fill="currentColor"/>
                      <circle cx="9" cy="9" r="1" fill="currentColor"/>
                      <circle cx="9" cy="14" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                  {showRoomMenu && (
                    <div className="room-dropdown-menu">
                      <button
                        className="room-dropdown-item"
                        onClick={() => {
                          setRenameRoomName(selectedRoom.name)
                          setShowRenameModal(true)
                          setShowRoomMenu(false)
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M11.333 2A1.886 1.886 0 0114 4.667l-9 9-3.667 1 1-3.667 9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Rename Room
                      </button>
                      <button
                        className="room-dropdown-item room-dropdown-delete"
                        onClick={() => {
                          setRoomToDelete({
                            id: selectedRoom.id,
                            name: selectedRoom.name
                          })
                          setShowDeleteModal(true)
                          setShowRoomMenu(false)
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Delete Room
                      </button>
                    </div>
                  )}
                </div>
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
              <button 
                className="input-btn" 
                title="Attach file"
                onClick={() => {
                  setFeatureMessage('📎 File Attachment')
                  setShowFeatureModal(true)
                }}
              >
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
              <button 
                className="input-btn" 
                title="Emoji"
                onClick={() => {
                  setFeatureMessage('😊 Emoji Picker')
                  setShowFeatureModal(true)
                }}
              >
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

      {/* Feature Under Development Modal */}
      {showFeatureModal && (
        <div className="modal-overlay" onClick={() => setShowFeatureModal(false)}>
          <div className="feature-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="feature-modal-icon">🚧</div>
            <h3>{featureMessage}</h3>
            <p>This feature is currently under development and will be available soon. Stay tuned for updates!</p>
            <div className="modal-actions">
              <button 
                className="modal-btn modal-btn-create" 
                onClick={() => setShowFeatureModal(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainAppUI