import { fireEvent, render, screen } from '@testing-library/react'
import { PreApprovedOffers } from './PreApprovedOffers'

const loan = async () => [{ type: 'personal-loan' as const }]
const card = async () => [{ type: 'card-upgrade' as const }]

describe('PreApprovedOffers', () => {
  it('shows the personal loan tile when eligible', async () => {
    render(<PreApprovedOffers load={loan} />)
    expect(await screen.findByRole('heading', { name: 'Personal loan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
  })

  it('shows the card upgrade tile when eligible', async () => {
    render(<PreApprovedOffers load={card} />)
    expect(await screen.findByRole('heading', { name: 'Platinum card upgrade' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check' })).toBeInTheDocument()
  })

  it('shows no personal loan tile when not eligible', async () => {
    render(<PreApprovedOffers load={card} />)
    await screen.findByRole('heading', { name: 'Platinum card upgrade' })
    expect(screen.queryByRole('heading', { name: 'Personal loan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument()
  })

  it('shows no card upgrade tile when not eligible', async () => {
    render(<PreApprovedOffers load={loan} />)
    await screen.findByRole('heading', { name: 'Personal loan' })
    expect(screen.queryByRole('heading', { name: 'Platinum card upgrade' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check' })).not.toBeInTheDocument()
  })

  it('renders nothing when eligible for neither', async () => {
    const load = vi.fn(async () => [])
    const { container } = render(<PreApprovedOffers load={load} />)
    await vi.waitFor(() => expect(container.querySelector('.skeleton')).toBeNull())
    expect(screen.queryByRole('heading', { name: 'Pre-approved for you' })).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the API headline as the amount line', async () => {
    render(<PreApprovedOffers load={async () => [{ type: 'personal-loan', headline: 'Up to 5 lakh' }]} />)
    expect(await screen.findByText('Up to 5 lakh')).toBeInTheDocument()
  })

  it('starts the application journey on Apply', async () => {
    const onStartJourney = vi.fn()
    render(<PreApprovedOffers load={loan} onStartJourney={onStartJourney} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Apply' }))
    expect(onStartJourney).toHaveBeenCalledWith('personal-loan', 'apply')
  })

  it('starts the check journey on Check', async () => {
    const onStartJourney = vi.fn()
    render(<PreApprovedOffers load={card} onStartJourney={onStartJourney} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Check' }))
    expect(onStartJourney).toHaveBeenCalledWith('card-upgrade', 'check')
  })

  it('disables the button and shows Opening… while handing off', async () => {
    render(<PreApprovedOffers load={loan} onStartJourney={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Apply' }))
    expect(screen.getByRole('button', { name: 'Opening…' })).toBeDisabled()
  })

  it('shows a skeleton and no tile while loading', () => {
    const { container } = render(<PreApprovedOffers load={() => new Promise(() => {})} />)
    expect(container.querySelector('.skeleton')).not.toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows an error alert and retries', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce([{ type: 'personal-loan' }])
    render(<PreApprovedOffers load={load} />)
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load your offers.")
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Personal loan' })).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })
})
