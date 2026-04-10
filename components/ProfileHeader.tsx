'use client'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  username: string
  bio: string
  followingCount: number
  followersCount: number
  ratingCount: number
  isFollowing: boolean
}

export default function ProfileHeader({ username, bio, followingCount, followersCount, ratingCount, isFollowing }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [following, setFollowing] = useState(isFollowing)
  const [loading, setLoading] = useState(false)
  const isOwn = session?.user?.name === username

  async function toggleFollow() {
    if (!session) { router.push('/sign-in'); return }
    setLoading(true)
    const method = following ? 'DELETE' : 'POST'
    await fetch(`/api/users/${username}/follow`, { method })
    setFollowing(!following)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="border-b-3 border-black pb-8 mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">@{username.toUpperCase()}</h1>
          {bio && <p className="text-gray-600 text-sm mb-4">{bio}</p>}
          <div className="flex gap-6 text-xs font-black tracking-widest text-gray-500">
            <span><strong className="text-black">{ratingCount}</strong> RATINGS</span>
            <span><strong className="text-black">{followersCount}</strong> FOLLOWERS</span>
            <span><strong className="text-black">{followingCount}</strong> FOLLOWING</span>
          </div>
        </div>
        {!isOwn && session && (
          <button onClick={toggleFollow} disabled={loading} className={following ? 'btn-outline' : 'btn-primary'}>
            {loading ? '...' : following ? 'FOLLOWING' : 'FOLLOW'}
          </button>
        )}
        {isOwn && (
          <a href="/settings" className="btn-outline text-xs">EDIT PROFILE</a>
        )}
      </div>
    </div>
  )
}
