import { useNavigate } from 'react-router-dom'
import './Profile.css'

const Profile = () => {
  const navigate = useNavigate()

  return (
    <div className="settings-overlay" onClick={(e) => e.target === e.currentTarget && navigate('/chat')}>
      <div className="settings-modal">
        <h2 style={{color: 'black', padding: '20px'}}>Settings Modal Works!</h2>
        <button onClick={() => navigate('/chat')} style={{padding: '10px', margin: '20px'}}>Close</button>
      </div>
    </div>
  )
}

export default Profile
