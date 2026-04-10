import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Rating } from '@/models/Rating'
import { Water } from '@/models/Water'
import { DiaryEntry } from '@/models/DiaryEntry'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { waterId, score, review, drankOn } = await req.json()
  if (!waterId || !score) return NextResponse.json({ error: 'waterId and score required' }, { status: 400 })
  if (!mongoose.isValidObjectId(waterId)) {
    return NextResponse.json({ error: 'Invalid waterId' }, { status: 400 })
  }

  await connectDB()

  const existing = await Rating.findOne({ userId: session.user.id, waterId })
  let rating
  if (existing) {
    existing.score = score
    existing.review = review ?? existing.review
    existing.drankOn = drankOn ? new Date(drankOn) : existing.drankOn
    rating = await existing.save()
  } else {
    rating = await Rating.create({
      userId: session.user.id,
      waterId,
      score,
      review: review ?? '',
      drankOn: drankOn ? new Date(drankOn) : null,
    })
    // Auto-create diary entry on first rating
    await DiaryEntry.create({
      userId: session.user.id,
      waterId,
      ratingId: rating._id,
      drankOn: drankOn ? new Date(drankOn) : new Date(),
      notes: '',
    })
  }

  // Recalculate avgRating on Water
  const agg = await Rating.aggregate([
    { $match: { waterId: rating.waterId } },
    { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
  ])
  if (agg[0]) {
    await Water.findByIdAndUpdate(waterId, {
      avgRating: Math.round(agg[0].avg * 10) / 10,
      ratingCount: agg[0].count,
    })
  }

  return NextResponse.json(rating, { status: existing ? 200 : 201 })
}
