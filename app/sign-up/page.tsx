'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Registration failed')
      setLoading(false)
      return
    }
    await signIn('credentials', { email, password, redirect: false })
    router.push('/home')
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-sm">
        <h1 className="text-2xl mb-8 text-center">JOIN WATERBOXD</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">USERNAME</label>
            <input type="text" className="input" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">EMAIL</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">PASSWORD</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          {error && <p className="text-[#e63946] text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-black underline">SIGN IN</Link>
        </p>
      </div>
    </div>
  )
}
