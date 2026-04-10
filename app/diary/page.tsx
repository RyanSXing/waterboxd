import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { DiaryEntry } from '@/models/DiaryEntry'
import { starsDisplay } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export default async function DiaryPage() {
  const session = await auth()
  if (!session) redirect('/sign-in')

  await connectDB()
  const entries = await DiaryEntry.find({ userId: session.user.id })
    .sort({ drankOn: -1 })
    .populate('waterId', 'name brand slug image')
    .populate('ratingId', 'score review')
    .lean() as any[]

  // Group by month
  const grouped: Record<string, any[]> = {}
  for (const e of entries) {
    const key = new Date(e.drankOn).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    grouped[key] = grouped[key] ?? []
    grouped[key].push(e)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">HYDRATION DIARY</h1>

      {Object.keys(grouped).length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">No diary entries yet.</p>
          <Link href="/waters" className="btn-primary inline-block">FIND A WATER TO LOG</Link>
        </div>
      )}

      {Object.entries(grouped).map(([month, monthEntries]) => (
        <div key={month} className="mb-10">
          <h2 className="text-sm font-black tracking-widest text-gray-500 border-b-3 border-black pb-2 mb-4">
            {month.toUpperCase()}
          </h2>
          <div className="space-y-3">
            {monthEntries.map((e: any) => (
              <div key={e._id.toString()} className="card flex gap-4 p-4">
                <div className="w-10 flex-shrink-0 flex items-start justify-center pt-1">
                  <span className="text-xs font-black text-gray-400">
                    {new Date(e.drankOn).getDate()}
                  </span>
                </div>
                {e.waterId?.image && (
                  <Image
                    src={`/waters/${e.waterId.image}`}
                    alt={e.waterId.name}
                    width={36}
                    height={60}
                    className="object-contain flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/waters/${e.waterId?.slug}`} className="font-black text-sm hover:underline">
                    {e.waterId?.brand} — {e.waterId?.name}
                  </Link>
                  {e.ratingId && (
                    <div className="text-[#e63946] text-xs">{starsDisplay(e.ratingId.score)}</div>
                  )}
                  {e.notes && <p className="text-xs text-gray-600 mt-1">{e.notes}</p>}
                  {e.ratingId?.review && (
                    <p className="text-xs text-gray-500 italic mt-1">"{e.ratingId.review}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
