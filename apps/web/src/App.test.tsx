import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('renders the heading and the upcoming payments card', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Web App' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Upcoming payments' })).toBeInTheDocument()
  })
})
