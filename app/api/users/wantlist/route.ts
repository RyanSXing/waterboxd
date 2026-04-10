import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { waterId, action } = await req.json()
  if (!waterId || (action !== 'add' && action !== 'remove')) {
    return NextResponse.json({ error: 'waterId and valid action (add/remove) required' }, { status: 400 })
  }
  if (!mongoose.isValidObjectId(waterId)) {
    return NextResponse.json({ error: 'Invalid waterId' }, { status: 400 })
  }

  await connectDB()
  const update = action === 'add'
    ? { $addToSet: { wantList: waterId } }
    : { $pull: { wantList: waterId } }

  await User.findByIdAndUpdate(session.user.id, update)
  return NextResponse.json({ success: true })
}
