import { fetchEligibleOffers } from './offersApi'

afterEach(() => vi.unstubAllGlobals())

describe('fetchEligibleOffers', () => {
  it('returns the offers from GET /offers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ offers: [{ type: 'card-upgrade' }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchEligibleOffers()).toEqual([{ type: 'card-upgrade' }])
    expect(fetchMock.mock.calls[0][0]).toBe('/offers')
  })

  it('rejects on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))
    await expect(fetchEligibleOffers()).rejects.toThrow()
  })
})
