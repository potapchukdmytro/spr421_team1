import { useState, useEffect } from 'react'
import { roomsAPI, usersAPI, userRoomsAPI } from '../../services/api'
import { signalRService } from '../../services/signalr'
import './RoomManager.css'

const RoomManager = ({ currentUser, onRoomCreated, onRoomUpdated, onClose }) => {
  const [roomName, setRoomName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [currentRooms, setCurrentRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [roomMembers, setRoomMembers] = useState([])

  // Load current user's rooms
  useEffect(() => {
    loadUserRooms()
  }, [currentUser])

  const loadUserRooms = async () => {
    if (!currentUser?.id) return

    try {
      console.log('Loading user rooms for user:', currentUser.id)
      const result = await userRoomsAPI.getUserRooms(currentUser.id)
      console.log('User rooms API result:', result)
      if (result.success && result.data) {
        console.log('Setting current rooms:', result.data)
        setCurrentRooms(result.data)
      } else {
        console.log('Failed to load user rooms:', result)
        setCurrentRooms([])
      }
    } catch (error) {
      console.error('Failed to load user rooms:', error)
      setCurrentRooms([])
    }
  }

  // Search users with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const searchUsers = async () => {
    console.log('Searching for users with query:', searchQuery)
    setSearching(true)
    try {
      const result = await usersAPI.search(searchQuery)
      console.log('Search result:', result)
      if (result.success && result.data) {
        // Filter out current user and already selected users
        const filteredUsers = result.data.filter(user =>
          user.id !== currentUser?.id &&
          !selectedUsers.some(selected => selected.id === user.id)
        )
        console.log('Filtered users:', filteredUsers)
        setSearchResults(filteredUsers)
      } else {
        console.log('Search failed or no data:', result)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    }
    setSearching(false)
  }

  const addUser = (user) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const leaveRoom = async (roomId) => {
    if (!confirm('Are you sure you want to leave this room?')) return

    try {
      // Find the user-room relationship ID
      const userRoomId = await getUserRoomId(currentUser.id, roomId)
      if (!userRoomId) {
        alert('Failed to find your membership in this room')
        return
      }

      console.log('Leaving room:', roomId, 'with userRoomId:', userRoomId)
      const result = await userRoomsAPI.leaveRoom(userRoomId)
      console.log('Leave room result:', result)

      if (result.success) {
        alert('Successfully left the room!')
        console.log('Reloading user rooms...')
        await loadUserRooms()
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null)
        }
        // Notify parent component to refresh main room list
        if (onRoomUpdated) onRoomUpdated()
      } else {
        // Handle specific error cases
        if (result.status === 400 && result.message?.includes('Room creators cannot leave')) {
          alert('You cannot leave a room you created. Use the delete option instead.')
        } else {
          alert('Failed to leave room: ' + (result.error || result.message))
        }
      }
    } catch (error) {
      console.error('Failed to leave room:', error)
      alert('Failed to leave room. Please try again.')
    }
  }

  const deleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone!')) return

    try {
      const result = await roomsAPI.delete(roomId)
      if (result.success) {
        alert('Room deleted successfully!')
        await loadUserRooms()
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null)
        }
        // Notify parent component to refresh main room list
        if (onRoomUpdated) onRoomUpdated()
      } else {
        alert('Failed to delete room: ' + (result.error || result.message))
      }
    } catch (error) {
      console.error('Failed to delete room:', error)
      alert('Failed to delete room. Please try again.')
    }
  }

  const getUserRoomId = async (userId, roomId) => {
    try {
      const result = await userRoomsAPI.getUserRoomId(userId, roomId)
      if (result.success && result.data) {
        return result.data
      }
      return null
    } catch (error) {
      console.error('Failed to get user room ID:', error)
      return null
    }
  }

  const createRoom = async () => {
    if (!roomName.trim()) {
      alert('Please enter a room name')
      return
    }

    setLoading(true)
    try {
      // Create room via SignalR for real-time updates
      const userIds = selectedUsers.map(u => u.id)
      await signalRService.createRoom(roomName.trim(), isPrivate, userIds)

      // Reset form
      setRoomName('')
      setIsPrivate(false)
      setSelectedUsers([])
      setSearchQuery('')
      setSearchResults([])

      // Reload rooms
      await loadUserRooms()

      // Notify parent
      if (onRoomCreated) {
        onRoomCreated()
      }

      alert('Room created successfully!')
    } catch (error) {
      console.error('Failed to create room:', error)
      alert('Failed to create room. Please try again.')
    }
    setLoading(false)
  }

  const selectRoom = (room) => {
    setSelectedRoom(room)
    // TODO: Load room members
  }

  const addUserToRoom = async (userId) => {
    if (!selectedRoom) return

    try {
      await signalRService.addUserToRoom(userId, selectedRoom.id)
      alert('User added to room successfully!')
      // TODO: Refresh room members
    } catch (error) {
      console.error('Failed to add user to room:', error)
      alert('Failed to add user to room.')
    }
  }

  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId))
  }
  const removeUserFromRoom = async (userId) => {
    if (!selectedRoom) return

    try {
      const result = await userRoomsAPI.getUserRooms(userId)
      const userRoom = result.data?.find(ur => ur.roomId === selectedRoom.id)

      if (userRoom) {
        await userRoomsAPI.leaveRoom(userRoom.id)
        alert('User removed from room successfully!')
        // TODO: Refresh room members
      }
    } catch (error) {
      console.error('Failed to remove user from room:', error)
      alert('Failed to remove user from room.')
    }
  }

  return (
    <div className="room-manager">
      <div className="room-manager-header">
        <h2>Room Management</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="room-manager-content">
        {/* Create Room Section */}
        <div className="create-room-section">
          <div className="section-header">
            <h3>Create New Room</h3>
            <button className="section-close-btn" onClick={() => {
              console.log('Cross button clicked!')
              onClose()
            }}>×</button>
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="Room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="room-name-input"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              Private Room
            </label>
          </div>

          {/* User Search and Selection */}
          <div className="user-selection">
            <h4>Add Users to Room</h4>

            <div className="search-container">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="user-search-input"
              />
              {searching && <span className="searching">Searching...</span>}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(user => (
                  <div key={user.id} className="search-result-item">
                    <div className="user-info">
                      <div className="user-avatar">{user.userName?.substring(0, 2).toUpperCase()}</div>
                      <div className="user-details">
                        <div className="user-name">{user.userName}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                    <button
                      className="add-user-btn"
                      onClick={() => addUser(user)}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="selected-users">
                <h5>Selected Users:</h5>
                {selectedUsers.map(user => (
                  <div key={user.id} className="selected-user-item">
                    <div className="user-info">
                      <div className="user-avatar">{user.userName?.substring(0, 2).toUpperCase()}</div>
                      <div className="user-name">{user.userName}</div>
                    </div>
                    <button
                      className="remove-user-btn"
                      onClick={() => removeUser(user.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="create-room-btn"
            onClick={createRoom}
            disabled={loading || !roomName.trim()}
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        {/* Manage Existing Rooms */}
        <div className="manage-rooms-section">
          <h3>Your Rooms</h3>

          <div className="rooms-list">
            {currentRooms.map(room => (
              <div
                key={room.id}
                className={`room-item ${selectedRoom?.id === room.id ? 'selected' : ''}`}
              >
                <div className="room-avatar">{room.name?.substring(0, 2).toUpperCase()}</div>
                <div className="room-info">
                  <div className="room-name">{room.name}</div>
                  <div className="room-type">{room.isPrivate ? 'Private' : 'Public'}</div>
                  <div className="room-creator">Created by: {room.createdByName}</div>
                </div>
                <div className="room-actions">
                  {room.createdById === currentUser?.id ? (
                    <button
                      className="delete-room-btn"
                      onClick={() => deleteRoom(room.id)}
                      title="Delete room"
                    >
                      🗑️
                    </button>
                  ) : (
                    <button
                      className="leave-room-btn"
                      onClick={() => leaveRoom(room.id)}
                      title="Leave room"
                    >
                      🚪
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedRoom && (
            <div className="room-members-section">
              <h4>Members of {selectedRoom.name}</h4>
              {/* TODO: Load and display room members */}
              <p>Room member management coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomManager