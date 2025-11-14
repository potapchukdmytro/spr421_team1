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
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [signalRConnected, setSignalRConnected] = useState(false)
  const messagesEndRef = useRef(null)

  const selectedRoomRef = useRef(null)
  const currentUserRef = useRef(null)
  const processedMessageIdsRef = useRef(new Set()) // Track actual message IDs from server
  const optimisticMessagesRef = useRef(new Map()) // Track optimistic messages: text -> timestamp
  const signalRInitializedRef = useRef(false) // Prevent multiple SignalR initializations

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
    if (currentUser && currentUser.id !== 'demo-user' && !signalRInitializedRef.current) {
      signalRInitializedRef.current = true
      initializeSignalR()
    }

    return () => {
      if (signalRService.connection) signalRService.stop()
      signalRInitializedRef.current = false
    }
  }, [currentUser])

  const initializeSignalR = async () => {
    console.log('🔗 Initializing SignalR...')
    try {
      await signalRService.start()
      setSignalRConnected(true)
      console.log('✅ SignalR connected')

      // ⭐ All handlers now use refs (new stable functions)
      signalRService.on('ReceiveMessage', onReceiveMessage)
      // Removed room-related event handlers to prevent automatic room updates

    } catch (error) {
      console.error('SignalR connection failed:', error)
      setSignalRConnected(false)
    }
  }

  // ⭐ FIXED ReceiveMessage with optimistic message handling
  const onReceiveMessage = (data) => {
    // Only process if message is for the currently selected room
    if (!selectedRoomRef.current || data.roomId !== selectedRoomRef.current.id) {
      return
    }

    const realId = data.id

    // If this is our own message, check optimistic messages
    if (data.userName === currentUserRef.current?.name) {
      const messageText = data.message?.trim()
      if (messageText && optimisticMessagesRef.current.has(messageText)) {
        console.log('📨 Received own message that was sent optimistically, replacing with real message')
        optimisticMessagesRef.current.delete(messageText)
        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg => {
          if (msg.id.startsWith('optimistic-') && msg.text === messageText && msg.isMine) {
            return {
              id: realId,
              text: data.message,
              time: formatTime(new Date(data.sentAt)),
              isMine: true,
              sender: data.userName,
              avatar: (() => {
                const name = data.userName;
                if (name.length >= 2) return name.substring(0, 2).toUpperCase();
                return (name + name).substring(0, 2).toUpperCase();
              })()
            }
          }
          return msg
        }))
        // Mark this message as processed
        processedMessageIdsRef.current.add(realId)
        return
      }
    }

    // For messages from others, add them normally
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
      // ⭐ Prevent accidental duplicates
      if (prev.some(m => m.id === realId)) return prev

      return [...prev, incoming]
    })

    // Mark this message as processed to prevent polling from adding it again
    processedMessageIdsRef.current.add(realId)
  }

  // Time formatting helper
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

  // Load rooms
  const loadRooms = useCallback(async () => {
    console.log('🔄 Loading rooms...')
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
  }, [currentUser, formatTime])

  // Load messages for room (with optional silent mode)
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
            sender: msg.userName || 'Unknown User',
            avatar: (() => {
              const name = msg.userName || 'U';
              if (name.length >= 2) return name.substring(0, 2).toUpperCase();
              return (name + name).substring(0, 2).toUpperCase(); // Repeat first letter if only 1 char
            })()
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
            sender: msg.userName || 'Unknown User',
            avatar: (() => {
              const name = msg.userName || 'U';
              if (name.length >= 2) return name.substring(0, 2).toUpperCase();
              return (name + name).substring(0, 2).toUpperCase(); // Repeat first letter if only 1 char
            })()
          }
        })

        console.log('📥 Formatted messages:', formattedMessages)
        setMessages(formattedMessages)
      }
    } else {
      if (!silent) {
        // Clear processed IDs only on initial load
        processedMessageIdsRef.current.clear()
        setMessages([])
      }
    }
    if (!silent) {
      setLoadingMessages(false)
    }
  }, [currentUser?.id])

  // ⭐ FIX: Force message to appear instantly on send with optimistic updates
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || isSendingMessage) {
      console.log('🚫 Send blocked:', { hasMessage: !!newMessage.trim(), hasRoom: !!selectedRoom, isSending: isSendingMessage })
      return
    }

    console.log('📤 Starting to send message:', newMessage.trim())
    const messageText = newMessage.trim()
    setNewMessage('') // Clear input immediately
    setIsSendingMessage(true) // Prevent double-sending

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
      if (signalRConnected) {
        try {
          console.log('📤 Attempting to send via SignalR:', messageText)
          await signalRService.sendMessage(messageText, selectedRoom.id)
          console.log('✅ Message sent successfully via SignalR')
          // SignalR will deliver the real message and replace the optimistic one
        } catch (signalRError) {
          console.log('⚠️ SignalR failed, using REST API fallback:', signalRError)
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
      } else {
        // SignalR not connected, use REST API
        console.log('📤 SignalR not connected, using REST API:', messageText)
        const result = await messagesAPI.send(selectedRoom.id, messageText)

        if (result.success) {
          console.log('✅ Message sent successfully via REST API')
          // Clean up optimistic tracking
          optimisticMessagesRef.current.delete(messageText)
          // Reload messages to get the real message from server
          await loadMessages(selectedRoom.id)
        } else {
          console.error('❌ REST API failed:', result.error)
          // Remove optimistic message if failed
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
    } finally {
      setIsSendingMessage(false) // Re-enable sending
    }
  }


  // Load rooms on mount
  useEffect(() => {
    if (currentUser) loadRooms()
  }, [currentUser])

  // Load messages when room changes
  useEffect(() => {
    if (selectedRoom) {
      // Clear tracking when switching rooms
      processedMessageIdsRef.current.clear()
      optimisticMessagesRef.current.clear()
      loadMessages(selectedRoom.id)
    }
  }, [selectedRoom])

  // Poll for new messages as fallback for SignalR (less aggressive)
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

            // Track this message ID as processed
            processedMessageIdsRef.current.add(msg.id)

            newMessages.push({
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
            })
          })

          if (newMessages.length > 0) {
            console.log('📊 Polling found', newMessages.length, 'new messages')
            setMessages(prev => {
              // Start with current messages
              let updatedMessages = [...prev]

              // Remove optimistic messages that match any new message
              updatedMessages = updatedMessages.filter(m => {
                if (!m.id.startsWith('optimistic-')) return true
                // Keep optimistic message only if no real message matches it
                return !newMessages.some(nm => nm.text === m.text && nm.isMine)
              })

              // Add new messages that aren't already in the list
              newMessages.forEach(newMsg => {
                if (!updatedMessages.some(m => m.id === newMsg.id)) {
                  updatedMessages.push(newMsg)
                }
              })

              return updatedMessages
            })
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
      }
    }, 10000) // Poll every 10 seconds instead of 3

    return () => clearInterval(pollInterval)
  }, [selectedRoom, currentUser?.id, formatTime])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLogout = () => {
    authAPI.logout()
    window.location.href = '/'
  }

  // Handle leaving a room
  const handleLeaveRoom = async (roomId, roomName) => {
    if (!currentUser?.id) return

    // Confirm with user
    if (!window.confirm(`Are you sure you want to leave "${roomName}"?`)) {
      return
    }

    try {
      // Get the user room ID first
      const userRoomResult = await userRoomsAPI.getUserRoomId(currentUser.id, roomId)
      if (!userRoomResult.success || !userRoomResult.data) {
        alert('Failed to find room membership')
        return
      }

      const userRoomId = userRoomResult.data

      // Leave via SignalR if connected
      if (signalRConnected) {
        await signalRService.leaveRoom(roomId)
      }

      // Leave via API
      const leaveResult = await userRoomsAPI.leaveRoom(userRoomId)
      if (leaveResult.success) {
        // Remove room from local state
        setRooms(prev => prev.filter(room => room.id !== roomId))
        
        // If this was the selected room, select another room or clear selection
        if (selectedRoom?.id === roomId) {
          const remainingRooms = rooms.filter(room => room.id !== roomId)
          if (remainingRooms.length > 0) {
            setSelectedRoom(remainingRooms[0])
          } else {
            setSelectedRoom(null)
            setMessages([])
          }
        }
        
        console.log('Successfully left room:', roomName)
      } else {
        alert('Failed to leave room: ' + (leaveResult.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error leaving room:', error)
      alert('Error leaving room')
    }
  }

  // Handle deleting a room (only for room creator)
  const handleDeleteRoom = async (roomId, roomName) => {
    if (!currentUser?.id) return

    // Confirm with user
    if (!window.confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete via API
      const deleteResult = await roomsAPI.delete(roomId)
      if (deleteResult.success) {
        // Remove room from local state
        setRooms(prev => prev.filter(room => room.id !== roomId))
        
        // If this was the selected room, select another room or clear selection
        if (selectedRoom?.id === roomId) {
          const remainingRooms = rooms.filter(room => room.id !== roomId)
          if (remainingRooms.length > 0) {
            setSelectedRoom(remainingRooms[0])
          } else {
            setSelectedRoom(null)
            setMessages([])
          }
        }
        
        console.log('Successfully deleted room:', roomName)
      } else {
        alert('Failed to delete room: ' + (deleteResult.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Error deleting room')
    }
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
                onClick={async () => {
                  setSelectedRoom(room)
                  
                  // Clear tracking when switching rooms
                  processedMessageIdsRef.current.clear()
                  optimisticMessagesRef.current.clear()
                  
                  // Join the room via SignalR first
                  if (signalRConnected) {
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
                  if (e.key === 'Enter' && !e.shiftKey && !isSendingMessage) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={isSendingMessage}
              />
              <button className="input-btn" title="Emoji">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="7.5" cy="8.5" r="1" fill="currentColor"/>
                  <circle cx="12.5" cy="8.5" r="1" fill="currentColor"/>
                  <path d="M7 12C7 12 8 14 10 14C12 14 13 12 13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="send-btn" onClick={handleSendMessage} disabled={!newMessage.trim() || isSendingMessage}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M16 2L8 10M16 2L11 16L8 10M16 2L2 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isSendingMessage ? 'Sending...' : 'Send'}
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
            // Rooms will update on next refresh
            setIsRoomManagerOpen(false)
          }}
          onRoomUpdated={() => {
            // Rooms will update on next refresh
          }}
          onClose={() => setIsRoomManagerOpen(false)}
        />
      )}
    </div>
  )
}

export default MainAppUI
