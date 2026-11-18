import { fireEvent, render, screen } from '@testing-library/react'
import AppShell from './AppShell'

describe('AppShell', () => {
  it('lists the destinations in order, without Approvals by default', () => {
    render(<AppShell>content</AppShell>)
    const links = screen.getAllByRole('link', { name: /Overview|My leave|Team calendar|Account|Approvals/ })
    expect(links.map((l) => l.textContent)).toEqual(['Overview', 'My leave', 'Team calendar', 'Account'])
    expect(screen.queryByText('Approvals')).not.toBeInTheDocument()
  })

  it('marks My leave as the current page', () => {
    render(<AppShell>content</AppShell>)
    expect(screen.getByRole('link', { name: 'My leave' })).toHaveAttribute('aria-current', 'page')
  })

  it('toggles the navigation from the menu button', () => {
    render(<AppShell>content</AppShell>)
    const button = screen.getByRole('button', { name: 'Menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
})
