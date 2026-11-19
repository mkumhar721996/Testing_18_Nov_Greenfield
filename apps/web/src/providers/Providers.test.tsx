import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Providers } from './Providers'

const apiOrder = [
  { id: 'asha', name: 'Asha Plumbing Co.', services: ['Plumbing', 'Water heater repair'], towns: ['Pune', 'Pimpri-Chinchwad'], averageRating: 4.9, reviewCount: 124 },
  { id: 'bright', name: 'Bright Spark Electrical', services: ['Plumbing', 'Electrical wiring'], towns: ['Pune', 'Hadapsar'], averageRating: 4.7, reviewCount: 58 },
  { id: 'cedar', name: 'Cedar Home Services', services: ['Plumbing', 'Drain cleaning'], towns: ['Pune', 'Kothrud'], averageRating: 4.7, reviewCount: 1 },
  { id: 'anand', name: 'Anand Fix-It', services: ['Plumbing', 'Tap and pipe fitting'], towns: ['Pune', 'Viman Nagar'], averageRating: null, reviewCount: 0 },
  { id: 'dev', name: 'Dev Appliance Care', services: ['Plumbing', 'Appliance repair'], towns: ['Pune', 'Baner'], averageRating: null, reviewCount: 0 },
]

function stubFetch(providers: unknown[]) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ providers }) }))
}

afterEach(() => vi.unstubAllGlobals())

describe('Providers', () => {
  it('shows name, services, towns and average rating (AC1)', async () => {
    stubFetch(apiOrder)
    render(<Providers />)
    expect(await screen.findByRole('heading', { level: 2, name: 'Asha Plumbing Co.' })).toBeInTheDocument()
    expect(screen.getByText('Covers: Plumbing, Water heater repair')).toBeInTheDocument()
    expect(screen.getByText('Towns: Pune, Pimpri-Chinchwad')).toBeInTheDocument()
    expect(screen.getByText(/4\.9 average/)).toBeInTheDocument()
    expect(screen.getByText('(124 reviews)')).toBeInTheDocument()
    expect(screen.getByText('(1 review)')).toBeInTheDocument()
  })

  it('renders providers in the order the API returned them (AC2)', async () => {
    stubFetch(apiOrder)
    render(<Providers />)
    await screen.findAllByRole('listitem')
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(apiOrder.map((p) => p.name))
  })

  it('gives each provider its own listing (AC3)', async () => {
    stubFetch(apiOrder)
    render(<Providers />)
    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(within(items[0]).getByRole('heading', { name: 'Asha Plumbing Co.' })).toBeInTheDocument()
    expect(within(items[0]).queryByText('Bright Spark Electrical')).toBeNull()
  })

  it('shows no price or availability (AC4)', async () => {
    stubFetch(apiOrder)
    render(<Providers />)
    await screen.findAllByRole('listitem')
    expect(document.body.textContent).not.toMatch(/[$€£₹]|\bprice\b|\bfrom \d|\bavailab/i)
  })

  it('shows "No ratings yet" and no average for an unrated provider (AC6, AC7)', async () => {
    stubFetch(apiOrder)
    render(<Providers />)
    const items = await screen.findAllByRole('listitem')
    expect(within(items[3]).getByText('No ratings yet')).toBeInTheDocument()
    expect(within(items[3]).queryByText(/average/)).toBeNull()
  })

  it('shows a loading state', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<Providers />)
    expect(screen.getByText('Loading providers…')).toBeInTheDocument()
  })

  it('shows an error with a working retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<Providers />)
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load the providers.")
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
  })

  it('shows an empty state without a search button', async () => {
    stubFetch([])
    render(<Providers />)
    expect(await screen.findByRole('heading', { name: 'No providers match this service and town yet.' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Change service or town' })).toBeNull()
  })
})
