'use client'
import dynamic from 'next/dynamic'

const LandingWater = dynamic(() => import('@/components/LandingWater'), { ssr: false })

export default function LandingPage() {
  return <LandingWater />
}
