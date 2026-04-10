'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-black text-white border-b-3 border-[#e63946] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/home" className="font-black text-lg tracking-[6px] text-white hover:text-[#e63946] transition-colors">
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
