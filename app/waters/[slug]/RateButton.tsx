'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import RateModal from '@/components/RateModal'

interface Props {
  waterId: string
  waterName: string
}

export default function RateButton({ waterId, waterName }: Props) {
  const { data: session } = useSession()
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
