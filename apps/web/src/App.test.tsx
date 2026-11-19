import { render, screen } from '@testing-library/react'
import App from './App'
import { CustomerContext } from './session/customer'

describe('App', () => {
  it('greets the signed-in customer by first name', () => {
    render(
      <CustomerContext.Provider value={{ firstName: 'Asha', fullName: 'Asha Menon' }}>
        <App />
      </CustomerContext.Provider>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Good .+, Asha$/)
  })

  it('renders the leave balances page on #/my-leave with My leave current', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ asOf: '2026-11-18', balances: [] }) }),
    )
    window.location.hash = '#/my-leave'
    render(
      <CustomerContext.Provider value={{ firstName: 'Asha', fullName: 'Asha Menon' }}>
        <App />
      </CustomerContext.Provider>,
    )
    expect(await screen.findByRole('heading', { name: 'My leave balances' })).toBeInTheDocument()
    const current = screen
      .getAllByRole('button', { name: 'My leave', hidden: true })
      .filter((b) => b.getAttribute('aria-current') === 'page')
    expect(current.length).toBeGreaterThan(0)
    window.location.hash = ''
    vi.unstubAllGlobals()
  })

  it('renders no dashboard without a signed-in customer', () => {
    render(<App />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
