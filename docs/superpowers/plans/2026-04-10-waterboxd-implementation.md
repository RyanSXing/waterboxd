# Waterboxd Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full Letterboxd clone for bottled water with ratings, reviews, diary, lists, social following, and activity feed.

**Architecture:** Next.js 14 App Router monolith with API routes, MongoDB via Mongoose, NextAuth.js v5 for auth. Single repo, single deployment.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, MongoDB, Mongoose, NextAuth.js v5, bcryptjs

---

## File Map

```
waterboxd/
├── app/
│   ├── layout.tsx                        # Root layout + Navbar
│   ├── page.tsx                          # Homepage
│   ├── globals.css                       # Tailwind + brutalist base
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── waters/
│   │   ├── page.tsx                      # Browse + filter
│   │   └── [slug]/page.tsx              # Water detail
│   ├── diary/page.tsx
│   ├── lists/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── profile/[username]/page.tsx
│   ├── activity/page.tsx
│   ├── search/page.tsx
│   ├── settings/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── waters/route.ts
│       ├── waters/[slug]/route.ts
│       ├── ratings/route.ts
│       ├── ratings/[id]/route.ts
│       ├── diary/route.ts
│       ├── lists/route.ts
│       ├── lists/[id]/route.ts
│       ├── lists/[id]/waters/route.ts
│       ├── lists/[id]/waters/[waterId]/route.ts
│       ├── users/register/route.ts
│       ├── users/wantlist/route.ts
│       ├── users/[username]/route.ts
│       ├── users/[username]/follow/route.ts
│       └── activity/route.ts
├── components/
│   ├── Navbar.tsx
│   ├── StarRating.tsx
│   ├── WaterCard.tsx
│   ├── ReviewCard.tsx
│   ├── HeroBubbles.tsx
│   ├── RateModal.tsx
│   ├── WaterFilters.tsx
│   ├── RatingHistogram.tsx
│   ├── DiaryFeed.tsx
│   ├── ListCard.tsx
│   └── ProfileHeader.tsx
├── lib/
│   ├── db.ts                             # MongoDB singleton
│   ├── auth.ts                           # NextAuth config
│   └── utils.ts                          # slugify, formatRating
├── models/
│   ├── User.ts
│   ├── Water.ts
│   ├── Rating.ts
│   ├── DiaryEntry.ts
│   └── List.ts
├── scripts/
│   └── seed.ts
├── public/waters/                        # Already populated
├── tailwind.config.ts
└── .env.local
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tailwind.config.ts`, `next.config.ts`, `.env.local`, `app/globals.css`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd /Users/rsxing/waterboxd
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --yes
```

- [ ] **Step 2: Install dependencies**

```bash
npm install mongoose next-auth@beta bcryptjs
npm install -D @types/bcryptjs tsx
```

- [ ] **Step 3: Configure tailwind.config.ts**

Replace contents of `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: '#e63946', hover: '#c1121f' },
        water: '#4fc3f7',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderWidth: { '3': '3px' },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 4: Write globals.css**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }
  body { @apply bg-white text-black font-mono; }
  h1, h2, h3, h4 { @apply font-black tracking-widest uppercase; }
}

@layer components {
  .btn-primary {
    @apply bg-[#e63946] text-white font-black tracking-widest uppercase px-4 py-2 border-3 border-black hover:bg-[#c1121f] transition-colors cursor-pointer;
  }
  .btn-secondary {
    @apply bg-black text-white font-black tracking-widest uppercase px-4 py-2 border-3 border-black hover:bg-[#333] transition-colors cursor-pointer;
  }
  .btn-outline {
    @apply bg-white text-black font-black tracking-widest uppercase px-4 py-2 border-3 border-black hover:bg-black hover:text-white transition-colors cursor-pointer;
  }
  .card {
    @apply border-3 border-black bg-white;
  }
  .input {
    @apply border-3 border-black px-3 py-2 font-mono w-full focus:outline-none focus:border-[#e63946];
  }
}
```

- [ ] **Step 5: Create .env.local**

```bash
cat > .env.local << 'EOF'
MONGODB_URI=mongodb://localhost:27017/waterboxd
NEXTAUTH_SECRET=replace-with-random-32-char-string
NEXTAUTH_URL=http://localhost:3000
EOF
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with brutalist Tailwind config"
```

---

## Task 2: MongoDB Models

**Files:**
- Create: `lib/db.ts`, `models/User.ts`, `models/Water.ts`, `models/Rating.ts`, `models/DiaryEntry.ts`, `models/List.ts`

- [ ] **Step 1: Create lib/db.ts**

```ts
// lib/db.ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error('MONGODB_URI not set')

let cached = (global as any).mongoose ?? { conn: null, promise: null }
;(global as any).mongoose = cached

export async function connectDB() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then(m => m)
  }
  cached.conn = await cached.promise
  return cached.conn
}
```

- [ ] **Step 2: Create models/User.ts**

```ts
// models/User.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  username: string
  email: string
  passwordHash: string
  avatar: string
  bio: string
  createdAt: Date
  following: mongoose.Types.ObjectId[]
  followers: mongoose.Types.ObjectId[]
  wantList: mongoose.Types.ObjectId[]
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  avatar:   { type: String, default: '' },
  bio:      { type: String, default: '' },
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  wantList:  [{ type: Schema.Types.ObjectId, ref: 'Water' }],
}, { timestamps: true })

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model('User', UserSchema)
```

- [ ] **Step 3: Create models/Water.ts**

```ts
// models/Water.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IWater extends Document {
  slug: string
  name: string
  brand: string
  image: string
  type: 'still' | 'sparkling' | 'mineral' | 'alkaline'
  country: string
  sourceRegion: string
  ph: number | null
  tds: number | null
  hardness: 'soft' | 'medium' | 'hard' | null
  packaging: 'plastic' | 'glass' | 'aluminum' | 'carton'
  priceTier: 'budget' | 'mid' | 'premium' | 'luxury'
  carbonationLevel: 'light' | 'medium' | 'heavy' | null
  avgRating: number
  ratingCount: number
}

const WaterSchema = new Schema<IWater>({
  slug:        { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  brand:       { type: String, required: true },
  image:       { type: String, required: true },
  type:        { type: String, enum: ['still','sparkling','mineral','alkaline'], required: true },
  country:     { type: String, required: true },
  sourceRegion:{ type: String, default: '' },
  ph:          { type: Number, default: null },
  tds:         { type: Number, default: null },
  hardness:    { type: String, enum: ['soft','medium','hard',null], default: null },
  packaging:   { type: String, enum: ['plastic','glass','aluminum','carton'], required: true },
  priceTier:   { type: String, enum: ['budget','mid','premium','luxury'], required: true },
  carbonationLevel: { type: String, enum: ['light','medium','heavy',null], default: null },
  avgRating:   { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true })

WaterSchema.index({ name: 'text', brand: 'text' })

export const Water: Model<IWater> = mongoose.models.Water ?? mongoose.model('Water', WaterSchema)
```

- [ ] **Step 4: Create models/Rating.ts**

```ts
// models/Rating.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRating extends Document {
  userId: mongoose.Types.ObjectId
  waterId: mongoose.Types.ObjectId
  score: number
  review: string
  drankOn: Date | null
  createdAt: Date
}

const RatingSchema = new Schema<IRating>({
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  waterId: { type: Schema.Types.ObjectId, ref: 'Water', required: true },
  score:   { type: Number, required: true, min: 0.5, max: 5 },
  review:  { type: String, default: '' },
  drankOn: { type: Date, default: null },
}, { timestamps: true })

RatingSchema.index({ userId: 1, waterId: 1 }, { unique: true })

export const Rating: Model<IRating> = mongoose.models.Rating ?? mongoose.model('Rating', RatingSchema)
```

- [ ] **Step 5: Create models/DiaryEntry.ts**

```ts
// models/DiaryEntry.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDiaryEntry extends Document {
  userId: mongoose.Types.ObjectId
  waterId: mongoose.Types.ObjectId
  ratingId: mongoose.Types.ObjectId | null
  drankOn: Date
  notes: string
  createdAt: Date
}

const DiaryEntrySchema = new Schema<IDiaryEntry>({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  waterId:  { type: Schema.Types.ObjectId, ref: 'Water', required: true },
  ratingId: { type: Schema.Types.ObjectId, ref: 'Rating', default: null },
  drankOn:  { type: Date, required: true },
  notes:    { type: String, default: '' },
}, { timestamps: true })

export const DiaryEntry: Model<IDiaryEntry> = mongoose.models.DiaryEntry ?? mongoose.model('DiaryEntry', DiaryEntrySchema)
```

- [ ] **Step 6: Create models/List.ts**

```ts
// models/List.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IList extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  description: string
  waters: mongoose.Types.ObjectId[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

const ListSchema = new Schema<IList>({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  waters:      [{ type: Schema.Types.ObjectId, ref: 'Water' }],
  isPublic:    { type: Boolean, default: true },
}, { timestamps: true })

export const List: Model<IList> = mongoose.models.List ?? mongoose.model('List', ListSchema)
```

- [ ] **Step 7: Create lib/utils.ts**

```ts
// lib/utils.ts
export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function formatRating(r: number): string {
  return r.toFixed(1)
}

export function starsDisplay(score: number): string {
  const full = Math.floor(score)
  const half = score % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add MongoDB models and db connection"
```

---

## Task 3: Seed Script

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Create scripts/seed.ts**

```ts
// scripts/seed.ts
import { connectDB } from '../lib/db'
import { Water } from '../models/Water'
import { slugify } from '../lib/utils'

const waters = [
  {
    name: 'Evian Natural Spring Water',
    brand: 'Evian',
    image: 'Core_Range_-_EVIAN-500ML-BOTTLE.png',
    type: 'still' as const,
    country: 'France',
    sourceRegion: 'French Alps',
    ph: 7.2,
    tds: 309,
    hardness: 'hard' as const,
    packaging: 'plastic' as const,
    priceTier: 'premium' as const,
    carbonationLevel: null,
  },
  {
    name: 'Fiji Natural Artesian Water',
    brand: 'Fiji',
    image: 'fiji.webp',
    type: 'still' as const,
    country: 'Fiji',
    sourceRegion: 'Viti Levu Island',
    ph: 7.7,
    tds: 222,
    hardness: 'soft' as const,
    packaging: 'plastic' as const,
    priceTier: 'premium' as const,
    carbonationLevel: null,
  },
  {
    name: 'VOSS Sparkling Water',
    brand: 'VOSS',
    image: 'Voss-Sprk-.37L.webp',
    type: 'sparkling' as const,
    country: 'Norway',
    sourceRegion: 'Iveland',
    ph: 6.0,
    tds: 44,
    hardness: 'soft' as const,
    packaging: 'glass' as const,
    priceTier: 'luxury' as const,
    carbonationLevel: 'medium' as const,
  },
  {
    name: 'Smartwater Vapor Distilled',
    brand: 'Smartwater',
    image: 'smartwater.webp',
    type: 'still' as const,
    country: 'USA',
    sourceRegion: 'Various',
    ph: 7.0,
    tds: 0,
    hardness: 'soft' as const,
    packaging: 'plastic' as const,
    priceTier: 'mid' as const,
    carbonationLevel: null,
  },
  {
    name: 'Saratoga Sparkling Spring Water',
    brand: 'Saratoga',
    image: 'Saratoga-300mL.webp',
    type: 'sparkling' as const,
    country: 'USA',
    sourceRegion: 'Saratoga Springs, NY',
    ph: 6.8,
    tds: 115,
    hardness: 'medium' as const,
    packaging: 'glass' as const,
    priceTier: 'premium' as const,
    carbonationLevel: 'light' as const,
  },
  {
    name: 'Liquid Death Mountain Water',
    brand: 'Liquid Death',
    image: 'liquid death.webp',
    type: 'still' as const,
    country: 'USA',
    sourceRegion: 'Austrian Alps',
    ph: 8.0,
    tds: 120,
    hardness: 'medium' as const,
    packaging: 'aluminum' as const,
    priceTier: 'mid' as const,
    carbonationLevel: null,
  },
  {
    name: 'Box Water',
    brand: 'Box Water Is Better',
    image: 'box water.avif',
    type: 'still' as const,
    country: 'USA',
    sourceRegion: 'Municipal',
    ph: 7.4,
    tds: 50,
    hardness: 'soft' as const,
    packaging: 'carton' as const,
    priceTier: 'mid' as const,
    carbonationLevel: null,
  },
]

async function seed() {
  await connectDB()
  await Water.deleteMany({})
  const docs = waters.map(w => ({ ...w, slug: slugify(w.brand + ' ' + w.name) }))
  await Water.insertMany(docs)
  console.log(`Seeded ${docs.length} waters`)
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 2: Add seed script to package.json**

Add to the `scripts` section in `package.json`:
```json
"seed": "tsx scripts/seed.ts"
```

- [ ] **Step 3: Start MongoDB and run seed**

```bash
# Make sure MongoDB is running locally, then:
npm run seed
```

Expected output: `Seeded 7 waters`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add water seed script with 7 brands"
```

---

## Task 4: NextAuth + Registration API

**Files:**
- Create: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/users/register/route.ts`

- [ ] **Step 1: Create lib/auth.ts**

```ts
// lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from './db'
import { User } from '../models/User'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await connectDB()
        const user = await User.findOne({ email: credentials.email })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid) return null
        return { id: user._id.toString(), name: user.username, email: user.email }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string
      return session
    },
  },
  pages: { signIn: '/sign-in' },
})
```

- [ ] **Step 2: Create app/api/auth/[...nextauth]/route.ts**

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

- [ ] **Step 3: Create app/api/users/register/route.ts**

```ts
// app/api/users/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json()
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
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
```

- [ ] **Step 4: Add types/next-auth.d.ts for session augmentation**

```ts
// types/next-auth.d.ts
import 'next-auth'
declare module 'next-auth' {
  interface Session {
    user: { id: string; name: string; email: string }
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add NextAuth credentials provider and registration API"
```

---

## Task 5: Navbar + Root Layout

**Files:**
- Create: `components/Navbar.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create components/Navbar.tsx**

```tsx
// components/Navbar.tsx
'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-black text-white border-b-3 border-[#e63946] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-black text-lg tracking-[6px] text-white hover:text-[#e63946] transition-colors">
          WATERBOXD
        </Link>
        <div className="flex items-center gap-6 text-xs font-black tracking-widest">
          <Link href="/waters" className="text-gray-300 hover:text-white transition-colors">WATERS</Link>
          <Link href="/lists" className="text-gray-300 hover:text-white transition-colors">LISTS</Link>
          <Link href="/search" className="text-gray-300 hover:text-white transition-colors">SEARCH</Link>
          {session ? (
            <>
              <Link href="/diary" className="text-gray-300 hover:text-white transition-colors">DIARY</Link>
              <Link href="/activity" className="text-gray-300 hover:text-white transition-colors">ACTIVITY</Link>
              <Link href={`/profile/${session.user.name}`} className="text-gray-300 hover:text-white transition-colors">
                {session.user.name?.toUpperCase()}
              </Link>
              <button onClick={() => signOut()} className="text-gray-400 hover:text-[#e63946] transition-colors">
                SIGN OUT
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-gray-300 hover:text-white transition-colors">SIGN IN</Link>
              <Link href="/sign-up" className="btn-primary text-xs">JOIN</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Update app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import './globals.css'

const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Waterboxd',
  description: 'Track. Rate. Hydrate.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${mono.variable} font-mono`}>
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Navbar and root layout with SessionProvider"
```

---

## Task 6: Homepage + Bubble Animation

**Files:**
- Create: `components/HeroBubbles.tsx`, `components/WaterCard.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create components/HeroBubbles.tsx**

```tsx
// components/HeroBubbles.tsx
'use client'
import { useEffect, useRef } from 'react'

export default function HeroBubbles() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const bubbles: HTMLDivElement[] = []

    for (let i = 0; i < 22; i++) {
      const b = document.createElement('div')
      const size = 6 + Math.random() * 20
      const duration = 4 + Math.random() * 7
      const delay = Math.random() * 8
      const left = Math.random() * 100

      b.style.cssText = `
        position:absolute;
        width:${size}px;
        height:${size}px;
        left:${left}%;
        bottom:-30px;
        border-radius:50%;
        background:rgba(79,195,247,0.25);
        border:1px solid rgba(79,195,247,0.5);
        animation:rise ${duration}s ${delay}s linear infinite;
        pointer-events:none;
      `
      container.appendChild(b)
      bubbles.push(b)
    }

    return () => bubbles.forEach(b => b.remove())
  }, [])

  return (
    <>
      <style>{`
        @keyframes rise {
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 0.6; }
          100% { transform: translateY(-420px) scale(1.3); opacity: 0; }
        }
      `}</style>
      <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" />
    </>
  )
}
```

- [ ] **Step 2: Create components/WaterCard.tsx**

```tsx
// components/WaterCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { starsDisplay } from '@/lib/utils'

interface Props {
  slug: string
  name: string
  brand: string
  image: string
  avgRating: number
  ratingCount: number
}

export default function WaterCard({ slug, name, brand, image, avgRating, ratingCount }: Props) {
  return (
    <Link href={`/waters/${slug}`} className="card block hover:shadow-[4px_4px_0_#000] transition-shadow group">
      <div className="bg-gray-50 flex items-end justify-center h-40 p-4 border-b-3 border-black overflow-hidden">
        <Image
          src={`/waters/${image}`}
          alt={name}
          width={80}
          height={140}
          className="object-contain h-full w-auto group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="p-3">
        <div className="font-black text-xs tracking-widest truncate">{brand.toUpperCase()}</div>
        <div className="text-xs text-gray-600 truncate">{name}</div>
        {avgRating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[#e63946] text-xs">{starsDisplay(avgRating)}</span>
            <span className="text-gray-400 text-xs">({ratingCount})</span>
          </div>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Create app/api/waters/route.ts**

```ts
// app/api/waters/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Water } from '@/models/Water'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const sort = searchParams.get('sort') ?? 'avgRating'
  const limit = Number(searchParams.get('limit') ?? 20)

  const filter: Record<string, string> = {}
  if (type) filter.type = type

  const sortObj: Record<string, number> = { [sort]: -1 }
  const waters = await Water.find(filter).sort(sortObj).limit(limit).lean()
  return NextResponse.json(waters)
}
```

- [ ] **Step 4: Create app/page.tsx**

```tsx
// app/page.tsx
import Link from 'next/link'
import HeroBubbles from '@/components/HeroBubbles'
import WaterCard from '@/components/WaterCard'
import { connectDB } from '@/lib/db'
import { Water } from '@/models/Water'
import { Rating } from '@/models/Rating'

async function getPopularWaters() {
  await connectDB()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recent = await Rating.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: '$waterId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ])
  if (recent.length > 0) {
    const ids = recent.map(r => r._id)
    return Water.find({ _id: { $in: ids } }).lean()
  }
  return Water.find().sort({ avgRating: -1 }).limit(10).lean()
}

async function getRecentReviews() {
  await connectDB()
  return Rating.find({ review: { $ne: '' } })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('userId', 'username')
    .populate('waterId', 'name brand slug')
    .lean()
}

export default async function HomePage() {
  const [waters, reviews] = await Promise.all([getPopularWaters(), getRecentReviews()])

  return (
    <div>
      {/* HERO */}
      <section className="bg-black relative overflow-hidden min-h-[340px] flex items-center border-b-3 border-black">
        <HeroBubbles />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
          <div className="text-[#e63946] text-xs font-black tracking-[4px] mb-3">TRACK. RATE. HYDRATE.</div>
          <h1 className="text-white text-4xl md:text-6xl font-black tracking-widest leading-none mb-4">
            THE SOCIAL NETWORK<br />FOR WATER DRINKERS.
          </h1>
          <p className="text-gray-400 text-sm mb-8 max-w-md">
            Rate every bottle. Keep a hydration diary. Find your perfect water.
          </p>
          <Link href="/sign-up" className="btn-primary inline-block text-sm">
            GET STARTED →
          </Link>
        </div>
      </section>

      {/* POPULAR THIS WEEK */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-b-3 border-black">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl tracking-widest">POPULAR THIS WEEK</h2>
          <Link href="/waters" className="text-[#e63946] text-xs font-black tracking-widest hover:underline">
            ALL WATERS →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {waters.map((w: any) => (
            <WaterCard
              key={w._id.toString()}
              slug={w.slug}
              name={w.name}
              brand={w.brand}
              image={w.image}
              avgRating={w.avgRating}
              ratingCount={w.ratingCount}
            />
          ))}
        </div>
      </section>

      {/* RECENT REVIEWS */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl tracking-widest mb-6">RECENT REVIEWS</h2>
        <div className="space-y-4">
          {reviews.length === 0 && (
            <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
          )}
          {reviews.map((r: any) => (
            <div key={r._id.toString()} className="border-l-3 border-[#e63946] pl-4">
              <div className="text-sm">
                <Link href={`/profile/${r.userId?.username}`} className="font-black hover:underline">
                  @{r.userId?.username}
                </Link>
                {' drank '}
                <Link href={`/waters/${r.waterId?.slug}`} className="font-black hover:underline">
                  {r.waterId?.brand} {r.waterId?.name}
                </Link>
                <span className="text-[#e63946] ml-2 text-xs">{Array(Math.round(r.score)).fill('★').join('')}</span>
              </div>
              {r.review && <p className="text-gray-600 text-xs mt-1 italic">"{r.review}"</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Verify homepage renders**

```bash
npm run dev
# Visit http://localhost:3000
```

Expected: Black hero with rising bubbles, water grid below, reviews section.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: homepage with bubble animation, popular waters, recent reviews"
```

---

## Task 7: Waters Browse + Detail Pages

**Files:**
- Create: `app/waters/page.tsx`, `app/waters/[slug]/page.tsx`, `app/api/waters/[slug]/route.ts`, `components/RatingHistogram.tsx`

- [ ] **Step 1: Create app/waters/page.tsx**

```tsx
// app/waters/page.tsx
import { connectDB } from '@/lib/db'
import { Water } from '@/models/Water'
import WaterCard from '@/components/WaterCard'
import Link from 'next/link'

const TYPES = ['all', 'still', 'sparkling', 'mineral', 'alkaline']
const SORT_OPTIONS = [
  { value: 'avgRating', label: 'TOP RATED' },
  { value: 'ratingCount', label: 'MOST REVIEWED' },
  { value: 'createdAt', label: 'NEWEST' },
]

export default async function WatersPage({
  searchParams,
}: {
  searchParams: { type?: string; sort?: string }
}) {
  await connectDB()
  const type = searchParams.type ?? 'all'
  const sort = searchParams.sort ?? 'avgRating'

  const filter: Record<string, string> = {}
  if (type !== 'all') filter.type = type

  const waters = await Water.find(filter).sort({ [sort]: -1 }).lean()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">ALL WATERS</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 border-b-3 border-black pb-6">
        <div className="flex gap-2">
          {TYPES.map(t => (
            <Link
              key={t}
              href={`/waters?type=${t}&sort=${sort}`}
              className={`text-xs font-black tracking-widest px-3 py-2 border-3 border-black transition-colors ${
                type === t ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'
              }`}
            >
              {t.toUpperCase()}
            </Link>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {SORT_OPTIONS.map(s => (
            <Link
              key={s.value}
              href={`/waters?type=${type}&sort=${s.value}`}
              className={`text-xs font-black tracking-widest px-3 py-2 border-3 border-black transition-colors ${
                sort === s.value ? 'bg-[#e63946] text-white border-[#e63946]' : 'bg-white hover:bg-black hover:text-white'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {waters.map((w: any) => (
          <WaterCard
            key={w._id.toString()}
            slug={w.slug}
            name={w.name}
            brand={w.brand}
            image={w.image}
            avgRating={w.avgRating}
            ratingCount={w.ratingCount}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create components/RatingHistogram.tsx**

```tsx
// components/RatingHistogram.tsx
interface Props {
  distribution: Record<string, number>
  total: number
}

export default function RatingHistogram({ distribution, total }: Props) {
  const bars = ['5', '4', '3', '2', '1']
  return (
    <div className="space-y-1">
      {bars.map(star => {
        const count = distribution[star] ?? 0
        const pct = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-4 text-right font-black">{star}</span>
            <span className="text-[#e63946]">★</span>
            <div className="flex-1 bg-gray-200 border border-black h-3">
              <div className="bg-[#e63946] h-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-gray-500">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create app/api/waters/[slug]/route.ts**

```ts
// app/api/waters/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Water } from '@/models/Water'
import { Rating } from '@/models/Rating'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  await connectDB()
  const water = await Water.findOne({ slug: params.slug }).lean()
  if (!water) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dist = await Rating.aggregate([
    { $match: { waterId: (water as any)._id } },
    { $group: { _id: { $floor: '$score' }, count: { $sum: 1 } } },
  ])
  const distribution: Record<string, number> = {}
  dist.forEach(d => { distribution[d._id.toString()] = d.count })

  return NextResponse.json({ water, distribution })
}
```

- [ ] **Step 4: Create app/waters/[slug]/page.tsx**

```tsx
// app/waters/[slug]/page.tsx
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Water } from '@/models/Water'
import { Rating } from '@/models/Rating'
import RatingHistogram from '@/components/RatingHistogram'
import { starsDisplay, formatRating } from '@/lib/utils'

export default async function WaterDetailPage({ params }: { params: { slug: string } }) {
  await connectDB()
  const water = await Water.findOne({ slug: params.slug }).lean() as any
  if (!water) notFound()

  const reviews = await Rating.find({ waterId: water._id, review: { $ne: '' } })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('userId', 'username')
    .lean()

  const dist = await Rating.aggregate([
    { $match: { waterId: water._id } },
    { $group: { _id: { $floor: '$score' }, count: { $sum: 1 } } },
  ])
  const distribution: Record<string, number> = {}
  dist.forEach((d: any) => { distribution[d._id.toString()] = d.count })

  const META_ROWS = [
    { label: 'TYPE', value: water.type?.toUpperCase() },
    { label: 'COUNTRY', value: water.country },
    { label: 'SOURCE', value: water.sourceRegion },
    { label: 'PH', value: water.ph != null ? water.ph.toString() : '—' },
    { label: 'TDS', value: water.tds != null ? `${water.tds} mg/L` : '—' },
    { label: 'HARDNESS', value: water.hardness?.toUpperCase() ?? '—' },
    { label: 'PACKAGING', value: water.packaging?.toUpperCase() },
    { label: 'PRICE', value: water.priceTier?.toUpperCase() },
    ...(water.carbonationLevel ? [{ label: 'CARBONATION', value: water.carbonationLevel.toUpperCase() }] : []),
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-[200px_1fr] gap-10">
        {/* Bottle image */}
        <div className="flex flex-col items-center gap-4">
          <div className="card w-full flex items-end justify-center h-64 p-6 bg-gray-50">
            <Image
              src={`/waters/${water.image}`}
              alt={water.name}
              width={120}
              height={220}
              className="object-contain h-full w-auto"
            />
          </div>
          <button className="btn-primary w-full text-sm">RATE THIS WATER</button>
          <button className="btn-outline w-full text-sm">+ WANTLIST</button>
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl mb-1">{water.brand.toUpperCase()}</h1>
          <h2 className="text-lg font-normal text-gray-600 mb-6 uppercase tracking-widest">{water.name}</h2>

          {/* Rating summary */}
          <div className="card p-6 mb-6">
            <div className="flex items-end gap-4 mb-4">
              <div className="text-5xl font-black">{water.avgRating > 0 ? formatRating(water.avgRating) : '—'}</div>
              <div>
                <div className="text-[#e63946] text-xl">{water.avgRating > 0 ? starsDisplay(water.avgRating) : '☆☆☆☆☆'}</div>
                <div className="text-gray-400 text-xs">{water.ratingCount} RATINGS</div>
              </div>
            </div>
            <RatingHistogram distribution={distribution} total={water.ratingCount} />
          </div>

          {/* Metadata */}
          <div className="card mb-6">
            {META_ROWS.map(row => (
              <div key={row.label} className="flex border-b border-gray-200 last:border-0 px-4 py-2">
                <span className="text-xs font-black tracking-widest text-gray-500 w-32">{row.label}</span>
                <span className="text-xs font-black">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-10">
        <h2 className="text-xl mb-6">REVIEWS</h2>
        {reviews.length === 0 && <p className="text-gray-400 text-sm">No reviews yet.</p>}
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r._id.toString()} className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-black text-sm">@{r.userId?.username}</span>
                <span className="text-[#e63946] text-xs">{starsDisplay(r.score)}</span>
                <span className="text-gray-400 text-xs ml-auto">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{r.review}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Verify water pages**

```bash
npm run dev
# Visit http://localhost:3000/waters
# Click a water card
```

Expected: Browse page with filters, detail page with bottle image, metadata, histogram.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: waters browse and detail pages with rating histogram"
```

---

## Task 8: Star Rating Component + Rating API

**Files:**
- Create: `components/StarRating.tsx`, `components/RateModal.tsx`, `app/api/ratings/route.ts`, `app/api/ratings/[id]/route.ts`

- [ ] **Step 1: Create components/StarRating.tsx**

```tsx
// components/StarRating.tsx
'use client'
import { useState } from 'react'

interface Props {
  value: number
  onChange: (val: number) => void
  size?: 'sm' | 'lg'
}

export default function StarRating({ value, onChange, size = 'lg' }: Props) {
  const [hover, setHover] = useState(0)
  const starSize = size === 'lg' ? 'text-3xl' : 'text-xl'

  return (
    <div className="flex gap-0">
      {[1, 2, 3, 4, 5].map(star => (
        <div key={star} className="relative cursor-pointer">
          {/* Half star */}
          <span
            className={`${starSize} select-none`}
            style={{ color: (hover || value) >= star - 0.5 ? '#e63946' : '#d1d5db' }}
            onMouseEnter={() => setHover(star - 0.5)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star - 0.5)}
          >
            ★
          </span>
          {/* Full star overlay (right half) */}
          <span
            className={`${starSize} select-none absolute top-0 left-0 w-full overflow-hidden`}
            style={{
              color: (hover || value) >= star ? '#e63946' : 'transparent',
              WebkitTextStroke: '0px',
              clipPath: 'inset(0 0 0 50%)',
            }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
          >
            ★
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create app/api/ratings/route.ts**

```ts
// app/api/ratings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Rating } from '@/models/Rating'
import { Water } from '@/models/Water'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { waterId, score, review, drankOn } = await req.json()
  if (!waterId || !score) return NextResponse.json({ error: 'waterId and score required' }, { status: 400 })

  await connectDB()

  const existing = await Rating.findOne({ userId: session.user.id, waterId })
  let rating
  if (existing) {
    existing.score = score
    existing.review = review ?? existing.review
    existing.drankOn = drankOn ? new Date(drankOn) : existing.drankOn
    rating = await existing.save()
  } else {
    rating = await Rating.create({
      userId: session.user.id,
      waterId,
      score,
      review: review ?? '',
      drankOn: drankOn ? new Date(drankOn) : null,
    })
  }

  // Recalculate avgRating on Water
  const agg = await Rating.aggregate([
    { $match: { waterId: rating.waterId } },
    { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
  ])
  if (agg[0]) {
    await Water.findByIdAndUpdate(waterId, {
      avgRating: Math.round(agg[0].avg * 10) / 10,
      ratingCount: agg[0].count,
    })
  }

  return NextResponse.json(rating, { status: existing ? 200 : 201 })
}
```

- [ ] **Step 3: Create app/api/ratings/[id]/route.ts**

```ts
// app/api/ratings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Rating } from '@/models/Rating'
import { Water } from '@/models/Water'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const rating = await Rating.findById(params.id)
  if (!rating) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (rating.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const waterId = rating.waterId
  await rating.deleteOne()

  const agg = await Rating.aggregate([
    { $match: { waterId } },
    { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
  ])
  await Water.findByIdAndUpdate(waterId, {
    avgRating: agg[0]?.avg ?? 0,
    ratingCount: agg[0]?.count ?? 0,
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: Create components/RateModal.tsx**

```tsx
// components/RateModal.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import StarRating from './StarRating'

interface Props {
  waterId: string
  waterName: string
  existingRating?: { id: string; score: number; review: string }
  onClose: () => void
}

export default function RateModal({ waterId, waterName, existingRating, onClose }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [score, setScore] = useState(existingRating?.score ?? 0)
  const [review, setReview] = useState(existingRating?.review ?? '')
  const [drankOn, setDrankOn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!session) return null

  async function submit() {
    if (!score) { setError('Select a rating'); return }
    setLoading(true)
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waterId, score, review, drankOn }),
    })
    if (!res.ok) { setError('Failed to save rating'); setLoading(false); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-lg">RATE WATER</h2>
          <button onClick={onClose} className="font-black text-gray-400 hover:text-black">✕</button>
        </div>
        <p className="text-sm text-gray-600 mb-4 uppercase tracking-widest">{waterName}</p>
        <div className="mb-4">
          <StarRating value={score} onChange={setScore} />
        </div>
        <textarea
          className="input mb-4 resize-none h-24"
          placeholder="Write a review... (optional)"
          value={review}
          onChange={e => setReview(e.target.value)}
        />
        <div className="mb-4">
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">DRANK ON</label>
          <input type="date" className="input" value={drankOn} onChange={e => setDrankOn(e.target.value)} />
        </div>
        {error && <p className="text-[#e63946] text-xs mb-3">{error}</p>}
        <button onClick={submit} disabled={loading} className="btn-primary w-full">
          {loading ? 'SAVING...' : 'SAVE RATING'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Wire RateModal into water detail page**

In `app/waters/[slug]/page.tsx`, convert the "RATE THIS WATER" button area to a Client Component wrapper:

Create `app/waters/[slug]/RateButton.tsx`:

```tsx
// app/waters/[slug]/RateButton.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import RateModal from '@/components/RateModal'

interface Props {
  waterId: string
  waterName: string
}

export default function RateButton({ waterId, waterName }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (!session) {
    return (
      <a href="/sign-in" className="btn-primary w-full text-sm block text-center">
        SIGN IN TO RATE
      </a>
    )
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary w-full text-sm">
        RATE THIS WATER
      </button>
      {open && (
        <RateModal
          waterId={waterId}
          waterName={waterName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
```

Then import `RateButton` in the water detail page and replace the static button.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: star rating component, rate modal, and ratings API"
```

---

## Task 9: Sign In / Sign Up Pages

**Files:**
- Create: `app/sign-in/page.tsx`, `app/sign-up/page.tsx`

- [ ] **Step 1: Create app/sign-in/page.tsx**

```tsx
// app/sign-in/page.tsx
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.error) { setError('Invalid email or password'); setLoading(false); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-sm">
        <h1 className="text-2xl mb-8 text-center">SIGN IN</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">EMAIL</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">PASSWORD</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-[#e63946] text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-6">
          No account?{' '}
          <Link href="/sign-up" className="font-black underline">JOIN FREE</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create app/sign-up/page.tsx**

```tsx
// app/sign-up/page.tsx
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Registration failed')
      setLoading(false)
      return
    }
    await signIn('credentials', { email, password, redirect: false })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-sm">
        <h1 className="text-2xl mb-8 text-center">JOIN WATERBOXD</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">USERNAME</label>
            <input type="text" className="input" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">EMAIL</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">PASSWORD</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          {error && <p className="text-[#e63946] text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-black underline">SIGN IN</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify auth flow**

```bash
# Visit http://localhost:3000/sign-up
# Create a test account
# Sign out, then sign back in at /sign-in
```

Expected: Navbar shows username after sign-in.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: sign in and sign up pages"
```

---

## Task 10: User Profile + Follow API

**Files:**
- Create: `app/profile/[username]/page.tsx`, `app/api/users/[username]/route.ts`, `app/api/users/[username]/follow/route.ts`, `components/ProfileHeader.tsx`

- [ ] **Step 1: Create app/api/users/[username]/route.ts**

```ts
// app/api/users/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Rating } from '@/models/Rating'
import { List } from '@/models/List'

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  await connectDB()
  const user = await User.findOne({ username: params.username })
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
```

- [ ] **Step 2: Create app/api/users/[username]/follow/route.ts**

```ts
// app/api/users/[username]/follow/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function POST(_req: NextRequest, { params }: { params: { username: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const target = await User.findOne({ username: params.username })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target._id.toString() === session.user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  await User.findByIdAndUpdate(session.user.id, { $addToSet: { following: target._id } })
  await User.findByIdAndUpdate(target._id, { $addToSet: { followers: session.user.id } })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { username: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const target = await User.findOne({ username: params.username })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await User.findByIdAndUpdate(session.user.id, { $pull: { following: target._id } })
  await User.findByIdAndUpdate(target._id, { $pull: { followers: session.user.id } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Create components/ProfileHeader.tsx**

```tsx
// components/ProfileHeader.tsx
'use client'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  username: string
  bio: string
  followingCount: number
  followersCount: number
  ratingCount: number
  isFollowing: boolean
}

export default function ProfileHeader({ username, bio, followingCount, followersCount, ratingCount, isFollowing }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [following, setFollowing] = useState(isFollowing)
  const [loading, setLoading] = useState(false)
  const isOwn = session?.user?.name === username

  async function toggleFollow() {
    if (!session) { router.push('/sign-in'); return }
    setLoading(true)
    const method = following ? 'DELETE' : 'POST'
    await fetch(`/api/users/${username}/follow`, { method })
    setFollowing(!following)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="border-b-3 border-black pb-8 mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">@{username.toUpperCase()}</h1>
          {bio && <p className="text-gray-600 text-sm mb-4">{bio}</p>}
          <div className="flex gap-6 text-xs font-black tracking-widest text-gray-500">
            <span><strong className="text-black">{ratingCount}</strong> RATINGS</span>
            <span><strong className="text-black">{followersCount}</strong> FOLLOWERS</span>
            <span><strong className="text-black">{followingCount}</strong> FOLLOWING</span>
          </div>
        </div>
        {!isOwn && session && (
          <button onClick={toggleFollow} disabled={loading} className={following ? 'btn-outline' : 'btn-primary'}>
            {loading ? '...' : following ? 'FOLLOWING' : 'FOLLOW'}
          </button>
        )}
        {isOwn && (
          <a href="/settings" className="btn-outline text-xs">EDIT PROFILE</a>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create app/profile/[username]/page.tsx**

```tsx
// app/profile/[username]/page.tsx
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Rating } from '@/models/Rating'
import { List } from '@/models/List'
import ProfileHeader from '@/components/ProfileHeader'
import WaterCard from '@/components/WaterCard'
import { starsDisplay } from '@/lib/utils'
import Link from 'next/link'

export default async function ProfilePage({ params }: { params: { username: string } }) {
  await connectDB()
  const session = await auth()

  const user = await User.findOne({ username: params.username }).select('-passwordHash').lean() as any
  if (!user) notFound()

  const ratings = await Rating.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(24)
    .populate('waterId', 'name brand slug image avgRating ratingCount')
    .lean()

  const lists = await List.find({ userId: user._id, isPublic: true }).sort({ createdAt: -1 }).lean()
  const ratingCount = await Rating.countDocuments({ userId: user._id })

  const isFollowing = session
    ? user.followers?.some((id: any) => id.toString() === session.user.id)
    : false

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <ProfileHeader
        username={user.username}
        bio={user.bio}
        followingCount={user.following?.length ?? 0}
        followersCount={user.followers?.length ?? 0}
        ratingCount={ratingCount}
        isFollowing={isFollowing}
      />

      <h2 className="text-xl mb-4">RECENT RATINGS</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-12">
        {ratings.map((r: any) => (
          <div key={r._id.toString()} className="relative">
            <WaterCard
              slug={r.waterId?.slug}
              name={r.waterId?.name}
              brand={r.waterId?.brand}
              image={r.waterId?.image}
              avgRating={r.waterId?.avgRating}
              ratingCount={r.waterId?.ratingCount}
            />
            <div className="text-[#e63946] text-xs text-center mt-1">{starsDisplay(r.score)}</div>
          </div>
        ))}
      </div>

      {lists.length > 0 && (
        <>
          <h2 className="text-xl mb-4">LISTS</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {lists.map((l: any) => (
              <Link key={l._id.toString()} href={`/lists/${l._id}`} className="card p-4 hover:shadow-[4px_4px_0_#000] transition-shadow">
                <div className="font-black text-sm tracking-widest mb-1">{l.title.toUpperCase()}</div>
                <div className="text-xs text-gray-500">{l.waters?.length ?? 0} WATERS</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: user profile page with follow/unfollow"
```

---

## Task 11: Diary

**Files:**
- Create: `app/diary/page.tsx`, `app/api/diary/route.ts`

- [ ] **Step 1: Create app/api/diary/route.ts**

```ts
// app/api/diary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { DiaryEntry } from '@/models/DiaryEntry'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const entries = await DiaryEntry.find({ userId: session.user.id })
    .sort({ drankOn: -1 })
    .populate('waterId', 'name brand slug image')
    .populate('ratingId', 'score review')
    .lean()

  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { waterId, ratingId, drankOn, notes } = await req.json()
  if (!waterId || !drankOn) return NextResponse.json({ error: 'waterId and drankOn required' }, { status: 400 })

  await connectDB()
  const entry = await DiaryEntry.create({
    userId: session.user.id,
    waterId,
    ratingId: ratingId ?? null,
    drankOn: new Date(drankOn),
    notes: notes ?? '',
  })

  return NextResponse.json(entry, { status: 201 })
}
```

- [ ] **Step 2: Create app/diary/page.tsx**

```tsx
// app/diary/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { DiaryEntry } from '@/models/DiaryEntry'
import { starsDisplay } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export default async function DiaryPage() {
  const session = await auth()
  if (!session) redirect('/sign-in')

  await connectDB()
  const entries = await DiaryEntry.find({ userId: session.user.id })
    .sort({ drankOn: -1 })
    .populate('waterId', 'name brand slug image')
    .populate('ratingId', 'score review')
    .lean() as any[]

  // Group by month
  const grouped: Record<string, any[]> = {}
  for (const e of entries) {
    const key = new Date(e.drankOn).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    grouped[key] = grouped[key] ?? []
    grouped[key].push(e)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">HYDRATION DIARY</h1>

      {Object.keys(grouped).length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">No diary entries yet.</p>
          <Link href="/waters" className="btn-primary inline-block">FIND A WATER TO LOG</Link>
        </div>
      )}

      {Object.entries(grouped).map(([month, monthEntries]) => (
        <div key={month} className="mb-10">
          <h2 className="text-sm font-black tracking-widest text-gray-500 border-b-3 border-black pb-2 mb-4">
            {month.toUpperCase()}
          </h2>
          <div className="space-y-3">
            {monthEntries.map((e: any) => (
              <div key={e._id.toString()} className="card flex gap-4 p-4">
                <div className="w-10 flex-shrink-0 flex items-start justify-center pt-1">
                  <span className="text-xs font-black text-gray-400">
                    {new Date(e.drankOn).getDate()}
                  </span>
                </div>
                {e.waterId?.image && (
                  <Image
                    src={`/waters/${e.waterId.image}`}
                    alt={e.waterId.name}
                    width={36}
                    height={60}
                    className="object-contain flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/waters/${e.waterId?.slug}`} className="font-black text-sm hover:underline">
                    {e.waterId?.brand} — {e.waterId?.name}
                  </Link>
                  {e.ratingId && (
                    <div className="text-[#e63946] text-xs">{starsDisplay(e.ratingId.score)}</div>
                  )}
                  {e.notes && <p className="text-xs text-gray-600 mt-1">{e.notes}</p>}
                  {e.ratingId?.review && (
                    <p className="text-xs text-gray-500 italic mt-1">"{e.ratingId.review}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Auto-create diary entry from rating**

In `app/api/ratings/route.ts`, after saving the rating, add:

```ts
// After saving rating and before return:
import { DiaryEntry } from '@/models/DiaryEntry'

// Inside POST, after rating is created/updated:
if (!existing) {
  await DiaryEntry.create({
    userId: session.user.id,
    waterId,
    ratingId: rating._id,
    drankOn: drankOn ? new Date(drankOn) : new Date(),
    notes: '',
  })
}
```

Import DiaryEntry at the top of the ratings route file.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: hydration diary page and API, auto-diary on rating"
```

---

## Task 12: Lists

**Files:**
- Create: `app/lists/page.tsx`, `app/lists/new/page.tsx`, `app/lists/[id]/page.tsx`, `app/api/lists/route.ts`, `app/api/lists/[id]/route.ts`, `app/api/lists/[id]/waters/route.ts`, `app/api/lists/[id]/waters/[waterId]/route.ts`

- [ ] **Step 1: Create app/api/lists/route.ts**

```ts
// app/api/lists/route.ts
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
```

- [ ] **Step 2: Create app/api/lists/[id]/route.ts**

```ts
// app/api/lists/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { List } from '@/models/List'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB()
  const list = await List.findById(params.id)
    .populate('userId', 'username')
    .populate('waters', 'name brand slug image avgRating ratingCount')
    .lean()
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(list)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const list = await List.findById(params.id)
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (list.userId.toString() !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, isPublic } = await req.json()
  if (title) list.title = title
  if (description !== undefined) list.description = description
  if (isPublic !== undefined) list.isPublic = isPublic
  await list.save()
  return NextResponse.json(list)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const list = await List.findById(params.id)
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (list.userId.toString() !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await list.deleteOne()
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Create app/api/lists/[id]/waters/route.ts**

```ts
// app/api/lists/[id]/waters/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { List } from '@/models/List'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { waterId } = await req.json()
  await connectDB()
  const list = await List.findById(params.id)
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (list.userId.toString() !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await List.findByIdAndUpdate(params.id, { $addToSet: { waters: waterId } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: Create app/api/lists/[id]/waters/[waterId]/route.ts**

```ts
// app/api/lists/[id]/waters/[waterId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { List } from '@/models/List'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; waterId: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const list = await List.findById(params.id)
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (list.userId.toString() !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await List.findByIdAndUpdate(params.id, { $pull: { waters: params.waterId } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: Create app/lists/page.tsx**

```tsx
// app/lists/page.tsx
import { connectDB } from '@/lib/db'
import { List } from '@/models/List'
import Link from 'next/link'
import { auth } from '@/lib/auth'

export default async function ListsPage() {
  await connectDB()
  const session = await auth()
  const lists = await List.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .populate('userId', 'username')
    .lean() as any[]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">LISTS</h1>
        {session && <Link href="/lists/new" className="btn-primary text-sm">+ NEW LIST</Link>}
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {lists.map((l: any) => (
          <Link key={l._id.toString()} href={`/lists/${l._id}`} className="card p-5 hover:shadow-[4px_4px_0_#000] transition-shadow block">
            <h2 className="font-black text-sm tracking-widest mb-1">{l.title.toUpperCase()}</h2>
            {l.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{l.description}</p>}
            <div className="flex justify-between text-xs text-gray-400 font-black tracking-widest">
              <span>@{l.userId?.username}</span>
              <span>{l.waters?.length ?? 0} WATERS</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create app/lists/new/page.tsx**

```tsx
// app/lists/new/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function NewListPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)

  if (!session) { router.push('/sign-in'); return null }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, isPublic }),
    })
    const data = await res.json()
    router.push(`/lists/${data._id}`)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">CREATE LIST</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">TITLE</label>
          <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">DESCRIPTION</label>
          <textarea className="input resize-none h-20" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="public" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="public" className="text-xs font-black tracking-widest">PUBLIC LIST</label>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'CREATING...' : 'CREATE LIST'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 7: Create app/lists/[id]/page.tsx**

```tsx
// app/lists/[id]/page.tsx
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { List } from '@/models/List'
import WaterCard from '@/components/WaterCard'
import Link from 'next/link'

export default async function ListDetailPage({ params }: { params: { id: string } }) {
  await connectDB()
  const list = await List.findById(params.id)
    .populate('userId', 'username')
    .populate('waters', 'name brand slug image avgRating ratingCount')
    .lean() as any

  if (!list) notFound()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">{list.title.toUpperCase()}</h1>
        {list.description && <p className="text-gray-600 text-sm mb-3">{list.description}</p>}
        <div className="text-xs text-gray-400 font-black tracking-widest">
          BY <Link href={`/profile/${list.userId?.username}`} className="text-black hover:underline">
            @{list.userId?.username}
          </Link>
          {' · '}{list.waters?.length ?? 0} WATERS
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {list.waters?.map((w: any) => (
          <WaterCard
            key={w._id.toString()}
            slug={w.slug}
            name={w.name}
            brand={w.brand}
            image={w.image}
            avgRating={w.avgRating}
            ratingCount={w.ratingCount}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: lists CRUD — browse, create, detail pages + API"
```

---

## Task 13: Wantlist API + Wantlist Button

**Files:**
- Create: `app/api/users/wantlist/route.ts`, `components/WantlistButton.tsx`

- [ ] **Step 1: Create app/api/users/wantlist/route.ts**

```ts
// app/api/users/wantlist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { waterId, action } = await req.json()
  if (!waterId || !action) return NextResponse.json({ error: 'waterId and action required' }, { status: 400 })

  await connectDB()
  const update = action === 'add'
    ? { $addToSet: { wantList: waterId } }
    : { $pull: { wantList: waterId } }

  await User.findByIdAndUpdate(session.user.id, update)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create components/WantlistButton.tsx**

```tsx
// components/WantlistButton.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Props {
  waterId: string
  initialInList: boolean
}

export default function WantlistButton({ waterId, initialInList }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [inList, setInList] = useState(initialInList)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!session) { router.push('/sign-in'); return }
    setLoading(true)
    await fetch('/api/users/wantlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waterId, action: inList ? 'remove' : 'add' }),
    })
    setInList(!inList)
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading} className={inList ? 'btn-secondary w-full text-sm' : 'btn-outline w-full text-sm'}>
      {loading ? '...' : inList ? '✓ ON WANTLIST' : '+ WANTLIST'}
    </button>
  )
}
```

- [ ] **Step 3: Add WantlistButton to water detail page**

In `app/waters/[slug]/page.tsx`, replace the static `+ WANTLIST` button with `<WantlistButton>`. Pass `waterId={water._id.toString()}` and check if current user has it in their wantList:

```tsx
// At the top of WaterDetailPage, after fetching water:
const session = await auth()
let inWantList = false
if (session) {
  const currentUser = await User.findById(session.user.id).select('wantList').lean() as any
  inWantList = currentUser?.wantList?.some((id: any) => id.toString() === water._id.toString()) ?? false
}
```

Then render:
```tsx
<WantlistButton waterId={water._id.toString()} initialInList={inWantList} />
```

Import `User` and `auth` in the water detail page.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wantlist toggle API and button component"
```

---

## Task 14: Activity Feed

**Files:**
- Create: `app/activity/page.tsx`, `app/api/activity/route.ts`

- [ ] **Step 1: Create app/api/activity/route.ts**

```ts
// app/api/activity/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Rating } from '@/models/Rating'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const currentUser = await User.findById(session.user.id).select('following').lean() as any
  const followingIds = currentUser?.following ?? []

  const feed = await Rating.find({ userId: { $in: followingIds } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId', 'username')
    .populate('waterId', 'name brand slug image')
    .lean()

  return NextResponse.json(feed)
}
```

- [ ] **Step 2: Create app/activity/page.tsx**

```tsx
// app/activity/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Rating } from '@/models/Rating'
import { starsDisplay } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export default async function ActivityPage() {
  const session = await auth()
  if (!session) redirect('/sign-in')

  await connectDB()
  const currentUser = await User.findById(session.user.id).select('following').lean() as any
  const followingIds = currentUser?.following ?? []

  const feed = await Rating.find({ userId: { $in: followingIds } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId', 'username')
    .populate('waterId', 'name brand slug image')
    .lean() as any[]

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">ACTIVITY</h1>

      {followingIds.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">Follow some people to see their activity.</p>
          <Link href="/waters" className="btn-primary inline-block">EXPLORE WATERS</Link>
        </div>
      )}

      {feed.length === 0 && followingIds.length > 0 && (
        <p className="text-gray-400 text-sm">No recent activity from people you follow.</p>
      )}

      <div className="space-y-4">
        {feed.map((r: any) => (
          <div key={r._id.toString()} className="card flex gap-4 p-4">
            {r.waterId?.image && (
              <Link href={`/waters/${r.waterId.slug}`}>
                <Image
                  src={`/waters/${r.waterId.image}`}
                  alt={r.waterId.name}
                  width={36}
                  height={60}
                  className="object-contain flex-shrink-0"
                />
              </Link>
            )}
            <div className="flex-1">
              <div className="text-sm mb-1">
                <Link href={`/profile/${r.userId?.username}`} className="font-black hover:underline">
                  @{r.userId?.username}
                </Link>
                {' drank '}
                <Link href={`/waters/${r.waterId?.slug}`} className="font-black hover:underline">
                  {r.waterId?.brand} {r.waterId?.name}
                </Link>
              </div>
              <div className="text-[#e63946] text-xs mb-1">{starsDisplay(r.score)}</div>
              {r.review && <p className="text-xs text-gray-600 italic">"{r.review}"</p>}
              <div className="text-gray-400 text-xs mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: activity feed showing followed users' ratings"
```

---

## Task 15: Search

**Files:**
- Create: `app/search/page.tsx`, `app/api/search/route.ts` (note: reuse `/api/waters` with `q` param)

- [ ] **Step 1: Add search to app/api/waters/route.ts**

Add `q` param handling to the existing GET handler in `app/api/waters/route.ts`:

```ts
// In the GET function, add before filter:
const q = searchParams.get('q')
if (q) {
  filter['$text'] = { $search: q } as any
}
```

- [ ] **Step 2: Create app/search/page.tsx**

```tsx
// app/search/page.tsx
'use client'
import { useState, useTransition } from 'react'
import WaterCard from '@/components/WaterCard'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearched(true)
    startTransition(async () => {
      const res = await fetch(`/api/waters?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">SEARCH WATERS</h1>

      <form onSubmit={handleSearch} className="flex gap-0 mb-10 border-3 border-black">
        <input
          type="text"
          className="flex-1 px-4 py-3 font-mono font-black text-sm focus:outline-none tracking-widest"
          placeholder="SEARCH BY NAME OR BRAND..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary border-0 px-8">
          {isPending ? '...' : 'SEARCH'}
        </button>
      </form>

      {searched && results.length === 0 && (
        <p className="text-gray-400 text-sm">No waters found for "{query}".</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {results.map((w: any) => (
          <WaterCard
            key={w._id}
            slug={w.slug}
            name={w.name}
            brand={w.brand}
            image={w.image}
            avgRating={w.avgRating}
            ratingCount={w.ratingCount}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: search page with MongoDB text index"
```

---

## Task 16: Settings Page

**Files:**
- Create: `app/settings/page.tsx`, `app/api/users/settings/route.ts`

- [ ] **Step 1: Create app/api/users/settings/route.ts**

```ts
// app/api/users/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bio, password } = await req.json()
  await connectDB()

  const update: Record<string, string> = {}
  if (bio !== undefined) update.bio = bio
  if (password) update.passwordHash = await bcrypt.hash(password, 12)

  await User.findByIdAndUpdate(session.user.id, update)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create app/settings/page.tsx**

```tsx
// app/settings/page.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [bio, setBio] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!session) { router.push('/sign-in'); return null }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/users/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, password: password || undefined }),
    })
    if (res.ok) { setMessage('SAVED!'); setPassword('') }
    else setMessage('Error saving settings')
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl mb-8">SETTINGS</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">USERNAME</label>
          <div className="input bg-gray-100 text-gray-500">{session.user.name}</div>
        </div>
        <div>
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">BIO</label>
          <textarea className="input resize-none h-20" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell people about your hydration journey..." />
        </div>
        <div>
          <label className="text-xs font-black tracking-widest text-gray-500 block mb-1">NEW PASSWORD</label>
          <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" minLength={8} />
        </div>
        {message && <p className={`text-xs font-black ${message === 'SAVED!' ? 'text-green-600' : 'text-[#e63946]'}`}>{message}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: settings page for bio and password updates"
```

---

## Task 17: Final Polish + next.config

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Configure next.config.ts for image formats**

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // local images from /public/waters/
  },
}

export default nextConfig
```

- [ ] **Step 2: Verify all routes work end-to-end**

```bash
npm run dev
```

Walk through:
1. Visit `/` — hero with bubbles loads ✓
2. Visit `/waters` — grid with filters ✓
3. Click a water — detail page with metadata + histogram ✓
4. `/sign-up` — create account ✓
5. Sign in — navbar shows username ✓
6. Rate a water — modal opens, saves, histogram updates ✓
7. `/diary` — entry auto-created ✓
8. `/lists/new` — create a list ✓
9. `/activity` — shows feed ✓
10. `/search` — text search works ✓
11. `/profile/[username]` — shows ratings + lists ✓
12. `/settings` — bio updates ✓

- [ ] **Step 3: Run seed to ensure data is populated**

```bash
npm run seed
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: final polish and next.config image setup — Waterboxd v1 complete"
```

---

## Self-Review Checklist

- [x] **Auth** — Registration, sign-in, sign-out, session on all protected routes
- [x] **Ratings** — Half-star scale, create/update/delete, avgRating recalculated on Water
- [x] **Reviews** — Text review attached to rating, shown on water detail + activity
- [x] **Diary** — Auto-created on rating, manual entry API, diary page grouped by month
- [x] **Lists** — CRUD, add/remove waters, public/private, browse page
- [x] **Wantlist** — Toggle per user, button on water detail
- [x] **Following** — Follow/unfollow API, ProfileHeader toggle button
- [x] **Activity Feed** — Ratings from followed users, sorted by recency
- [x] **Search** — MongoDB text index on name+brand, search page
- [x] **Water Detail** — Image, metadata, rating histogram, reviews
- [x] **Browse** — Type filter, sort options
- [x] **Profile** — Recent ratings grid, lists, follow stats
- [x] **Bubble Animation** — CSS keyframes, 22 bubbles, randomized
- [x] **Brutalist Theme** — Black/white/red, 3px borders, font-black, tracking-widest
- [x] **Seed** — 7 waters with all attributes
