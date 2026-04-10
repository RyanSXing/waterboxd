import Image from 'next/image'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Water } from '@/models/Water'
import { Rating } from '@/models/Rating'
import { User } from '@/models/User'
import RatingHistogram from '@/components/RatingHistogram'
import { starsDisplay, formatRating } from '@/lib/utils'
import RateButton from './RateButton'
import WantlistButton from '@/components/WantlistButton'

export default async function WaterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await connectDB()
  const { slug } = await params
  const water = await Water.findOne({ slug }).lean() as any
  if (!water) notFound()

  const session = await auth()
  let inWantList = false
  if (session) {
    const currentUser = await User.findById(session.user.id).select('wantList').lean() as any
    inWantList = currentUser?.wantList?.some((id: any) => id.toString() === water._id.toString()) ?? false
  }

  const reviews = await Rating.find({ waterId: water._id, review: { $ne: '' } })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('userId', 'username')
    .lean()

  const dist = await Rating.aggregate([
    { $match: { waterId: water._id } },
    { $group: { _id: { $floor: '$score' }, count: { $sum: 1 } } },
  ])
  const distribution: Record<string, number> = {}
  dist.forEach((d: any) => { distribution[d._id.toString()] = d.count })

  const META_ROWS = [
    { label: 'TYPE', value: water.type?.toUpperCase() },
    { label: 'COUNTRY', value: water.country },
    { label: 'SOURCE', value: water.sourceRegion },
    { label: 'PH', value: water.ph != null ? water.ph.toString() : '—' },
    { label: 'TDS', value: water.tds != null ? `${water.tds} mg/L` : '—' },
    { label: 'HARDNESS', value: water.hardness?.toUpperCase() ?? '—' },
    { label: 'PACKAGING', value: water.packaging?.toUpperCase() },
    { label: 'PRICE', value: water.priceTier?.toUpperCase() },
    ...(water.carbonationLevel ? [{ label: 'CARBONATION', value: water.carbonationLevel.toUpperCase() }] : []),
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-[200px_1fr] gap-10">
        {/* Bottle image */}
        <div className="flex flex-col items-center gap-4">
          <div className="card w-full flex items-end justify-center h-64 p-6 bg-gray-50">
            <Image
              src={`/waters/${water.image}`}
              alt={water.name}
              width={120}
              height={220}
              className="object-contain h-full w-auto"
            />
          </div>
          <RateButton waterId={water._id.toString()} waterName={`${water.brand} ${water.name}`} />
          <WantlistButton waterId={water._id.toString()} initialInList={inWantList} />
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl mb-1">{water.brand.toUpperCase()}</h1>
          <h2 className="text-lg font-normal text-gray-600 mb-6 uppercase tracking-widest">{water.name}</h2>

          {/* Rating summary */}
          <div className="card p-6 mb-6">
            <div className="flex items-end gap-4 mb-4">
              <div className="text-5xl font-black">{water.avgRating > 0 ? formatRating(water.avgRating) : '—'}</div>
              <div>
                <div className="text-[#e63946] text-xl">{water.avgRating > 0 ? starsDisplay(water.avgRating) : '☆☆☆☆☆'}</div>
                <div className="text-gray-400 text-xs">{water.ratingCount} RATINGS</div>
              </div>
            </div>
            <RatingHistogram distribution={distribution} total={water.ratingCount} />
          </div>

          {/* Metadata */}
          <div className="card mb-6">
            {META_ROWS.map(row => (
              <div key={row.label} className="flex border-b border-gray-200 last:border-0 px-4 py-2">
                <span className="text-xs font-black tracking-widest text-gray-500 w-32">{row.label}</span>
                <span className="text-xs font-black">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-10">
        <h2 className="text-xl mb-6">REVIEWS</h2>
        {reviews.length === 0 && <p className="text-gray-400 text-sm">No reviews yet.</p>}
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r._id.toString()} className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-black text-sm">@{r.userId?.username}</span>
                <span className="text-[#e63946] text-xs">{starsDisplay(r.score)}</span>
                <span className="text-gray-400 text-xs ml-auto">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{r.review}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
