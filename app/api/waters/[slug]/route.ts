import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Water } from '@/models/Water'
import { Rating } from '@/models/Rating'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  await connectDB()
  const { slug } = await params
  const water = await Water.findOne({ slug }).lean()
  if (!water) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dist = await Rating.aggregate([
    { $match: { waterId: (water as any)._id } },
    { $group: { _id: { $floor: '$score' }, count: { $sum: 1 } } },
  ])
  const distribution: Record<string, number> = {}
  dist.forEach(d => { distribution[d._id.toString()] = d.count })

  return NextResponse.json({ water, distribution })
}
