import OtherServices from './components/OtherServices'

export default function App() {
  return (
    <main
      style={{
        maxWidth: 'var(--size-content)',
        margin: '0 auto',
        padding: 'var(--space-3)',
      }}
    >
      <h1 className="text-3xl font-bold text-slate-900">Web App</h1>
      <OtherServices />
    </main>
  )
}
