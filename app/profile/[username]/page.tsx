import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Rating } from '@/models/Rating'
import { List } from '@/models/List'
import ProfileHeader from '@/components/ProfileHeader'
import WaterCard from '@/components/WaterCard'
import { starsDisplay } from '@/lib/utils'
import Link from 'next/link'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  await connectDB()
  const session = await auth()

  const user = await User.findOne({ username }).select('-passwordHash').lean() as any
  if (!user) notFound()

  const ratings = await Rating.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(24)
    .populate('waterId', 'name brand slug image avgRating ratingCount')
    .lean()

  const lists = await List.find({ userId: user._id, isPublic: true }).sort({ createdAt: -1 }).lean()
  const ratingCount = await Rating.countDocuments({ userId: user._id })

  const isFollowing = session
    ? user.followers?.some((id: any) => id.toString() === session.user.id)
    : false

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <ProfileHeader
        username={user.username}
        bio={user.bio}
        followingCount={user.following?.length ?? 0}
        followersCount={user.followers?.length ?? 0}
        ratingCount={ratingCount}
        isFollowing={isFollowing}
      />

      <h2 className="text-xl mb-4">RECENT RATINGS</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-12">
        {ratings.map((r: any) => (
          <div key={r._id.toString()} className="relative">
            <WaterCard
              slug={r.waterId?.slug}
              name={r.waterId?.name}
              brand={r.waterId?.brand}
              image={r.waterId?.image}
              avgRating={r.waterId?.avgRating}
              ratingCount={r.waterId?.ratingCount}
            />
            <div className="text-[#e63946] text-xs text-center mt-1">{starsDisplay(r.score)}</div>
          </div>
        ))}
      </div>

      {lists.length > 0 && (
        <>
          <h2 className="text-xl mb-4">LISTS</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {lists.map((l: any) => (
              <Link key={l._id.toString()} href={`/lists/${l._id}`} className="card p-4 hover:shadow-[4px_4px_0_#000] transition-shadow block">
                <div className="font-black text-sm tracking-widest mb-1">{l.title.toUpperCase()}</div>
                <div className="text-xs text-gray-500">{l.waters?.length ?? 0} WATERS</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
