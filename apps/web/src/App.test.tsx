import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'
import { fetchOrganizations } from './organizations/api'

vi.mock('./organizations/api')

describe('App', () => {
  it('renders the Organizations screen in the shell', async () => {
    vi.mocked(fetchOrganizations).mockResolvedValue([])
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByText('No organizations yet')).toBeInTheDocument()
  })
})
