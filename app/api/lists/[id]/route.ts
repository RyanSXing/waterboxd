import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { List } from '@/models/List'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const list = await List.findById(id)
    .populate('userId', 'username')
    .populate('waters', 'name brand slug image avgRating ratingCount')
    .lean()
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const session = await auth()
  if (!(list as any).isPublic) {
    if (!session || (list as any).userId?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }
  return NextResponse.json(list)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()
  const list = await List.findById(id)
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (list.userId.toString() !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, isPublic } = await req.json()
  if (title) list.title = title
  if (description !== undefined) list.description = description
  if (isPublic !== undefined) list.isPublic = isPublic
  await list.save()
  return NextResponse.json(list)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()
  const list = await List.findById(id)
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (list.userId.toString() !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await list.deleteOne()
  return NextResponse.json({ success: true })
}
