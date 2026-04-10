import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Water } from '@/models/Water'
import { SortOrder } from 'mongoose'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const sort = searchParams.get('sort') ?? 'avgRating'
  const limit = Number(searchParams.get('limit') ?? 20)
  const q = searchParams.get('q')

  const filter: Record<string, any> = {}
  if (type) filter.type = type
  if (q) filter['$text'] = { $search: q }

  const sortObj: Record<string, SortOrder> = { [sort]: -1 }
  const waters = await Water.find(filter).sort(sortObj).limit(limit).lean()
  return NextResponse.json(waters)
}
