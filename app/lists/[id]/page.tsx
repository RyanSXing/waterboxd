import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { List } from '@/models/List'
import WaterCard from '@/components/WaterCard'
import Link from 'next/link'
import { auth } from '@/lib/auth'

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()
  const list = await List.findById(id)
    .populate('userId', 'username')
    .populate('waters', 'name brand slug image avgRating ratingCount')
    .lean() as any

  if (!list) notFound()

  const session = await auth()
  if (!list.isPublic) {
    const sessionUserId = session?.user?.id
    const listOwnerId = (list.userId as any)?._id?.toString() ?? list.userId?.toString()
    if (!sessionUserId || sessionUserId !== listOwnerId) {
      notFound()
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">{list.title.toUpperCase()}</h1>
        {list.description && <p className="text-gray-600 text-sm mb-3">{list.description}</p>}
        <div className="text-xs text-gray-400 font-black tracking-widest">
          BY <Link href={`/profile/${list.userId?.username}`} className="text-black hover:underline">
            @{list.userId?.username}
          </Link>
          {' · '}{list.waters?.length ?? 0} WATERS
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {list.waters?.map((w: any) => (
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
