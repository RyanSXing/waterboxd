import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Rating } from '@/models/Rating'
import { List } from '@/models/List'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  await connectDB()
  const user = await User.findOne({ username })
    .select('-passwordHash')
    .populate('wantList', 'name brand slug image')
    .lean()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ratings = await Rating.find({ userId: (user as any)._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('waterId', 'name brand slug image')
    .lean()

  const lists = await List.find({ userId: (user as any)._id, isPublic: true })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ user, ratings, lists })
}
