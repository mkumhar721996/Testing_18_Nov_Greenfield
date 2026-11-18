import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const NOTICE_MS = 4000

const ICONS: Record<string, ReactNode> = {
  calendar: (
    <>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </>
  ),
  heart: (
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  ),
  star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  bag: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  edit: <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
}

export const OTHER_SERVICES = [
  { id: 'fixed-deposit', label: 'Fixed deposit', icon: 'calendar' },
  { id: 'insurance', label: 'Insurance', icon: 'heart' },
  { id: 'mutual-funds', label: 'Mutual funds', icon: 'star' },
  { id: 'forex-card', label: 'Forex card', icon: 'bag' },
  { id: 'cheque-book', label: 'Cheque book', icon: 'edit' },
] as const

export default function OtherServices() {
  const [notice, setNotice] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function showNotice(serviceId: string) {
    const service = OTHER_SERVICES.find((s) => s.id === serviceId)
    if (!service) return
    clearTimeout(timer.current)
    setNotice(`${service.label} is not available yet. You are still on your dashboard.`)
    timer.current = setTimeout(() => setNotice(null), NOTICE_MS)
  }

  return (
    <>
      <section className="card span-all" aria-labelledby="other-services-title">
        <div className="card-head">
          <h2 id="other-services-title">Other services</h2>
        </div>
        <ul className="service-tiles">
          {OTHER_SERVICES.map((service) => (
            <li key={service.id}>
              <button type="button" className="service-tile" onClick={() => showNotice(service.id)}>
                <span className="service-icon" aria-hidden="true">
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    {ICONS[service.icon]}
                  </svg>
                </span>
                {service.label}
              </button>
            </li>
          ))}
        </ul>
      </section>
      {notice && (
        <div className="toast is-open" role="status">
          {notice}
        </div>
      )}
    </>
  )
}
