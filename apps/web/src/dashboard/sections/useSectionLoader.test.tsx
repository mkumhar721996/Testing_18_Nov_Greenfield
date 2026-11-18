import { act, renderHook, waitFor } from '@testing-library/react'
import { useSectionLoader } from './useSectionLoader'

describe('useSectionLoader', () => {
  it('starts loading, calls load once and moves to loaded', async () => {
    const load = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() => useSectionLoader(load))
    expect(result.current.state).toEqual({ status: 'loading', retrying: false })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'loaded', data: 'data' }))
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('moves to error when load rejects, then retries only its own load', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce('ok')
    const { result } = renderHook(() => useSectionLoader(load))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    act(() => result.current.retry())
    expect(result.current.state).toEqual({ status: 'error', retrying: true })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'loaded', data: 'ok' }))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('returns to error (not retrying) when the retry fails again', async () => {
    const load = vi.fn().mockRejectedValue(new Error('x'))
    const { result } = renderHook(() => useSectionLoader(load))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', retrying: false }))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('ignores a superseded response', async () => {
    let rejectFirst: (e: Error) => void = () => {}
    let resolveSecond: (v: string) => void = () => {}
    const load = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string>((_, rej) => (rejectFirst = rej)))
      .mockImplementationOnce(() => new Promise<string>((res) => (resolveSecond = res)))
    const { result } = renderHook(() => useSectionLoader(load))
    act(() => result.current.retry())
    await act(async () => resolveSecond('new'))
    await act(async () => rejectFirst(new Error('late')))
    expect(result.current.state).toEqual({ status: 'loaded', data: 'new' })
  })
})
