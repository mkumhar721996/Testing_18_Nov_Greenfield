import { AccountCards } from './accounts/AccountCards'

// Integration point: the linking journey belongs to another epic, so there is nowhere to go yet.
function linkAccount() {}

export default function App() {
  return (
    <main className="container">
      <h1>Web App</h1>
      <AccountCards onLinkAccount={linkAccount} />
    </main>
  )
}
