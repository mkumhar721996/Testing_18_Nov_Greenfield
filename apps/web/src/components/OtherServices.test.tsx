import { act, fireEvent, render, screen, within } from '@testing-library/react'
import OtherServices from './OtherServices'

describe('OtherServices', () => {
  it('shows five labelled tiles in order', () => {
    render(<OtherServices />)
    const section = screen.getByRole('region', { name: 'Other services' })
    const tiles = within(section).getAllByRole('button')
    expect(tiles.map((t) => t.textContent)).toEqual([
      'Fixed deposit',
      'Insurance',
      'Mutual funds',
      'Forex card',
      'Cheque book',
    ])
  })

  it('stays on the dashboard when a tile is pressed', () => {
    const before = window.location.href
    const historyLength = window.history.length
    render(<OtherServices />)
    for (const tile of screen.getAllByRole('button')) fireEvent.click(tile)
    expect(window.location.href).toBe(before)
    expect(window.history.length).toBe(historyLength)
    expect(screen.getByRole('heading', { name: 'Other services' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(5)
    expect(document.querySelector('a[href]')).toBeNull()
  })

  it('shows a neutral notice and no error when a tile is pressed', () => {
    render(<OtherServices />)
    fireEvent.click(screen.getByRole('button', { name: 'Insurance' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Insurance is not available yet. You are still on your dashboard.',
    )
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText(/error|failed|could not/i)).toBeNull()
  })

  it('hides the notice after 4 seconds', () => {
    vi.useFakeTimers()
    render(<OtherServices />)
    fireEvent.click(screen.getByRole('button', { name: 'Forex card' }))
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.queryByRole('status')).toBeNull()
    vi.useRealTimers()
  })
})
