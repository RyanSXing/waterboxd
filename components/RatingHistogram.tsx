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
