'use client'
import { useEffect, useRef } from 'react'

export default function HeroBubbles() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const bubbles: HTMLDivElement[] = []

    for (let i = 0; i < 22; i++) {
      const b = document.createElement('div')
      const size = 6 + Math.random() * 20
      const duration = 4 + Math.random() * 7
      const delay = Math.random() * 8
      const left = Math.random() * 100

      b.style.cssText = `
        position:absolute;
        width:${size}px;
        height:${size}px;
        left:${left}%;
        bottom:-30px;
        border-radius:50%;
        background:rgba(79,195,247,0.25);
        border:1px solid rgba(79,195,247,0.5);
        animation:rise ${duration}s ${delay}s linear infinite;
        pointer-events:none;
      `
      container.appendChild(b)
      bubbles.push(b)
    }

    return () => bubbles.forEach(b => b.remove())
  }, [])

  return (
    <>
      <style>{`
        @keyframes rise {
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 0.6; }
          100% { transform: translateY(-420px) scale(1.3); opacity: 0; }
        }
      `}</style>
      <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" />
    </>
  )
}
