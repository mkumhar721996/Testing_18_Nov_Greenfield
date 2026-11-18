import { render, screen } from '@testing-library/react'
import { afterEach } from 'vitest'
import App from './App'
import { CustomerContext } from './session/customer'

const customer = { firstName: 'Asha', fullName: 'Asha Menon' }

afterEach(() => {
  window.location.hash = ''
})

describe('App', () => {
  it('greets the signed-in customer by first name', () => {
    render(
      <CustomerContext.Provider value={customer}>
        <App />
      </CustomerContext.Provider>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Good .+, Asha$/)
  })

  it('renders no dashboard without a signed-in customer', () => {
    render(<App />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders the slot screen at #/slot for a signed-in customer', () => {
    window.location.hash = '#/slot'
    render(
      <CustomerContext.Provider value={customer}>
        <App />
      </CustomerContext.Provider>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Slot' })).toBeInTheDocument()
  })

  it('renders no slot screen at #/slot without a signed-in customer', () => {
    window.location.hash = '#/slot'
    render(<App />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
