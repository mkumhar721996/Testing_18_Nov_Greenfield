import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Catalog } from './Catalog'

const four = [
  { id: 'plumbing', name: 'Plumbing', description: 'Leaks, blocked drains, taps, toilets, water heaters and pipe repairs.' },
  { id: 'electrical', name: 'Electrical', description: 'Wiring faults, socket and switch replacement, lighting and fuse board checks.' },
  { id: 'cleaning', name: 'Cleaning', description: 'Home and office cleaning, deep cleaning, and end-of-tenancy cleaning.' },
  { id: 'appliance-repair', name: 'Appliance repair', description: 'Repairs for washing machines, fridges, ovens and other home appliances.' },
]

function stubFetch(categories: unknown[]) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ categories }) }))
}

afterEach(() => vi.unstubAllGlobals())

describe('Catalog', () => {
  it('lists all four categories with descriptions, no sign-in prompt, no price (AC1, AC2, AC3, AC6)', async () => {
    stubFetch(four)
    render(<Catalog />)
    for (const c of four) {
      expect(await screen.findByRole('heading', { level: 3, name: c.name })).toBeInTheDocument()
      expect(screen.getByText(c.description)).toBeInTheDocument()
    }
    expect(screen.getByRole('heading', { level: 1, name: 'Service categories' })).toBeInTheDocument()
    expect(screen.queryByText(/sign in|log in/i)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/[$€£₹]|\bprice\b|\bfrom \d/i)
  })

  it('lists a newly added category without code changes (AC4)', async () => {
    stubFetch([...four, { id: 'pest-control', name: 'Pest control', description: 'Ants and rodents.' }])
    render(<Catalog />)
    expect(await screen.findByRole('heading', { level: 3, name: 'Pest control' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })

  it('offers no create, edit or delete control (AC5)', async () => {
    stubFetch(four)
    render(<Catalog />)
    await screen.findByText('Plumbing')
    expect(screen.queryByRole('button', { name: /add|create|edit|delete|remove|new/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('says no categories are available when the catalog is empty (AC7)', async () => {
    stubFetch([])
    render(<Catalog />)
    expect(await screen.findByText('No service categories are available right now.')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('shows a busy loading state while fetching', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    const { container } = render(<Catalog />)
    expect(screen.getByText('Loading service categories…')).toBeInTheDocument()
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('shows an error and recovers on Try again', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<Catalog />)
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load the service categories.")
    stubFetch(four)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Plumbing')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
