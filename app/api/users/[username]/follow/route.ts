import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await params
  await connectDB()
  const target = await User.findOne({ username })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target._id.toString() === session.user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  await User.findByIdAndUpdate(session.user.id, { $addToSet: { following: target._id } })
  await User.findByIdAndUpdate(target._id, { $addToSet: { followers: session.user.id } })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await params
  await connectDB()
  const target = await User.findOne({ username })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await User.findByIdAndUpdate(session.user.id, { $pull: { following: target._id } })
  await User.findByIdAndUpdate(target._id, { $pull: { followers: session.user.id } })
  return NextResponse.json({ success: true })
}
