import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the heading', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })))
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Web App' })).toBeInTheDocument()
    expect(await screen.findByText('No accounts linked yet')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})
