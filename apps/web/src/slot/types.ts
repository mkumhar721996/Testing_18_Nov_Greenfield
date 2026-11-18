export type BetSize = 1 | 5 | 10 | 25 | 50

export type SpinResult = {
  bet: BetSize
  reels: string[][]
  outcome: 'win' | 'loss'
  amountWon: number
  winningCells: [number, number][]
}
