import { useState } from 'react'
import { AppShell, type SectionId } from './components/AppShell'
import { MyLeavePage } from './pages/MyLeavePage'

export default function App() {
  const [section, setSection] = useState<SectionId>('my-leave')

  return (
    <AppShell current={section} onNavigate={setSection}>
      {section === 'my-leave' ? (
        <MyLeavePage />
      ) : (
        <div className="lr-page">
          <p>This section is not part of this release.</p>
        </div>
      )}
    </AppShell>
  )
}
