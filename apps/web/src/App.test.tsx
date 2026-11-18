import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

vi.mock('./organizations/api', () => ({ fetchOrganizations: () => new Promise(() => {}) }))

describe('App', () => {
  it('renders the shell with the Organizations screen under Account', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeInTheDocument()
  })
})
