import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json()
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  await connectDB()
  const exists = await User.findOne({ $or: [{ email }, { username }] })
  if (exists) {
    return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 })
  }
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ username, email, passwordHash })
  return NextResponse.json({ id: user._id, username: user.username }, { status: 201 })
}
