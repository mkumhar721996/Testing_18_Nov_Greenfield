import { UpcomingPaymentsCard } from './upcoming-payments/UpcomingPaymentsCard'

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto flex flex-col gap-4" style={{ maxWidth: 'var(--size-content)' }}>
        <h1 className="text-3xl font-bold text-slate-900">Web App</h1>
        <UpcomingPaymentsCard />
      </div>
    </main>
  )
}
