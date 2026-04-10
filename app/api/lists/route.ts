import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { List } from '@/models/List'

export async function GET() {
  await connectDB()
  const lists = await List.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .populate('userId', 'username')
    .lean()
  return NextResponse.json(lists)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, isPublic } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  await connectDB()
  const list = await List.create({ userId: session.user.id, title, description: description ?? '', isPublic: isPublic ?? true })
  return NextResponse.json(list, { status: 201 })
}
