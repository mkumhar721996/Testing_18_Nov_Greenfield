import { render, screen } from '@testing-library/react'
import type { Employee } from '../api/employees'
import EmployeeRecord from './EmployeeRecord'

const employee: Employee = {
  id: 'e1',
  displayName: 'Asha Rao',
  email: 'asha@example.test',
  jobTitle: 'Analyst',
  department: 'Finance',
  status: 'active',
  manager: { id: 'm1', displayName: 'Meera Nair' },
  flags: { noManager: false },
}

describe('EmployeeRecord', () => {
  it('AC6: renders no control to edit the name or manager', () => {
    render(<EmployeeRecord employee={employee} approvals={[]} />)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('button', { name: /edit|change|assign/i })).toBeNull()
    expect(screen.getByText('Meera Nair')).toBeInTheDocument()
  })

  it('AC12: an inactive employee still shows details and leave history', () => {
    render(
      <EmployeeRecord
        employee={{ ...employee, status: 'inactive' }}
        approvals={[{ id: 'a1', status: 'approved', routedManagerId: null, createdAt: '2026-01-01' }]}
      />,
    )
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.getByText('approved')).toBeInTheDocument()
  })

  it('AC13/AC14: shows the no-manager flag only when flagged', () => {
    const { rerender } = render(
      <EmployeeRecord employee={{ ...employee, manager: null, flags: { noManager: true } }} approvals={[]} />,
    )
    expect(screen.getByText(/No manager in Entra ID/)).toBeInTheDocument()
    rerender(<EmployeeRecord employee={employee} approvals={[]} />)
    expect(screen.queryByText(/No manager in Entra ID/)).toBeNull()
  })
})
