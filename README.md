# Waterboxd

A social water rating and review platform built with Next.js, MongoDB, and TypeScript.

## Overview

Waterboxd is a community-driven platform where users can rate, review, and discover different water brands and types. Track your water ratings, create and share lists, maintain a wantlist, and follow other water enthusiasts.

## Inspiration

i recently saw a reel about someone making letterboxed for chinese ciggarettes and i thought "that is so performative — how didn’t i think of that?" When I heard the hackathon theme was water, I remembered visiting Erewhon and seeing all the fancy overpriced water bottles full of buzzwords like "hydrogen infused" and "alkaline." What is that even supposed to mean? That moment sparked the idea for Waterboxd: basically Letterboxd for bottled water.

## What it does

Waterboxd is a platform for browsing a curated gallery of bottled waters — mineral, spring, alkaline, purified, sparkling, and more. The current demo gallery contains about 20 waters to demonstrate core functionality. Users can:

- browse water entries and see their properties
- rate and review waters they've tried
- view friends' and strangers' ratings
- curate and share custom water lists
- keep a wantlist of waters they want to try

## How we built it

### Frontend
Waterboxd is built on **Next.js 15** using the App Router. Every page is a React Server or Client Component depending on whether it needs interactivity. We used **Tailwind CSS** for styling with a custom brutalist design system — black backgrounds, 3px borders, bold tracking, and a red (`#e63946`) accent color throughout.

### Backend
All data operations go through **Next.js API routes** (`app/api/`). We have endpoints for waters, ratings, reviews, diary entries, lists, user following, search, and settings. Each route verifies the session before touching the database.

### Database
We used **MongoDB** with **Mongoose** for schema modeling. The data model includes six collections: `User`, `Water`, `Rating`, `DiaryEntry`, `List`, and a wantlist embedded on the user document. Ratings are denormalized onto the Water document (`avgRating`, `ratingCount`) so the catalog page doesn't need aggregation queries on every load. We wrote a seed script (`scripts/seed.ts`) to populate the catalog with real bottled water brands and images.

### Authentication
Authentication is handled by **NextAuth.js v5** with a Credentials provider. Users register with email and password (bcrypt-hashed), sign in, and receive a JWT session. The session username is used as the canonical user identifier across the app.

### Landing Page — WebGL Water Shader
The landing page is the most technically involved part of the project. It runs a real-time **water wave simulation** in WebGL2, ported from a GLSL shader. The simulation uses a **ping-pong framebuffer** technique: two floating-point textures (RGBA32F) alternate each frame as read/write targets. Each frame, a fragment shader propagates a pressure wave equation across every pixel — computing new pressure and velocity values from the four cardinal neighbors, applying damping, and storing the result.

The render pass samples the simulation texture to compute surface normals, applies UV distortion to the background gradient, and adds specular highlights that shimmer as waves pass. The page text ("WATERBOXD") is rendered to an offscreen Canvas 2D context, uploaded as a WebGL texture, and distorted by the same UV offset as the water — so the letters ripple in sync with the surface. Mouse movement continuously emits pressure at the cursor position, making the entire surface interactive.

### Search
Water search uses a **MongoDB text index** on the `name` and `brand` fields, supporting fast full-text queries across the catalog.

### Rating System
Ratings use a **half-star scale** (0.5–5.0 in 0.5 increments). When a rating is submitted or deleted, an aggregation pipeline recomputes the water's `avgRating` and `ratingCount` and writes them back atomically. Authentication is handled by NextAuth.js with a Credentials provider, and we used MongoDB with Mongoose for schema modeling including User, Water, Rating, DiaryEntry, and List collections.

## Challenges we ran into

We spent a lot of time figuring out how to make the landing page ripple effect work correctly in WebGL, especially with frame buffers, floating-point textures, and mouse interaction. We also had to get comfortable with MongoDB schema design, NextAuth session handling, and integrating all of that in a single full-stack app.

## Accomplishments we're proud of

- Building the animated water ripple landing page
- Shipping a fully functional social rating website
- Enabling multiple users to sign in, rate waters, and interact
- Supporting curated lists, wantlists, and review history

## What we learned

- WebGL can create compelling UI experiences inside a React app
- Next.js app router is powerful for building full-stack apps
- MongoDB is flexible for user and review data, but needs careful schema planning
- Strong UX makes a social discovery app feel more fun and easy to use

## What's next for Waterboxd

- Add more water brands, filters, and sorting options
- Improve mobile performance and layout
- Enable public profiles and shareable lists
- Add water recommendations and tasting challenges
- Expand the water catalog with more real-world bottles

## Features

- 🌊 **Rate & Review Waters** - Share your thoughts on different water brands with detailed ratings and reviews
- 📱 **Personal Diary** - Keep track of your water tastings and experiences
- 📋 **Custom Lists** - Create and manage collections of waters
- ⭐ **Wantlist** - Mark waters you want to try
- 👥 **Social Features** - Follow other users and discover their ratings
- 🔍 **Search & Discovery** - Browse comprehensive water database
- 📊 **Analytics** - View rating distributions and community insights

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with PostCSS

## Project Structure

```
app/                    # Next.js app directory
  ├── api/             # API routes
  ├── waters/          # Water catalog pages
  ├── lists/           # User lists
  ├── diary/           # Diary entries
  ├── profile/         # User profiles
  ├── search/          # Search interface
  └── ...
components/             # React components
lib/                    # Utilities and helpers
models/                 # MongoDB models
types/                  # TypeScript types
public/                 # Static assets
scripts/               # Utility scripts (e.g., seed)
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RyanSXing/waterboxd.git
cd waterboxd
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your MongoDB connection:
```bash
export MONGODB_URI=mongodb://localhost:27017/waterboxd
```

5. Seed the database (optional):
```bash
npm run seed
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with initial data

## Environment Variables

Create a `.env.local` file with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
DATABASE_NAME=waterboxd
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Future Plans

- Mobile app (React Native)
- Advanced analytics and trends
- AI-powered recommendations
- Community challenges and events
- Integration with water delivery services

---


