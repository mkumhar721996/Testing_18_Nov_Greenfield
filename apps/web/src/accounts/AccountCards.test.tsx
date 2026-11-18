import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { AccountCards } from './AccountCards'
import { formatMoney } from './format'
import type { AccountBalance } from './types'

const savings: AccountBalance = {
  id: 'savings-id',
  type: 'savings',
  displayName: 'Savings account ••4821',
  currency: 'INR',
  balanceMinor: 18425000,
}
const current: AccountBalance = {
  id: 'current-id',
  type: 'current',
  displayName: 'Current account ••0937',
  currency: 'INR',
  balanceMinor: 6231045,
}
const credit: AccountBalance = {
  id: 'credit-id',
  type: 'credit_card',
  displayName: 'Credit card ••5510',
  currency: 'INR',
  balanceMinor: 1890500,
  creditLimitMinor: 10000000,
}

type Handler = (url: string) => Response | Promise<Response>
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>

/** Stub fetch: `/accounts` lists `accounts`; `/accounts/:id` answers from `overrides` or the account. */
function stub(accounts: AccountBalance[], overrides: Record<string, Handler> = {}, list?: Handler) {
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const path = new URL(url, 'http://localhost').pathname
    if (path === '/accounts') {
      return list ? list(url) : json(accounts.map(({ id, type, displayName }) => ({ id, type, displayName })))
    }
    const id = path.split('/').pop() as string
    if (overrides[id]) return overrides[id](url)
    const found = accounts.find((a) => a.id === id)
    return found ? json(found) : json({}, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
}

const fail = () => json({ message: 'bad gateway' }, 502)
const renderCards = (onLink = () => {}) => render(<AccountCards onLinkAccount={onLink} />)

beforeEach(() => vi.unstubAllGlobals())
afterEach(() => vi.unstubAllGlobals())

describe('AccountCards', () => {
  it('shows one card per account (AC1)', async () => {
    stub([savings, current, credit])
    renderCards()
    expect(await screen.findByText('Savings account ••4821')).toBeInTheDocument()
    expect(await screen.findByText('Current account ••0937')).toBeInTheDocument()
    expect(await screen.findByText('Credit card ••5510')).toBeInTheDocument()
    expect(document.querySelectorAll('.acct-card')).toHaveLength(3)
  })

  it('shows full balances (AC2)', async () => {
    stub([savings, current])
    renderCards()
    expect(await screen.findByText(formatMoney(18425000, 'INR'))).toBeInTheDocument()
    expect(await screen.findByText(formatMoney(6231045, 'INR'))).toBeInTheDocument()
  })

  it('shows a loading status while pending', () => {
    stub([savings])
    renderCards()
    expect(screen.getByRole('status')).toHaveTextContent('Loading your accounts…')
  })

  it('invites linking when there are no accounts (AC3)', async () => {
    stub([])
    renderCards()
    expect(await screen.findByText('No accounts linked yet')).toBeInTheDocument()
    expect(screen.getByText(/Link an account to see balances/)).toBeInTheDocument()
  })

  it('hands the Link an account click to the prop (AC4)', async () => {
    stub([])
    const onLink = vi.fn()
    renderCards(onLink)
    fireEvent.click(await screen.findByRole('button', { name: 'Link an account' }))
    expect(onLink).toHaveBeenCalledTimes(1)
  })

  it('hides the no-accounts message when an account is linked (AC5)', async () => {
    stub([savings])
    renderCards()
    await screen.findByText('Savings account ••4821')
    expect(screen.queryByText('No accounts linked yet')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Link an account' })).not.toBeInTheDocument()
  })

  it('keeps the other cards when one account fails (AC6)', async () => {
    stub([savings, current, credit], { 'current-id': fail })
    renderCards()
    expect(await screen.findByText('Savings account ••4821')).toBeInTheDocument()
    expect(await screen.findByText('Credit card ••5510')).toBeInTheDocument()
  })

  it('shows a placeholder with Try again for the failed account (AC7)', async () => {
    stub([savings, current, credit], { 'current-id': fail })
    renderCards()
    const failed = await screen.findByText("Couldn't load")
    const slot = failed.closest('.acct-fail') as HTMLElement
    expect(within(slot).getByText('Current account ••0937')).toBeInTheDocument()
    expect(within(slot).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    await screen.findByText('Credit card ••5510')
    expect(document.querySelectorAll('.acct-card')).toHaveLength(2)
  })

  it('retries only the failed card and leaves siblings untouched (AC8)', async () => {
    let attempts = 0
    stub([savings, current, credit], {
      'current-id': () => (attempts++ === 0 ? fail() : json(current)),
    })
    renderCards()
    const savingsCard = (await screen.findByText('Savings account ••4821')).closest('.acct-card')
    const creditCard = (await screen.findByText('Credit card ••5510')).closest('.acct-card')
    const failedSlot = (await screen.findByText("Couldn't load")).closest('.acct-fail') as HTMLElement
    const callsBeforeRetry = fetchMock.mock.calls.length
    fireEvent.click(within(failedSlot).getByRole('button', { name: 'Try again' }))
    // The placeholder also names the account, so wait for it to give way to the loaded card.
    await waitFor(() => expect(document.querySelector('.acct-fail')).toBeNull())
    expect(await screen.findByText('Current account ••0937')).toBeInTheDocument()
    expect(document.querySelectorAll('.acct-card')).toHaveLength(3)
    expect(screen.getByText('Savings account ••4821').closest('.acct-card')).toBe(savingsCard)
    expect(screen.getByText('Credit card ••5510').closest('.acct-card')).toBe(creditCard)
    expect(fetchMock).toHaveBeenCalledTimes(callsBeforeRetry + 1)
  })

  it('shows a placeholder for each failed account (AC9)', async () => {
    stub([savings, current], { 'savings-id': fail, 'current-id': fail })
    renderCards()
    await screen.findAllByText("Couldn't load")
    expect(screen.getAllByRole('button', { name: 'Try again' })).toHaveLength(2)
    expect(document.querySelectorAll('.acct-fail')).toHaveLength(2)
  })

  it('does not show the no-accounts message when every balance fails (AC10)', async () => {
    stub([savings, current, credit], { 'savings-id': fail, 'current-id': fail, 'credit-id': fail })
    renderCards()
    await screen.findAllByRole('button', { name: 'Try again' })
    expect(screen.queryByText('No accounts linked yet')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Link an account' })).not.toBeInTheDocument()
  })

  it('does not show the no-accounts message when the list fails, and retries the list (AC10)', async () => {
    let listCalls = 0
    stub([savings], {}, () => (listCalls++ === 0 ? json({}, 500) : json([savings])))
    renderCards()
    await screen.findAllByRole('button', { name: 'Try again' })
    expect(screen.getByRole('alert')).toHaveTextContent('We could not load your accounts. Please try again.')
    expect(screen.queryByText('No accounts linked yet')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Link an account' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Savings account ••4821')).toBeInTheDocument()
    expect(listCalls).toBe(2)
  })

  it('shows the credit card outstanding balance, limit and usage', async () => {
    stub([credit])
    renderCards()
    const card = (await screen.findByText('Credit card ••5510')).closest('.acct-card') as HTMLElement
    expect(await within(card).findByText(formatMoney(1890500, 'INR'))).toBeInTheDocument()
    expect(within(card).getByText('Outstanding balance')).toBeInTheDocument()
    expect(within(card).getByText(`Limit ${formatMoney(10000000, 'INR')}`)).toBeInTheDocument()
    expect(within(card).getByRole('img', { name: '19 percent of limit used' })).toBeInTheDocument()
  })
})
