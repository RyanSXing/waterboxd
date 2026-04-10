import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { DiaryEntry } from '@/models/DiaryEntry'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const entries = await DiaryEntry.find({ userId: session.user.id })
    .sort({ drankOn: -1 })
    .populate('waterId', 'name brand slug image')
    .populate('ratingId', 'score review')
    .lean()

  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { waterId, ratingId, drankOn, notes } = await req.json()
  if (!waterId || !drankOn) return NextResponse.json({ error: 'waterId and drankOn required' }, { status: 400 })

  await connectDB()
  const entry = await DiaryEntry.create({
    userId: session.user.id,
    waterId,
    ratingId: ratingId ?? null,
    drankOn: new Date(drankOn),
    notes: notes ?? '',
  })

  return NextResponse.json(entry, { status: 201 })
}
