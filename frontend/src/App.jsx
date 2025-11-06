import './App.css'
import Login from './components/LogIn/Login'
import Welcome from './components/Welcome/Welcome'
import Signup from './components/SignUp/Signup'
import { Routes, Route } from "react-router-dom"

const App = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  )
}

export default App
