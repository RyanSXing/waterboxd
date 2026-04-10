import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { List } from '@/models/List'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; waterId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, waterId } = await params
  await connectDB()
  const list = await List.findById(id)
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (list.userId.toString() !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await List.findByIdAndUpdate(id, { $pull: { waters: waterId } })
  return NextResponse.json({ success: true })
}
