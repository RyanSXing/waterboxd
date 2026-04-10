# Waterboxd — Design Spec
_Date: 2026-04-10_

## Overview
Letterboxd clone for bottled water. Users track, rate, and review every water they drink. Full social features: following, activity feed, lists, diary.

---

## Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** MongoDB via Mongoose
- **Auth:** NextAuth.js v5 (email/password + Google OAuth)
- **Styling:** Tailwind CSS (brutalist theme)
- **Images:** Static files from `/public/waters/` (user avatars in `/public/avatars/`)
- **Deployment:** Single Next.js monolith (Vercel or self-hosted)

---

## Visual Design System

### Brutalist Theme
- **Background:** `#000000` (nav, hero), `#ffffff` (cards, content)
- **Accent:** `#e63946` (red — CTAs, stars, highlights)
- **Water Blue:** `#4fc3f7` (secondary accent)
- **Typography:** `font-weight: 900`, `letter-spacing: 2–4px` on headings; monospace for labels
- **Borders:** `3px solid #000` on all cards and components — no box shadows, no border-radius
- **Stars:** Red half-star rating display (0.5–5 scale)

### Hero Animation
Rising CSS bubble animation on homepage hero. 18+ bubbles with randomized size (6–24px), position, duration (4–10s), and delay. `rgba(79,195,247,0.3)` fill with `rgba(79,195,247,0.5)` border. Keyframe: `translateY(220px) → translateY(-30px)` with fade in/out.

---

## Data Models

### User
```
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  passwordHash: String,
  avatar: String (path),
  bio: String,
  createdAt: Date,
  following: [ObjectId → User],
  followers: [ObjectId → User],
  wantList: [ObjectId → Water]
}
```

### Water
```
{
  _id: ObjectId,
  slug: String (unique, url-safe),
  name: String,
  brand: String,
  image: String (filename in /public/waters/),
  type: enum [still, sparkling, mineral, alkaline],
  country: String,
  sourceRegion: String,
  ph: Number,
  tds: Number (mg/L),
  hardness: enum [soft, medium, hard],
  packaging: enum [plastic, glass, aluminum, carton],
  priceTier: enum [budget, mid, premium, luxury],
  carbonationLevel: enum [light, medium, heavy] | null, // null for non-sparkling types
  avgRating: Number,
  ratingCount: Number,
  createdAt: Date
}
```

### Rating
```
{
  _id: ObjectId,
  userId: ObjectId → User,
  waterId: ObjectId → Water,
  score: Number (0.5–5, increments of 0.5),
  review: String (optional),
  drankOn: Date (optional),
  createdAt: Date
}
```

### DiaryEntry
```
{
  _id: ObjectId,
  userId: ObjectId → User,
  waterId: ObjectId → Water,
  ratingId: ObjectId → Rating (optional),
  drankOn: Date,
  notes: String (optional),
  createdAt: Date
}
```

### List
```
{
  _id: ObjectId,
  userId: ObjectId → User,
  title: String,
  description: String,
  waters: [ObjectId → Water],
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Pages & Routes

| Route | Auth | Description |
|---|---|---|
| `/` | Public | Homepage: hero + bubble animation, popular waters grid, recent community reviews, activity feed preview |
| `/waters` | Public | Browse all waters. Filter: type, country, price tier, hardness, packaging. Sort: rating, newest, most reviewed |
| `/waters/[slug]` | Public | Water detail: bottle image, metadata (pH, TDS, hardness, packaging, price tier), avg rating histogram, all reviews, "Add to Wantlist" |
| `/waters/[slug]/rate` | Auth | Modal/page to submit/edit rating + review |
| `/diary` | Auth | Personal drinking diary, chronological, filterable by water/date |
| `/lists` | Public | Browse public lists |
| `/lists/new` | Auth | Create a list |
| `/lists/[id]` | Public | List detail: waters grid + description |
| `/profile/[username]` | Public | User profile: avatar, bio, rating count, recent ratings, lists, followers/following |
| `/activity` | Auth | Activity feed: ratings/reviews from followed users |
| `/search` | Public | Search waters by name/brand |
| `/sign-in` | Public | NextAuth sign-in |
| `/sign-up` | Public | Registration |
| `/settings` | Auth | Edit profile, avatar, bio, password |

---

## Features

### Ratings & Reviews
- Half-star scale: 0.5–5 (10 possible values)
- Review is optional text attached to a rating
- One rating per user per water (edit/delete supported)
- `avgRating` and `ratingCount` on Water updated via MongoDB aggregation on each write

### Diary
- Log a water with date + optional notes
- Linked to rating if one exists
- Chronological feed on `/diary`
- "Drank on" date on ratings auto-creates diary entry

### Lists
- User creates named lists, adds/removes waters
- Public lists browsable by all; private lists visible only to owner
- List detail shows water grid with ratings

### Wantlist
- One-click "Want to try" from water detail page
- Shown on user profile
- Stored as array on User document

### Social
- Follow/unfollow users
- Activity feed: ratings + reviews from followed users, sorted by recency
- Follower/following counts on profile

### Discovery
- "Popular This Week" — waters with most ratings in last 7 days (MongoDB aggregation)
- Browse page with filters + sort
- Search by name/brand (MongoDB text index)

### Water Detail Stats
- Average rating with histogram (1–5 star breakdown)
- Total ratings count
- All reviews paginated, sortable by recent/popular

---

## API Routes

```
POST   /api/auth/[...nextauth]   — NextAuth handler
POST   /api/users/register       — Create account
GET    /api/waters               — List/search waters
GET    /api/waters/[slug]        — Water detail
POST   /api/ratings              — Create/update rating
DELETE /api/ratings/[id]         — Delete rating
GET    /api/diary                — User diary (auth)
POST   /api/diary                — Add diary entry
GET    /api/lists                — Browse public lists
POST   /api/lists                — Create list
GET    /api/lists/[id]           — List detail
PATCH  /api/lists/[id]           — Edit list
DELETE /api/lists/[id]           — Delete list
POST   /api/lists/[id]/waters    — Add water to list
DELETE /api/lists/[id]/waters/[waterId] — Remove water
GET    /api/users/[username]     — User profile
POST   /api/users/[username]/follow   — Follow user
DELETE /api/users/[username]/follow   — Unfollow user
GET    /api/activity             — Activity feed (auth)
PATCH  /api/users/wantlist       — Add/remove from wantlist
```

---

## Seed Data
8 water brands pre-loaded from `/public/waters/`:
- Evian (still, France)
- Fiji (artesian, Fiji Islands)
- VOSS (still/sparkling, Norway)
- Smartwater (vapor distilled, USA)
- Saratoga (sparkling, USA)
- Liquid Death (mountain still/sparkling, USA)
- Box Water (still, USA)
- Unknown brand (filename: 782796__1psd.webp — needs identification before seeding)

---

## Non-Goals (out of scope v1)
- Mobile app
- Email notifications
- Admin dashboard
- Water submission by users (admin-only seeding)
- Paid tiers
