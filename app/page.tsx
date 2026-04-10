'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const BottleScene  = dynamic(() => import('@/components/BottleScene'),  { ssr: false })
const WaterShader  = dynamic(() => import('@/components/WaterShader'),  { ssr: false })

export default function LandingPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col items-center justify-center">

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up        { animation: fadeUp 0.9s ease forwards; }
        .fade-up-delay  { animation: fadeUp 0.9s 0.25s ease forwards; opacity: 0; }
        .fade-up-delay2 { animation: fadeUp 0.9s 0.5s ease forwards; opacity: 0; }
      `}</style>

      {/* Water ripple shader — fullscreen background */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <WaterShader />
      </div>

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
