import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { List } from '@/models/List'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { waterId } = await req.json()
  if (!mongoose.isValidObjectId(waterId)) {
    return NextResponse.json({ error: 'Invalid waterId' }, { status: 400 })
  }
  await connectDB()
  const list = await List.findById(id)
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (list.userId.toString() !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await List.findByIdAndUpdate(id, { $addToSet: { waters: waterId } })
  return NextResponse.json({ success: true })
}
