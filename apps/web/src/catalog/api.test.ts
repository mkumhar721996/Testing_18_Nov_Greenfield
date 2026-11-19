import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchServiceCategories } from './api'

afterEach(() => vi.unstubAllGlobals())

describe('fetchServiceCategories', () => {
  it('returns the categories from the API', async () => {
    const categories = [{ id: 'a', name: 'A', description: 'd' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ categories }) }))
    await expect(fetchServiceCategories()).resolves.toEqual(categories)
  })

  it('rejects on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchServiceCategories()).rejects.toThrow()
  })
})
