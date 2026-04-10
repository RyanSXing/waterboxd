import { connectDB } from '@/lib/db'
import { Water } from '@/models/Water'
import WaterCard from '@/components/WaterCard'
import Link from 'next/link'

const TYPES = ['all', 'still', 'sparkling', 'mineral', 'alkaline']
const SORT_OPTIONS = [
  { value: 'avgRating', label: 'TOP RATED' },
  { value: 'ratingCount', label: 'MOST REVIEWED' },
  { value: 'createdAt', label: 'NEWEST' },
]

export default async function WatersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; sort?: string }>
}) {
  const { type: rawType, sort: rawSort } = await searchParams
  const type = rawType ?? 'all'
  const sort = rawSort ?? 'avgRating'
  await connectDB()

  const filter: Record<string, string> = {}
  if (type !== 'all') filter.type = type

  const waters = await Water.find(filter).sort({ [sort]: -1 }).lean()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">ALL WATERS</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 border-b-3 border-black pb-6">
        <div className="flex gap-2">
          {TYPES.map(t => (
            <Link
              key={t}
              href={`/waters?type=${t}&sort=${sort}`}
              className={`text-xs font-black tracking-widest px-3 py-2 border-3 border-black transition-colors ${
                type === t ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'
              }`}
            >
              {t.toUpperCase()}
            </Link>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {SORT_OPTIONS.map(s => (
            <Link
              key={s.value}
              href={`/waters?type=${type}&sort=${s.value}`}
              className={`text-xs font-black tracking-widest px-3 py-2 border-3 border-black transition-colors ${
                sort === s.value ? 'bg-[#e63946] text-white border-[#e63946]' : 'bg-white hover:bg-black hover:text-white'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
    </div>
  )
}
