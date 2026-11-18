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

  it('renders no dashboard without a signed-in customer', () => {
    render(<App />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
