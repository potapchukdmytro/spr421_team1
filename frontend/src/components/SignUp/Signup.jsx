import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import confetti from 'canvas-confetti'
import { authAPI } from '../../services/api'
import './Signup.css'

const Signup = () => {
  const formRef = useRef(null)
  const titleRef = useRef(null)
  const fieldsRef = useRef(null)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const tl = gsap.timeline()

    // Container fade-in with blur
    tl.fromTo(
      formRef.current,
      { opacity: 0, y: 20, filter: 'blur(5px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' }
    )

    // Title character stagger (like Welcome)
    tl.fromTo(
      titleRef.current.querySelectorAll('.char'),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.02, ease: 'power2.out' },
      '-=0.4'
    )

    // Form fields slide in
    tl.fromTo(
      fieldsRef.current.children,
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
      '-=0.2'
    )
  }, [])

  // 3D Parallax effect (like Welcome)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!formRef.current) return
      const xPercent = (e.clientX / window.innerWidth - 0.5) * 2
      const yPercent = (e.clientY / window.innerHeight - 0.5) * 2

      gsap.to(formRef.current, {
        duration: 0.7,
        rotationY: xPercent * 3,
        rotationX: yPercent * -3,
        ease: 'power1.out'
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      console.log('Registration data:', formData)
      const response = await authAPI.register(formData.userName, formData.email, formData.password)
      console.log('Full registration response:', response)
      console.log('response.isSuccess:', response.isSuccess)
      console.log('response.payload:', response.payload)
      
      if (response.isSuccess) {
        console.log('Registration successful!')
        
        // Celebration confetti! 🎉
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#37352f', '#FAFAFA', '#e8e6e3', '#d3d1cb']
        })
        
        // Show success message
        setSuccess('Account created successfully! Redirecting to login...')
        
        // Clear form
        setFormData({ userName: '', email: '', password: '' })
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        console.log('Registration failed:', response.message)
        setError(response.message || 'Registration failed')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const titleText = 'Sign Up'

  return (
    <div className="auth-page">
      <div className="noise-overlay"></div>
      <Link to="/" className="back-to-home" title="Back to home">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      
      <div className="auth-container" ref={formRef}>
        <h1 className="auth-title" ref={titleRef}>
          {titleText.split('').map((char, index) => (
            <span key={index} className="char">
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h1>
        
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        {success && (
          <div className="auth-success">
            {success}
          </div>
        )}
        
        <form className="auth-form" ref={fieldsRef} onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="userName"
              className="form-input"
              placeholder="Your name"
              autoComplete="name"
              value={formData.userName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="name@example.com"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Signup
