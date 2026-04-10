'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [bio, setBio] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [bioLoaded, setBioLoaded] = useState(false)

  useEffect(() => {
    if (session?.user?.name && !bioLoaded) {
      fetch(`/api/users/${session.user.name}`)
        .then(r => r.json())
        .then(data => {
          setBio(data.user?.bio ?? '')
          setBioLoaded(true)
        })
    }
  }, [session, bioLoaded])

  if (!session) { router.push('/sign-in'); return null }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/users/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, password: password || undefined }),
    })
    if (res.ok) { setMessage('SAVED!'); setPassword('') }
    else setMessage('Error saving settings')
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">SETTINGS</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">USERNAME</label>
          <div className="input bg-gray-100 text-gray-500">{session.user.name}</div>
        </div>
        <div>
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">BIO</label>
          <textarea className="input resize-none h-20" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell people about your hydration journey..." />
        </div>
        <div>
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">NEW PASSWORD</label>
          <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" minLength={8} />
        </div>
        {message && <p className={`text-xs font-black ${message === 'SAVED!' ? 'text-green-600' : 'text-[#e63946]'}`}>{message}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </form>
    </div>
  )
}
