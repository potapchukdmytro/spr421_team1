import './App.css'
import MainAppUI from './components/MainAppUI/MainAppUI'
import Login from './components/Login/Login'
import Welcome from './components/Welcome/Welcome'
import Signup from './components/SignUp/Signup'
import { Routes, Route } from "react-router-dom"

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat" element={<MainAppUI />} />
      </Routes>
    </div>
  )
}

export default App