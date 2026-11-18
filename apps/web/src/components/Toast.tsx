import { useEffect } from 'react'

const VISIBLE_MS = 5000

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDone, VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [message, onDone])

  if (!message) return null
  return (
    <div className="toast is-open lr-toast" role="status">
      {message}
    </div>
  )
}
