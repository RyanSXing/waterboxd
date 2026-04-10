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
  if (!slug) return null
  return (
    <Link href={`/waters/${slug}`} className="card block hover:shadow-[4px_4px_0_#000] transition-shadow group">
      <div className="bg-gray-50 flex items-end justify-center h-40 p-4 border-b-3 border-black overflow-hidden">
        <Image
          src={image ? `/waters/${image}` : '/waters/fiji.webp'}
          alt={name ?? ''}
          width={80}
          height={140}
          className="object-contain h-full w-auto group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="p-3">
        <div className="font-black text-xs tracking-widest truncate">{brand?.toUpperCase() ?? ''}</div>
        <div className="text-xs text-gray-600 truncate">{name ?? ''}</div>
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
