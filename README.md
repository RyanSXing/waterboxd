# Waterboxd

A social water rating and review platform built with Next.js, MongoDB, and TypeScript.

## Overview

Waterboxd is a community-driven platform where users can rate, review, and discover different water brands and types. Track your water ratings, create and share lists, maintain a wantlist, and follow other water enthusiasts.

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


