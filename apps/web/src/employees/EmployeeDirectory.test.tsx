import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import type { Employee } from '../api/employees'
import EmployeeDirectory from './EmployeeDirectory'

const base: Employee = {
  id: 'e1',
  displayName: 'Asha Rao',
  email: null,
  jobTitle: null,
  department: null,
  status: 'active',
  manager: { id: 'm1', displayName: 'Meera Nair' },
  flags: { noManager: false },
}

function mockFetch(body: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('EmployeeDirectory', () => {
  it('AC11: requests active employees by default and shows name, manager and status', async () => {
    const fetchMock = mockFetch([base])
    render(<EmployeeDirectory onOpen={() => {}} />)
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toContain('/employees?status=active')
    expect(screen.getByText('Meera Nair')).toBeInTheDocument()
    expect(screen.getAllByText('Active').some((el) => el.classList.contains('badge-success'))).toBe(true)
  })

  it('AC6: rows have no edit controls', async () => {
    mockFetch([base])
    render(<EmployeeDirectory onOpen={() => {}} />)
    await screen.findByText('Asha Rao')
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('button', { name: /edit|change|assign/i })).toBeNull()
  })

  it('AC13: flags an employee without a manager', async () => {
    mockFetch([{ ...base, manager: null, flags: { noManager: true } }])
    render(<EmployeeDirectory onOpen={() => {}} />)
    expect(await screen.findByText(/No manager in Entra ID/)).toBeInTheDocument()
  })

  it('AC14: shows no flag for an employee with a manager', async () => {
    mockFetch([base])
    render(<EmployeeDirectory onOpen={() => {}} />)
    await screen.findByText('Asha Rao')
    expect(screen.queryByText(/No manager in Entra ID/)).toBeNull()
  })

  it('AC10: shows an inactive employee as inactive when the filter asks for them', async () => {
    const fetchMock = mockFetch([{ ...base, status: 'inactive' }])
    render(<EmployeeDirectory onOpen={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inactive' }))
    await waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('status=inactive'))
    await screen.findByText('Asha Rao')
    expect(screen.getAllByText('Inactive').some((el) => el.classList.contains('badge'))).toBe(true)
  })

  it('shows an empty state and an error state', async () => {
    mockFetch([])
    const { unmount } = render(<EmployeeDirectory onOpen={() => {}} />)
    expect(await screen.findByText('No employees')).toBeInTheDocument()
    unmount()
    mockFetch({}, false)
    render(<EmployeeDirectory onOpen={() => {}} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load employees')
  })
})
