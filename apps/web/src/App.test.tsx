import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the leave balances page in the shell', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'My leave balances' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My leave' })).toHaveAttribute('aria-current', 'page')
  })
})
