import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Rating } from '@/models/Rating'
import { starsDisplay } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export default async function ActivityPage() {
  const session = await auth()
  if (!session) redirect('/sign-in')

  await connectDB()
  const currentUser = await User.findById(session.user.id).select('following').lean() as any
  const followingIds = currentUser?.following ?? []

  const feed = await Rating.find({ userId: { $in: followingIds } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId', 'username')
    .populate('waterId', 'name brand slug image')
    .lean() as any[]

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">ACTIVITY</h1>

      {followingIds.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">Follow some people to see their activity.</p>
          <Link href="/waters" className="btn-primary inline-block">EXPLORE WATERS</Link>
        </div>
      )}

      {feed.length === 0 && followingIds.length > 0 && (
        <p className="text-gray-400 text-sm">No recent activity from people you follow.</p>
      )}

      <div className="space-y-4">
        {feed.map((r: any) => (
          <div key={r._id.toString()} className="card flex gap-4 p-4">
            {r.waterId?.image && (
              <Link href={`/waters/${r.waterId.slug}`}>
                <Image
                  src={`/waters/${r.waterId.image}`}
                  alt={r.waterId.name}
                  width={36}
                  height={60}
                  className="object-contain flex-shrink-0"
                />
              </Link>
            )}
            <div className="flex-1">
              <div className="text-sm mb-1">
                <Link href={`/profile/${r.userId?.username}`} className="font-black hover:underline">
                  @{r.userId?.username}
                </Link>
                {' drank '}
                <Link href={`/waters/${r.waterId?.slug}`} className="font-black hover:underline">
                  {r.waterId?.brand} {r.waterId?.name}
                </Link>
              </div>
              <div className="text-[#e63946] text-xs mb-1">{starsDisplay(r.score)}</div>
              {r.review && <p className="text-xs text-gray-600 italic">"{r.review}"</p>}
              <div className="text-gray-400 text-xs mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
