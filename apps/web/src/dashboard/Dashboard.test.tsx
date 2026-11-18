import { fireEvent, render, screen, within } from '@testing-library/react'
import { CustomerContext } from '../session/customer'
import { Dashboard } from './Dashboard'

const at = (h: number, m: number) => new Date(2026, 10, 18, h, m)
const asha = { firstName: 'Asha', fullName: 'Asha Menon' }

function ui(now = at(9, 30), onNavigate = vi.fn(), onSignOut = vi.fn()) {
  return (
    <CustomerContext.Provider value={asha}>
      <Dashboard now={now} onNavigate={onNavigate} onSignOut={onSignOut} />
    </CustomerContext.Provider>
  )
}

afterEach(() => vi.restoreAllMocks())

describe('Dashboard frame', () => {
  it('shows a top bar with the logo', () => {
    render(ui())
    const banner = screen.getByRole('banner')
    expect(banner).toBeInTheDocument()
    expect(within(banner).getByText('Bank Application')).toBeInTheDocument()
  })

  it('shows the top navigation, collapsed behind the menu button', () => {
    render(ui())
    // A hidden nav has no computed accessible name, so find it by its label.
    const nav = within(screen.getByRole('banner')).getByLabelText('Main', { selector: 'nav' })
    expect(
      within(nav)
        .getAllByRole('button', { hidden: true })
        .map((b) => b.textContent),
    ).toEqual(['Dashboard', 'Accounts', 'Payments', 'Cards'])
    const menu = screen.getByRole('button', { name: 'Menu' })
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(menu)
    expect(menu).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeVisible()
  })

  it('shows the user menu', () => {
    const onSignOut = vi.fn()
    render(ui(at(9, 30), vi.fn(), onSignOut))
    fireEvent.click(screen.getByRole('button', { name: 'Account menu for Asha Menon' }))
    expect(screen.getByRole('menuitem', { name: 'Your profile' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    expect(onSignOut).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes the user menu on Escape', () => {
    render(ui())
    fireEvent.click(screen.getByRole('button', { name: 'Account menu for Asha Menon' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('lists the banking areas in the sidebar, without Settings', () => {
    render(ui())
    const side = screen.getByRole('navigation', { name: 'Banking areas' })
    expect(
      within(side)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Dashboard', 'Accounts', 'Transfers', 'Bill pay', 'Statements'])
    expect(screen.queryByText(/settings/i)).not.toBeInTheDocument()
  })
})

describe('Dashboard greeting', () => {
  it('follows local time of day by first name', () => {
    const { rerender } = render(ui(at(11, 59)))
    const h1 = () => screen.getByRole('heading', { level: 1 })
    expect(h1()).toHaveTextContent('Good morning, Asha')
    rerender(ui(at(12, 0)))
    expect(h1()).toHaveTextContent('Good afternoon, Asha')
    rerender(ui(at(16, 59)))
    expect(h1()).toHaveTextContent('Good afternoon, Asha')
    rerender(ui(at(17, 0)))
    expect(h1()).toHaveTextContent('Good evening, Asha')
  })
})

describe('Dashboard quick actions', () => {
  it('shows Transfer money and Pay a bill', () => {
    render(ui())
    const group = screen.getByRole('group', { name: 'Quick actions' })
    expect(within(group).getByRole('button', { name: 'Transfer money' })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Pay a bill' })).toBeInTheDocument()
  })

  it('changes no customer data on load or on pressing a quick action', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const onNavigate = vi.fn()
    render(ui(at(9, 30), onNavigate))
    expect(fetchSpy).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Transfer money' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pay a bill' }))
    expect(onNavigate.mock.calls).toEqual([['transfers'], ['bill-pay']])
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
