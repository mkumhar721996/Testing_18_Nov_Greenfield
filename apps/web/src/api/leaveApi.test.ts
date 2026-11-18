import { ApiError, cancelRequest, getOptions, listRequests, submitRequest } from './leaveApi'

function respond(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

describe('leaveApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('lists requests from /api/leave-requests', async () => {
    const fetchMock = respond(200, [{ id: 'r1' }])
    vi.stubGlobal('fetch', fetchMock)
    expect(await listRequests()).toEqual([{ id: 'r1' }])
    expect(fetchMock.mock.calls[0][0]).toBe('/api/leave-requests')
  })

  it('gets the form options', async () => {
    vi.stubGlobal('fetch', respond(200, { leaveTypes: [], holidays: [], approverName: 'Priya' }))
    expect((await getOptions()).approverName).toBe('Priya')
  })

  it('posts a submission as JSON', async () => {
    const fetchMock = respond(201, { id: 'r1' })
    vi.stubGlobal('fetch', fetchMock)
    const input = { leaveTypeId: 'annual', startDate: '2026-12-08', endDate: '2026-12-10' }
    await submitRequest(input)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/leave-requests')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual(input)
  })

  it('posts a cancellation', async () => {
    const fetchMock = respond(200, { id: 'r1', status: 'cancelled' })
    vi.stubGlobal('fetch', fetchMock)
    await cancelRequest('r1')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/leave-requests/r1/cancel')
  })

  it('throws an ApiError carrying status, code, message and field on a refusal', async () => {
    vi.stubGlobal('fetch', respond(422, { code: 'overlap', message: 'You already have leave.', field: 'start' }))
    await expect(listRequests()).rejects.toMatchObject({
      status: 422,
      code: 'overlap',
      message: 'You already have leave.',
      field: 'start',
    })
    await expect(listRequests()).rejects.toBeInstanceOf(ApiError)
  })

  it('throws an ApiError when the response is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 502 })))
    await expect(listRequests()).rejects.toMatchObject({ status: 502 })
  })
})
