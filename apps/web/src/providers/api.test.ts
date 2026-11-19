import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchProviders, fetchTowns } from './api'

afterEach(() => vi.unstubAllGlobals())

describe('fetchProviders', () => {
  it('returns the providers in the order received', async () => {
    const providers = [
      { id: 'b', name: 'B', services: [], towns: [], averageRating: null, reviewCount: 0 },
      { id: 'a', name: 'A', services: [], towns: [], averageRating: 5, reviewCount: 3 },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ providers }) }))
    await expect(fetchProviders()).resolves.toEqual(providers)
  })

  it('rejects on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchProviders()).rejects.toThrow()
  })
})

describe('fetchProviders with a filter', () => {
  it('sends the encoded service and town and no credentials', async () => {
    const fn = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ providers: [] }) })
    vi.stubGlobal('fetch', fn)
    await fetchProviders({ service: 'Appliance repair', town: 'Pune' })
    expect(fn).toHaveBeenCalledWith('/providers?service=Appliance%20repair&town=Pune', { signal: undefined })
  })
})

describe('fetchTowns', () => {
  it('returns the towns from /towns', async () => {
    const towns = [{ id: 'pune', name: 'Pune' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ towns }) }))
    await expect(fetchTowns()).resolves.toEqual(towns)
  })

  it('rejects on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchTowns()).rejects.toThrow()
  })
})
