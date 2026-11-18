import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('renders the recent transactions section', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Recent transactions' })).toBeInTheDocument()
  })

  it('shows the pending history destination after View all', async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'View all' }))
    expect(window.location.hash).toBe('#/accounts/transactions')
    expect(screen.getByRole('status')).toHaveTextContent('not available yet')
  })
})
