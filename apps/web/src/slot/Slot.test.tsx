import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomerContext } from '../session/customer'
import { Slot } from './Slot'
import type { SpinResult } from './types'

const WIN: SpinResult = {
  bet: 25,
  reels: [
    ['Cherry', 'Bell', 'Cherry'],
    ['Bar', 'Cherry', 'Seven'],
    ['Bell', 'Bar', 'Cherry'],
  ],
  outcome: 'win',
  amountWon: 50,
  winningCells: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
}
const LOSS: SpinResult = {
  bet: 25,
  reels: [
    ['Bell', 'Seven', 'Bar'],
    ['Cherry', 'Bar', 'Seven'],
    ['Bar', 'Cherry', 'Bell'],
  ],
  outcome: 'loss',
  amountWon: 0,
  winningCells: [],
}

const fetchMock = vi.fn()

function respondWith(body: SpinResult) {
  fetchMock.mockResolvedValue({ ok: true, json: async () => body })
}

function renderSlot(signedIn = true) {
  return render(
    <CustomerContext.Provider value={signedIn ? { firstName: 'Asha', fullName: 'Asha Menon' } : null}>
      <Slot />
    </CustomerContext.Provider>,
  )
}

beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('Slot', () => {
  it('renders nothing without a signed-in customer', () => {
    renderSlot(false)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('offers only the bet sizes 1, 5, 10, 25 and 50', () => {
    renderSlot()
    fireEvent.click(screen.getByRole('button', { name: /^bet 25/i }))
    const options = within(screen.getByRole('list', { name: 'Bet size' })).getAllByRole('button')
    expect(options.map((o) => o.textContent)).toEqual(['1', '5', '10', '25', '50'])
  })

  it('closes the list on Escape and when a bet is picked', () => {
    renderSlot()
    const selector = screen.getByRole('button', { name: /^bet 25/i })
    fireEvent.click(selector)
    fireEvent.keyDown(screen.getByRole('list', { name: 'Bet size' }), { key: 'Escape' })
    expect(screen.queryByRole('list', { name: 'Bet size' })).not.toBeInTheDocument()
    expect(selector).toHaveFocus()
    fireEvent.click(selector)
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(screen.queryByRole('list', { name: 'Bet size' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /spin · bet 5/i })).toBeInTheDocument()
  })

  it('shows empty reels and a prompt before any spin', () => {
    renderSlot()
    expect(screen.getAllByText('–')).toHaveLength(9)
    expect(screen.getByRole('group', { name: 'Reels, no spin yet' })).toBeInTheDocument()
    expect(screen.getByText('Pick a bet and press Spin to play.')).toBeInTheDocument()
  })

  it('sends the selected bet and shows the bet returned for that spin', async () => {
    respondWith(WIN)
    renderSlot()
    fireEvent.click(screen.getByRole('button', { name: /spin · bet 25/i }))
    expect(fetchMock).toHaveBeenCalledWith('/spins', expect.objectContaining({ body: JSON.stringify({ bet: 25 }) }))
    expect(await screen.findByText(/^Bet 25\./)).toBeInTheDocument()
  })

  it('fills the 3x3 reels with the spin outcome', async () => {
    respondWith(WIN)
    renderSlot()
    fireEvent.click(screen.getByRole('button', { name: /spin/i }))
    const cells = within(await screen.findByRole('group', { name: /^Reels/ })).getAllByText(/Cherry|Bell|Bar|Seven/)
    expect(cells).toHaveLength(9)
    expect(screen.queryByText('–')).not.toBeInTheDocument()
    expect(cells.filter((c) => c.classList.contains('is-win'))).toHaveLength(3)
  })

  it('shows a win with the amount won', async () => {
    respondWith(WIN)
    renderSlot()
    fireEvent.click(screen.getByRole('button', { name: /spin/i }))
    expect(await screen.findByText('Win')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'You win 50' })).toBeInTheDocument()
  })

  it('shows a loss without a win badge', async () => {
    respondWith(LOSS)
    renderSlot()
    fireEvent.click(screen.getByRole('button', { name: /spin/i }))
    expect(await screen.findByText('Loss')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No win this spin' })).toBeInTheDocument()
    expect(screen.queryByText('Win')).not.toBeInTheDocument()
  })

  it('disables Spin while the request runs', async () => {
    let resolve: (v: unknown) => void = () => {}
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)))
    renderSlot()
    fireEvent.click(screen.getByRole('button', { name: /spin/i }))
    expect(screen.getByRole('button', { name: /spin/i })).toBeDisabled()
    resolve({ ok: true, json: async () => LOSS })
    await waitFor(() => expect(screen.getByRole('button', { name: /spin/i })).toBeEnabled())
  })

  it('shows an alert and re-enables Spin when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'))
    renderSlot()
    fireEvent.click(screen.getByRole('button', { name: /spin/i }))
    expect(await screen.findByText('The spin did not go through. Try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /spin/i })).toBeEnabled()
  })
})
