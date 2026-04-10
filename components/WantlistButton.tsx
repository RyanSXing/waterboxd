'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Props {
  waterId: string
  initialInList: boolean
}

export default function WantlistButton({ waterId, initialInList }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [inList, setInList] = useState(initialInList)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!session) { router.push('/sign-in'); return }
    setLoading(true)
    await fetch('/api/users/wantlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waterId, action: inList ? 'remove' : 'add' }),
    })
    setInList(!inList)
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading} className={inList ? 'btn-secondary w-full text-sm' : 'btn-outline w-full text-sm'}>
      {loading ? '...' : inList ? '✓ ON WANTLIST' : '+ WANTLIST'}
    </button>
  )
}
