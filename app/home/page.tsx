import Link from 'next/link'
import HeroBubbles from '@/components/HeroBubbles'
import WaterCard from '@/components/WaterCard'
import { connectDB } from '@/lib/db'
import { Water } from '@/models/Water'
import { Rating } from '@/models/Rating'
import { starsDisplay } from '@/lib/utils'

async function getPopularWaters() {
  await connectDB()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recent = await Rating.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: '$waterId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ])
  if (recent.length > 0) {
    const ids = recent.map(r => r._id)
    return Water.find({ _id: { $in: ids } }).lean()
  }
  return Water.find().sort({ avgRating: -1 }).limit(10).lean()
}

async function getRecentReviews() {
  await connectDB()
  return Rating.find({ review: { $ne: '' } })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('userId', 'username')
    .populate('waterId', 'name brand slug')
    .lean()
}

export default async function HomePage() {
  const [waters, reviews] = await Promise.all([getPopularWaters(), getRecentReviews()])

  return (
    <div>
      {/* HERO */}
      <section className="bg-black relative overflow-hidden min-h-[340px] flex items-center border-b-3 border-black">
        <HeroBubbles />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
          <div className="text-[#e63946] text-xs font-black tracking-[4px] mb-3">TRACK. RATE. HYDRATE.</div>
          <h1 className="text-white text-4xl md:text-6xl font-black tracking-widest leading-none mb-4">
            THE SOCIAL NETWORK<br />FOR WATER DRINKERS.
          </h1>
          <p className="text-gray-400 text-sm mb-8 max-w-md">
            Rate every bottle. Keep a hydration diary. Find your perfect water.
          </p>
          <Link href="/sign-up" className="btn-primary inline-block text-sm">
            GET STARTED →
          </Link>
        </div>
      </section>

      {/* POPULAR THIS WEEK */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-b-3 border-black">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl tracking-widest">POPULAR THIS WEEK</h2>
          <Link href="/waters" className="text-[#e63946] text-xs font-black tracking-widest hover:underline">
            ALL WATERS →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {waters.map((w: any) => (
            <WaterCard
              key={w._id.toString()}
              slug={w.slug}
              name={w.name}
              brand={w.brand}
              image={w.image}
              avgRating={w.avgRating}
              ratingCount={w.ratingCount}
            />
          ))}
        </div>
      </section>

      {/* RECENT REVIEWS */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl mb-6">RECENT REVIEWS</h2>
        <div className="space-y-4">
          {reviews.length === 0 && (
            <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
          )}
          {reviews.map((r: any) => (
            <div key={r._id.toString()} className="border-l-3 border-[#e63946] pl-4">
              <div className="text-sm">
                <Link href={`/profile/${r.userId?.username}`} className="font-black hover:underline">
                  @{r.userId?.username}
                </Link>
                {' drank '}
                <Link href={`/waters/${r.waterId?.slug}`} className="font-black hover:underline">
                  {r.waterId?.brand} {r.waterId?.name}
                </Link>
                <span className="text-[#e63946] ml-2 text-xs">{starsDisplay(r.score)}</span>
              </div>
              {r.review && <p className="text-gray-600 text-xs mt-1 italic">"{r.review}"</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
