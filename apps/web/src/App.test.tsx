import { render, screen } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import App from './App'

afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('renders the employee directory', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }))
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Employees' })).toBeInTheDocument()
    expect(await screen.findByText('No employees')).toBeInTheDocument()
  })
})
