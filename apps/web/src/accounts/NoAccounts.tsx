export function NoAccounts({ onLinkAccount }: { onLinkAccount: () => void }) {
  return (
    <div className="empty-state">
      <h2>No accounts linked yet</h2>
      <p>Link an account to see balances and recent transactions here.</p>
      <button className="btn btn-primary" type="button" onClick={onLinkAccount}>
        Link an account
      </button>
    </div>
  )
}
