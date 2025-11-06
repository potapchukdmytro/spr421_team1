import { useEffect, useRef } from 'react'
import gsap from 'gsap' 
import './Welcome.css'

const Welcome = () => {
  // Рефи для контенту та його анімації
  const contentRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const buttonsRef = useRef(null)
  const creditsRef = useRef(null) 

  // Ефект #1: Анімація появи (Timeline)
  useEffect(() => {
    const chars = titleRef.current.querySelectorAll('.char')
    
    // Створюємо timeline
    const tl = gsap.timeline()
    
    // 1. Спочатку з'являється весь контент-блок
    tl.fromTo(
      contentRef.current,
      { 
        opacity: 0, 
        scale: 0.98, 
        filter: 'blur(5px)' 
      },
      {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.0,
        ease: 'power2.out'
      }
    )
    
    // 2. Потім анімується заголовок
    tl.fromTo(
      chars,
      { 
        opacity: 0, 
        y: 20, 
        filter: 'blur(5px)' 
      }, 
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)', 
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.03
      },
      '-=0.5' 
    )
    
    // 3. Підзаголовок
    tl.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.3'
    )
    
    // 4. Кнопки
    tl.fromTo(
      buttonsRef.current.children,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'back.out(1.2)',
        stagger: 0.1
      },
      '-=0.2'
    )

    // 5. Плавна поява "Credits"
    tl.fromTo(
      creditsRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power1.inOut' },
      '-=0.2' // З'являється одночасно з кнопками
    )

  }, [])

  // Ефект #2: Інтерактивний 3D-паралакс 
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!contentRef.current) return
      const xPercent = (e.clientX / window.innerWidth - 0.5) * 2
      const yPercent = (e.clientY / window.innerHeight - 0.5) * 2

      gsap.to(contentRef.current, {
        duration: 0.7,
        rotationY: xPercent * 5,
        rotationX: yPercent * -5,
        ease: 'power1.out'
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const text = 'Welcome to Web Chat'
  
  return (
    <div className="welcome">
      <div className="noise-overlay"></div>

      {/* Центральний блок контенту (для 3D-ефекту) */}
      <div className="welcome-content" ref={contentRef}>
        <h1 ref={titleRef}>
          {text.split('').map((char, index) => (
            <span key={index} className="char">
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h1>

        <p ref={subtitleRef} className="welcome-subtitle">
          Just Send and Reply.
        </p>

        <div ref={buttonsRef} className="welcome-buttons">
          <button className="btn btn-primary" href='/LogIn'>Login</button>
          <button className="btn btn-secondary">Sign Up</button>
        </div>
      </div>

      <p className="welcome-credits" ref={creditsRef}>
        Made by <a href="https://github.com/Kyuuto09" target="_blank" rel="noopener noreferrer">Kyuuto09</a>, 
        <a href="https://github.com/axneo27" target="_blank" rel="noopener noreferrer"> axneo27</a>, 
        <a href="https://github.com/SlavaMokrynskyi" target="_blank" rel="noopener noreferrer"> SlavaMokrynskyi</a>, 
        <a href="https://github.com/da2045" target="_blank" rel="noopener noreferrer"> da2045</a> & 
        <a href="https://github.com/samoliukrustam123" target="_blank" rel="noopener noreferrer"> samoliukrustam123</a>
      </p>

    </div>
  )
}

export default Welcome