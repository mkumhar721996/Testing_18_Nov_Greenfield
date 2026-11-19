import { act, renderHook, waitFor } from '@testing-library/react'
import { useSectionLoader } from './useSectionLoader'

describe('useSectionLoader', () => {
  it('starts loading, calls load once and then holds the data', async () => {
    const load = vi.fn().mockResolvedValue('txns')
    const { result } = renderHook(() => useSectionLoader(load))
    expect(result.current.state).toEqual({ status: 'loading', retrying: false })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'loaded', data: 'txns' }))
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('moves to error when load rejects, then retries only its own loader', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce('txns')
    const other = vi.fn().mockResolvedValue('loans')
    const first = renderHook(() => useSectionLoader(load))
    const second = renderHook(() => useSectionLoader(other))
    await waitFor(() => expect(first.result.current.state.status).toBe('error'))
    await waitFor(() => expect(second.result.current.state.status).toBe('loaded'))

    act(() => first.result.current.retry())
    expect(first.result.current.state).toEqual({ status: 'error', retrying: true })
    await waitFor(() => expect(first.result.current.state).toEqual({ status: 'loaded', data: 'txns' }))
    expect(load).toHaveBeenCalledTimes(2)
    expect(other).toHaveBeenCalledTimes(1)
  })

  it('returns to a settled error when the retry fails again', async () => {
    const load = vi.fn().mockRejectedValue(new Error('x'))
    const { result } = renderHook(() => useSectionLoader(load))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', retrying: false }))
  })

  it('ignores a stale result that settles after a newer retry', async () => {
    let rejectFirst: (e: Error) => void = () => {}
    const load = vi
      .fn()
      .mockImplementationOnce(() => new Promise((_, reject) => (rejectFirst = reject)))
      .mockResolvedValueOnce('fresh')
    const { result } = renderHook(() => useSectionLoader(load))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'loaded', data: 'fresh' }))
    await act(async () => rejectFirst(new Error('late')))
    expect(result.current.state).toEqual({ status: 'loaded', data: 'fresh' })
  })
})
