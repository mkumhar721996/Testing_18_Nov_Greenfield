import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Providers } from './Providers'

const categories = ['Plumbing', 'Electrical', 'Cleaning', 'Appliance repair'].map((name) => ({ id: name, name, description: '' }))
const towns = ['Pune', 'Mumbai', 'Chennai', 'Hyderabad', 'Bengaluru', 'Delhi', 'Kolkata', 'Ahmedabad'].map((name) => ({ id: name, name }))

const apiOrder = [
  { id: 'asha', name: 'Asha Plumbing Co.', services: ['Plumbing', 'Appliance repair'], towns: ['Pune', 'Mumbai'], averageRating: 4.9, reviewCount: 124 },
  { id: 'cedar', name: 'Cedar Home Services', services: ['Plumbing', 'Cleaning'], towns: ['Pune', 'Hyderabad'], averageRating: 4.7, reviewCount: 1 },
  { id: 'anand', name: 'Anand Fix-It', services: ['Plumbing'], towns: ['Pune'], averageRating: null, reviewCount: 0 },
]

type Handler = (url: string) => unknown
function stubApi(onProviders: Handler = () => Promise.resolve({ ok: true, json: async () => ({ providers: apiOrder }) }), townList = towns) {
  const fn = vi.fn((url: string) => {
    if (url.includes('/service-categories')) return Promise.resolve({ ok: true, json: async () => ({ categories }) })
    if (url.includes('/towns')) return Promise.resolve({ ok: true, json: async () => ({ towns: townList }) })
    return onProviders(url)
  })
  vi.stubGlobal('fetch', fn)
  return fn
}
const ok = (providers: unknown[]) => () => Promise.resolve({ ok: true, json: async () => ({ providers }) })

async function search(service = 'Plumbing', town = 'Pune') {
  const serviceSelect = await screen.findByLabelText('Service')
  await within(serviceSelect).findByRole('option', { name: service })
  await within(await screen.findByLabelText('City or town')).findByRole('option', { name: town })
  fireEvent.change(serviceSelect, { target: { value: service } })
  fireEvent.change(screen.getByLabelText('City or town'), { target: { value: town } })
  fireEvent.click(screen.getByRole('button', { name: 'Search providers' }))
}

afterEach(() => vi.unstubAllGlobals())

describe('Providers search', () => {
  it('shows the matching providers for the chosen service and town (AC1)', async () => {
    const fn = stubApi()
    render(<Providers />)
    await search()
    expect(await screen.findByRole('heading', { level: 2, name: 'Plumbing in Pune · 3 providers' })).toBeInTheDocument()
    expect(fn).toHaveBeenCalledWith(expect.stringContaining('/providers?service=Plumbing&town=Pune'), expect.anything())
  })

  it('uses the singular for one provider', async () => {
    stubApi(ok([apiOrder[0]]))
    render(<Providers />)
    await search()
    expect(await screen.findByRole('heading', { level: 2, name: 'Plumbing in Pune · 1 provider' })).toBeInTheDocument()
  })

  it('offers only the shared towns (AC6)', async () => {
    stubApi()
    render(<Providers />)
    const select = await screen.findByLabelText('City or town')
    await within(select).findByRole('option', { name: 'Pune' })
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(towns.map((t) => t.name))
  })

  it('shows whatever /towns returns and nothing hard-coded (AC6)', async () => {
    stubApi(undefined, [{ id: 'goa', name: 'Goa' }])
    render(<Providers />)
    const select = await screen.findByLabelText('City or town')
    await within(select).findByRole('option', { name: 'Goa' })
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Goa'])
  })

  it('shows the start prompt before any search and no sign-in prompt (AC3)', async () => {
    stubApi()
    render(<Providers />)
    expect(await screen.findByText(/Choose a service and a city or town to see providers/)).toBeInTheDocument()
    expect(screen.queryByText(/sign in/i, { selector: 'button, a, h1, h2, h3' })).toBeNull()
  })

  it('keeps the listing content and order from the API', async () => {
    stubApi()
    render(<Providers />)
    await search()
    const items = await screen.findAllByRole('listitem')
    expect(items.map((i) => within(i).getByRole('heading', { level: 3 }).textContent)).toEqual(apiOrder.map((p) => p.name))
    expect(screen.getByText('Covers: Plumbing, Appliance repair')).toBeInTheDocument()
    expect(screen.getByText('Towns: Pune, Mumbai')).toBeInTheDocument()
    expect(screen.getByText(/4\.9 average/)).toBeInTheDocument()
    expect(screen.getByText('(124 reviews)')).toBeInTheDocument()
    expect(screen.getByText('(1 review)')).toBeInTheDocument()
    expect(within(items[2]).getByText('No ratings yet')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/[$€£₹]|\bprice\b|\bfrom \d|\bavailab/i)
  })

  it('shows the empty state and no provider cards when nothing matches (AC7, AC8)', async () => {
    stubApi(ok([]))
    render(<Providers />)
    await search('Plumbing', 'Kolkata')
    expect(await screen.findByRole('heading', { name: 'No providers match Plumbing in Kolkata.' })).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('tells the customer to change the service or town and moves focus on "Change search" (AC9)', async () => {
    stubApi(ok([]))
    render(<Providers />)
    await search('Plumbing', 'Kolkata')
    await screen.findByRole('heading', { name: 'No providers match Plumbing in Kolkata.' })
    expect(screen.getByText('Change the service or town and search again.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Change search' }))
    expect(screen.getByLabelText('Service')).toHaveFocus()
  })

  it('shows a loading state with the button disabled', async () => {
    stubApi(() => new Promise(() => {}))
    render(<Providers />)
    await search()
    expect(await screen.findByText('Searching providers…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Searching…' })).toBeDisabled()
  })

  it('shows an error and "Try again" repeats the same search', async () => {
    const fn = stubApi(() => Promise.reject(new Error('offline')))
    render(<Providers />)
    await search('Electrical', 'Delhi')
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't search providers.")
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await vi.waitFor(() =>
      expect(fn.mock.calls.filter(([u]) => String(u).includes('/providers?service=Electrical&town=Delhi'))).toHaveLength(2),
    )
    expect(screen.getByLabelText('Service')).toHaveValue('Electrical')
    expect(screen.getByLabelText('City or town')).toHaveValue('Delhi')
  })

  it('shows an error with "Try again" when the options fail to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<Providers />)
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't search providers.")
    stubApi()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await within(await screen.findByLabelText('City or town')).findByRole('option', { name: 'Pune' })).toBeInTheDocument()
  })
})
