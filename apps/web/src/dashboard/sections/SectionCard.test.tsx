import { fireEvent, render, screen } from '@testing-library/react'
import { SectionCard } from './SectionCard'

const never = () => new Promise<string>(() => {})
const body = (d: string) => <p>{d}</p>

describe('SectionCard', () => {
  it('shows a loading indicator and no content while loading (AC 1)', () => {
    render(
      <SectionCard title="Upcoming payments" label="upcoming payments" load={never}>
        {body}
      </SectionCard>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading upcoming payments…')
    expect(screen.getByRole('heading', { name: 'Upcoming payments' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows finished siblings without waiting for a loading one (AC 2)', async () => {
    render(
      <>
        <SectionCard title="Recent transactions" label="recent transactions" load={() => Promise.resolve('txns')}>
          {body}
        </SectionCard>
        <SectionCard title="Loan details" label="loan details" load={() => Promise.resolve('loans')}>
          {body}
        </SectionCard>
        <SectionCard title="Upcoming payments" label="upcoming payments" load={never}>
          {body}
        </SectionCard>
      </>,
    )
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(screen.getByText('loans')).toBeInTheDocument()
    expect(screen.getByText('Loading upcoming payments…')).toBeInTheDocument()
  })

  it('shows an error message in place of a failed section (AC 3)', async () => {
    render(
      <SectionCard title="Loan details" label="loan details" load={() => Promise.reject(new Error('x'))}>
        {body}
      </SectionCard>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't load your loan details. Your other sections are not affected.",
    )
    expect(screen.getByText('Loan details is temporarily unavailable.')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('uses "are" for plural sections', async () => {
    render(
      <SectionCard plural title="Pre-approved offers" label="pre-approved offers" load={() => Promise.reject(new Error('x'))}>
        {body}
      </SectionCard>,
    )
    expect(await screen.findByText('Pre-approved offers are temporarily unavailable.')).toBeInTheDocument()
  })

  it('keeps a loaded sibling visible when another fails (AC 4)', async () => {
    render(
      <>
        <SectionCard title="Recent transactions" label="recent transactions" load={() => Promise.resolve('txns')}>
          {body}
        </SectionCard>
        <SectionCard title="Loan details" label="loan details" load={() => Promise.reject(new Error('x'))}>
          {body}
        </SectionCard>
      </>,
    )
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(await screen.findAllByRole('alert')).toHaveLength(1)
  })

  it('shows Try again on failure only (AC 5)', async () => {
    const { unmount } = render(
      <SectionCard title="Loan details" label="loan details" load={() => Promise.resolve('loans')}>
        {body}
      </SectionCard>,
    )
    await screen.findByText('loans')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    unmount()
    render(
      <SectionCard title="Loan details" label="loan details" load={() => Promise.reject(new Error('x'))}>
        {body}
      </SectionCard>,
    )
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeEnabled()
  })

  it('reloads the section when Try again is pressed (AC 6)', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce('txns')
    render(
      <SectionCard title="Recent transactions" label="recent transactions" load={load}>
        {body}
      </SectionCard>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(screen.getByRole('button', { name: /Trying again/ })).toBeDisabled()
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('leaves the other sections unchanged on retry (AC 7)', async () => {
    const txnsLoad = vi.fn().mockResolvedValue('txns')
    const paymentsLoad = vi.fn().mockResolvedValue('payments')
    const loansLoad = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce('loans')
    render(
      <>
        <SectionCard title="Recent transactions" label="recent transactions" load={txnsLoad}>
          {body}
        </SectionCard>
        <SectionCard title="Upcoming payments" label="upcoming payments" load={paymentsLoad}>
          {body}
        </SectionCard>
        <SectionCard title="Loan details" label="loan details" load={loansLoad}>
          {body}
        </SectionCard>
      </>,
    )
    const txnsNodeBefore = await screen.findByText('txns')
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await screen.findByText('loans')
    expect(txnsLoad).toHaveBeenCalledTimes(1)
    expect(paymentsLoad).toHaveBeenCalledTimes(1)
    expect(screen.getByText('txns')).toBe(txnsNodeBefore)
  })
})
