import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
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

  it('shows the public catalog at #/catalog without a customer', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    window.location.hash = '#/catalog'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Service categories' })).toBeInTheDocument()
    window.location.hash = ''
    vi.unstubAllGlobals()
  })

  it('shows the public providers page at #/providers without a customer', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    window.location.hash = '#/providers'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Providers' })).toBeInTheDocument()
    window.location.hash = ''
    vi.unstubAllGlobals()
  })

  it('renders no dashboard without a signed-in customer', () => {
    render(<App />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
