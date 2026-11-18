import type { BetSize, SpinResult } from './types'

export async function playSpin(bet: BetSize): Promise<SpinResult> {
  const response = await fetch('/spins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bet }),
  })
  if (!response.ok) throw new Error(`Spin failed with status ${response.status}`)
  return response.json()
}
