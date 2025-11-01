import { useEffect, useRef } from 'react'
import gsap from 'gsap' 
import './Welcome.css'

const Welcome = () => {
  const titleRef = useRef(null)

  // GSAP анімація при монтуванні компонента
  useEffect(() => {
    const chars = titleRef.current.querySelectorAll('.char')
    
    gsap.fromTo(
      chars,
      {
        opacity: 0,
        y: 20,
        filter: 'blur(8px)'
      },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.03,
        force3D: true,
        clearProps: 'all'
      }
    )
  }, [])

  const text = 'Welcome to Web Chat'
  
  return (
    <div className="welcome">

      <h1 ref={titleRef}>
        {text.split('').map((char, index) => (
          <span key={index} className="char">
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h1>

    </div>
  )
}

export default Welcome