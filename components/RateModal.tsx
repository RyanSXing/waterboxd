'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import StarRating from './StarRating'

interface Props {
  waterId: string
  waterName: string
  existingRating?: { id: string; score: number; review: string }
  onClose: () => void
}

export default function RateModal({ waterId, waterName, existingRating, onClose }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [score, setScore] = useState(existingRating?.score ?? 0)
  const [review, setReview] = useState(existingRating?.review ?? '')
  const [drankOn, setDrankOn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!session) return null

  async function submit() {
    if (!score) { setError('Select a rating'); return }
    setLoading(true)
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waterId, score, review, drankOn }),
    })
    if (!res.ok) { setError('Failed to save rating'); setLoading(false); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-lg">RATE WATER</h2>
          <button onClick={onClose} className="font-black text-gray-400 hover:text-black">✕</button>
        </div>
        <p className="text-sm text-gray-600 mb-4 uppercase tracking-widest">{waterName}</p>
        <div className="mb-4">
          <StarRating value={score} onChange={setScore} />
        </div>
        <textarea
          className="input mb-4 resize-none h-24"
          placeholder="Write a review... (optional)"
          value={review}
          onChange={e => setReview(e.target.value)}
        />
        <div className="mb-4">
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">DRANK ON</label>
          <input type="date" className="input" value={drankOn} onChange={e => setDrankOn(e.target.value)} />
        </div>
        {error && <p className="text-[#e63946] text-xs mb-3">{error}</p>}
        <button onClick={submit} disabled={loading} className="btn-primary w-full">
          {loading ? 'SAVING...' : 'SAVE RATING'}
        </button>
      </div>
    </div>
  )
}
