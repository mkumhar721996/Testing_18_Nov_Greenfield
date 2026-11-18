import type { SpinResult } from './types'

const EMPTY_REELS = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => '–'))

export function Reels({ spin }: { spin: SpinResult | null }) {
  const reels = spin?.reels ?? EMPTY_REELS
  const label = !spin
    ? 'Reels, no spin yet'
    : spin.outcome === 'win'
      ? 'Reels: winning line on the diagonal'
      : 'Reels: no matching line'

  return (
    <div className="reels" data-wf-id="reels" role="group" aria-label={label}>
      {reels.flatMap((row, r) =>
        row.map((symbol, c) => {
          const isWin = spin?.winningCells.some(([wr, wc]) => wr === r && wc === c)
          const className = ['reel', !spin && 'is-empty', isWin && 'is-win'].filter(Boolean).join(' ')
          return (
            <div key={`${r}-${c}`} className={className}>
              {symbol}
            </div>
          )
        }),
      )}
    </div>
  )
}
