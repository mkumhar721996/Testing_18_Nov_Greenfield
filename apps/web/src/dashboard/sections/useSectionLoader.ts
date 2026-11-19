import { useCallback, useEffect, useRef, useState } from 'react'

export type SectionState<T> =
  | { status: 'loading'; retrying: false }
  | { status: 'error'; retrying: boolean }
  | { status: 'loaded'; data: T }

export function useSectionLoader<T>(load: () => Promise<T>): {
  state: SectionState<T>
  retry: () => void
} {
  const [state, setState] = useState<SectionState<T>>({ status: 'loading', retrying: false })
  const loadRef = useRef(load)
  loadRef.current = load
  // Counts calls; a result is applied only if it belongs to the latest call.
  const latest = useRef(0)

  const run = useCallback(() => {
    const call = ++latest.current
    loadRef.current().then(
      (data) => {
        if (call === latest.current) setState({ status: 'loaded', data })
      },
      () => {
        if (call === latest.current) setState({ status: 'error', retrying: false })
      },
    )
  }, [])

  useEffect(() => {
    run()
    return () => {
      latest.current++
    }
  }, [run])

  const retry = useCallback(() => {
    setState({ status: 'error', retrying: true })
    run()
  }, [run])

  return { state, retry }
}
