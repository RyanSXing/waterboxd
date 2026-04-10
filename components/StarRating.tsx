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
        <div key={star} className="relative cursor-pointer select-none" style={{ width: '1.5em' }}>
          {/* Base star (empty) */}
          <span className={`${starSize}`} style={{ color: '#d1d5db' }}>★</span>
          {/* Half fill overlay */}
          {(hover || value) >= star - 0.5 && (
            <span
              className={`${starSize} absolute top-0 left-0`}
              style={{
                color: '#e63946',
                clipPath: (hover || value) >= star ? 'none' : 'inset(0 50% 0 0)',
                pointerEvents: 'none',
              }}
            >★</span>
          )}
          {/* Invisible hit areas for half and full */}
          <span
            className="absolute top-0 left-0 w-1/2 h-full"
            onMouseEnter={() => setHover(star - 0.5)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star - 0.5)}
          />
          <span
            className="absolute top-0 right-0 w-1/2 h-full"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
          />
        </div>
      ))}
    </div>
  )
}
