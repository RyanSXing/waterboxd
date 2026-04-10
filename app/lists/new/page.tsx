'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function NewListPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)

  if (!session) { router.push('/sign-in'); return null }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, isPublic }),
    })
    const data = await res.json()
    router.push(`/lists/${data._id}`)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">CREATE LIST</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">TITLE</label>
          <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">DESCRIPTION</label>
          <textarea className="input resize-none h-20" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="public" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="public" className="text-xs font-black tracking-widest">PUBLIC LIST</label>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'CREATING...' : 'CREATE LIST'}
        </button>
      </form>
    </div>
  )
}
