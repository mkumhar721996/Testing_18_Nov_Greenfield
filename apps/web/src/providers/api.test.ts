import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchProviders } from './api'

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
