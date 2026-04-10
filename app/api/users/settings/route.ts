import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bio, password } = await req.json()
  if (password && password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  await connectDB()

  const update: Record<string, string> = {}
  if (bio !== undefined) update.bio = bio
  if (password) update.passwordHash = await bcrypt.hash(password, 12)

  await User.findByIdAndUpdate(session.user.id, update)
  return NextResponse.json({ success: true })
}
