import './App.css'
import Login from './components/LogIn/Login'
import Welcome from './components/Welcome/Welcome'
import { Routes, Route, Link } from "react-router-dom"


const App = () => {
  return (
    <div className="app">
      <Routes>
        <Route path='/' element={<Welcome/>} />
        <Route path='/login' element={<Login/>} />
      </Routes>
    </div>
  )
}

export default App