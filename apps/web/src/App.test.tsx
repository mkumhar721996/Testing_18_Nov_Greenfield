import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the heading', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ offers: [] }))))
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Web App' })).toBeInTheDocument()
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith('/offers', expect.anything()))
    vi.unstubAllGlobals()
  })
})
