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
