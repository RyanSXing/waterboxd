import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Rating } from '@/models/Rating'
import { Water } from '@/models/Water'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await params
  const rating = await Rating.findById(id)
  if (!rating) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (rating.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const waterId = rating.waterId
  await rating.deleteOne()

  const agg = await Rating.aggregate([
    { $match: { waterId } },
    { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
  ])
  await Water.findByIdAndUpdate(waterId, {
    avgRating: agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0,
    ratingCount: agg[0]?.count ?? 0,
  })

  return NextResponse.json({ success: true })
}
