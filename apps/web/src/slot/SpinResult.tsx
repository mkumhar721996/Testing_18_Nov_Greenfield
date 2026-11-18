import type { SpinResult as Spin } from './types'

export function SpinResult({ spin }: { spin: Spin }) {
  if (spin.outcome === 'win') {
    const [row, col] = spin.winningCells[0]
    return (
      <div className="result is-win" data-wf-id="result-win" role="status">
        <span className="badge badge-success">Win</span>
        <h2>You win {spin.amountWon}</h2>
        <p>
          Bet {spin.bet}. Amount won {spin.amountWon}. Three {spin.reels[row][col]} on the diagonal.
        </p>
      </div>
    )
  }
  return (
    <div className="result is-loss" data-wf-id="result-loss" role="status">
      <span className="badge badge-neutral">Loss</span>
      <h2>No win this spin</h2>
      <p>
        Bet {spin.bet}. Lost {spin.bet}. Spin again or change your bet.
      </p>
    </div>
  )
}
