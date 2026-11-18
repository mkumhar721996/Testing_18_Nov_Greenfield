import { fireEvent, render, screen } from '@testing-library/react'
import { SectionCard } from './SectionCard'

const never = () => new Promise<string>(() => {})
const show = (d: string) => <p>{d}</p>

describe('SectionCard', () => {
  it('shows a loading indicator and no content while loading (AC 1)', () => {
    render(
      <SectionCard title="Upcoming payments" label="upcoming payments" load={never}>
        {show}
      </SectionCard>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading upcoming payments…')
    expect(screen.getByRole('heading', { name: 'Upcoming payments' })).toBeInTheDocument()
  })

  it('shows finished siblings without waiting for a loading one (AC 2)', async () => {
    render(
      <>
        <SectionCard title="Recent transactions" label="recent transactions" plural load={() => Promise.resolve('txns')}>
          {show}
        </SectionCard>
        <SectionCard title="Upcoming payments" label="upcoming payments" plural load={never}>
          {show}
        </SectionCard>
        <SectionCard title="Loan details" label="loan details" plural load={() => Promise.resolve('loans')}>
          {show}
        </SectionCard>
      </>,
    )
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(screen.getByText('loans')).toBeInTheDocument()
    expect(screen.getByText('Loading upcoming payments…')).toBeInTheDocument()
  })

  it('shows an error message in place of the section (AC 3, 5)', async () => {
    render(
      <SectionCard title="Loan details" label="loan details" plural load={() => Promise.reject(new Error('boom'))}>
        {show}
      </SectionCard>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't load your loan details. Your other sections are not affected.",
    )
    expect(screen.getByText('Loan details are temporarily unavailable.')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
  })

  it('has no Try again button while loading or loaded', async () => {
    render(
      <>
        <SectionCard title="A" label="a" load={never}>
          {show}
        </SectionCard>
        <SectionCard title="B" label="b" load={() => Promise.resolve('ok')}>
          {show}
        </SectionCard>
      </>,
    )
    await screen.findByText('ok')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('keeps other sections visible when one fails (AC 4)', async () => {
    render(
      <>
        <SectionCard title="Recent transactions" label="recent transactions" load={() => Promise.resolve('txns')}>
          {show}
        </SectionCard>
        <SectionCard title="Loan details" label="loan details" load={() => Promise.reject(new Error('x'))}>
          {show}
        </SectionCard>
      </>,
    )
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(await screen.findAllByRole('alert')).toHaveLength(1)
  })

  it('reloads the section on Try again (AC 6)', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce('txns')
    render(
      <SectionCard title="Recent transactions" label="recent transactions" plural load={load}>
        {show}
      </SectionCard>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(screen.getByRole('button', { name: /Trying again/ })).toBeDisabled()
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('shows the error again when the retry fails (AC 6)', async () => {
    const load = vi.fn().mockRejectedValue(new Error('x'))
    render(
      <SectionCard title="Loan details" label="loan details" load={load}>
        {show}
      </SectionCard>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeEnabled()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('leaves other sections unchanged on Try again (AC 7)', async () => {
    const txnsLoad = vi.fn().mockResolvedValue('txns')
    const paymentsLoad = vi.fn().mockResolvedValue('payments')
    const loansLoad = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce('loans')
    render(
      <>
        <SectionCard title="Recent transactions" label="recent transactions" load={txnsLoad}>
          {show}
        </SectionCard>
        <SectionCard title="Upcoming payments" label="upcoming payments" load={paymentsLoad}>
          {show}
        </SectionCard>
        <SectionCard title="Loan details" label="loan details" load={loansLoad}>
          {show}
        </SectionCard>
      </>,
    )
    const txnsNodeBefore = await screen.findByText('txns')
    const paymentsNodeBefore = screen.getByText('payments')
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await screen.findByText('loans')
    expect(txnsLoad).toHaveBeenCalledTimes(1)
    expect(paymentsLoad).toHaveBeenCalledTimes(1)
    expect(screen.getByText('txns')).toBe(txnsNodeBefore)
    expect(screen.getByText('payments')).toBe(paymentsNodeBefore)
  })
})
