import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Rating } from '@/models/Rating'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const currentUser = await User.findById(session.user.id).select('following').lean() as any
  const followingIds = currentUser?.following ?? []

  const feed = await Rating.find({ userId: { $in: followingIds } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId', 'username')
    .populate('waterId', 'name brand slug image')
    .lean()

  return NextResponse.json(feed)
}
