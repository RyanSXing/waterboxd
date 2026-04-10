import { connectDB } from '@/lib/db'
import { List } from '@/models/List'
import Link from 'next/link'
import { auth } from '@/lib/auth'

export default async function ListsPage() {
  await connectDB()
  const session = await auth()
  const lists = await List.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .populate('userId', 'username')
    .lean() as any[]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">LISTS</h1>
        {session && <Link href="/lists/new" className="btn-primary text-sm">+ NEW LIST</Link>}
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {lists.map((l: any) => (
          <Link key={l._id.toString()} href={`/lists/${l._id}`} className="card p-5 hover:shadow-[4px_4px_0_#000] transition-shadow block">
            <h2 className="font-black text-sm tracking-widest mb-1">{l.title.toUpperCase()}</h2>
            {l.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{l.description}</p>}
            <div className="flex justify-between text-xs text-gray-400 font-black tracking-widest">
              <span>@{l.userId?.username}</span>
              <span>{l.waters?.length ?? 0} WATERS</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
