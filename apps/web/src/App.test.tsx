import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Web App' })).toBeInTheDocument()
  })

  it('shows the five other-services tiles', () => {
    render(<App />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })
})
