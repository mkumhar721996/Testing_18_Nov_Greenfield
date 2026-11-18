import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./api/leaveApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api/leaveApi')>()),
  listRequests: vi.fn().mockResolvedValue([]),
  getOptions: vi.fn().mockResolvedValue({ leaveTypes: [], holidays: [], approverName: 'Arjun Mehta' }),
}))

describe('App', () => {
  it('opens on My leave with the top bar sections in order and Approvals hidden for non-managers', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'My leave requests' })).toBeInTheDocument()
    const labels = screen.getAllByRole('button').filter((b) => b.className.includes('lr-nav-link')).map((b) => b.textContent)
    expect(labels).toEqual(['Overview', 'My leave', 'Team calendar', 'Account'])
    expect(screen.getByRole('button', { name: 'My leave' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: 'Approvals' })).toBeNull()
  })

  it('shows a placeholder for sections outside this story', async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Overview' }))
    expect(screen.getByText(/not part of this release/)).toBeInTheDocument()
  })

  it('opens the nav behind the menu button', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getAllByRole('button', { name: 'Overview' })).toHaveLength(2)
  })
})
