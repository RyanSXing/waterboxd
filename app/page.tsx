'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const BottleScene = dynamic(() => import('@/components/BottleScene'), { ssr: false })

export default function LandingPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col items-center justify-center">

      <style>{`
        @keyframes rise {
          0%   { transform: translateY(0) scale(0.5); opacity: 0; }
          15%  { opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(1.2); opacity: 0; }
        }
        .bubble {
          position: absolute;
          border-radius: 50%;
          background: rgba(79,195,247,0.15);
          border: 1px solid rgba(79,195,247,0.3);
          animation: rise linear infinite;
          pointer-events: none;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up        { animation: fadeUp 0.9s ease forwards; }
        .fade-up-delay  { animation: fadeUp 0.9s 0.25s ease forwards; opacity: 0; }
        .fade-up-delay2 { animation: fadeUp 0.9s 0.5s ease forwards; opacity: 0; }
      `}</style>

      {/* Rising bubbles */}
      {[...Array(18)].map((_, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            width:  `${8 + (i * 7) % 22}px`,
            height: `${8 + (i * 7) % 22}px`,
            left:   `${(i * 17 + 5) % 95}%`,
            bottom: '-40px',
            animationDuration: `${5 + (i * 3) % 7}s`,
            animationDelay:    `${(i * 1.1) % 6}s`,
          }}
        />
      ))}

      {/* 3D bottle */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
        <div style={{ width: '480px', height: '600px', maxWidth: '90vw', maxHeight: '65vh' }}>
          <BottleScene />
        </div>
      </div>

      {/* Text + CTA */}
      <div
        className="relative flex flex-col items-center text-center px-6"
        style={{ zIndex: 2, marginTop: '54vh' }}
      >
        {visible && (
          <>
            <div className="fade-up text-[#e63946] text-xs font-black tracking-[5px] mb-3">
              TRACK. RATE. HYDRATE.
            </div>
            <h1
              className="fade-up-delay text-white font-black tracking-[4px] leading-none mb-8"
              style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}
            >
              WATERBOXD
            </h1>
            <Link
              href="/home"
              className="fade-up-delay2 inline-block bg-[#e63946] text-white font-black tracking-widest uppercase px-10 py-3 border-3 border-white hover:bg-white hover:text-black transition-colors text-sm"
            >
              ENTER →
            </Link>
          </>
        )}
      </div>

    </div>
  )
}
