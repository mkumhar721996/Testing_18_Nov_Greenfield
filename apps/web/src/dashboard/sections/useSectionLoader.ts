import { useCallback, useEffect, useRef, useState } from 'react'

export type SectionState<T> =
  | { status: 'loading'; retrying: false }
  | { status: 'error'; retrying: boolean }
  | { status: 'loaded'; data: T }

/** One independent load lifecycle per section; each section uses its own instance. */
export function useSectionLoader<T>(load: () => Promise<T>) {
  const [state, setState] = useState<SectionState<T>>({ status: 'loading', retrying: false })
  const loadRef = useRef(load)
  loadRef.current = load
  const latest = useRef(0)

  const run = useCallback(() => {
    const id = ++latest.current
    loadRef.current().then(
      (data) => {
        if (id === latest.current) setState({ status: 'loaded', data })
      },
      () => {
        if (id === latest.current) setState({ status: 'error', retrying: false })
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
