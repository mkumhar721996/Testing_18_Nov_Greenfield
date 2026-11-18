import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchOrganizations } from './api'
import OrganizationsPage from './OrganizationsPage'
import type { Organization } from './types'

vi.mock('./api')

const contact = { name: 'Aisha Patel', details: 'apatel@example.com · (555) 000-1111' }
const assigned: Organization = {
  id: '1',
  name: 'Hollywood Youth Arts Center',
  address: '6600 Sunset Blvd, Los Angeles CA 90028',
  admin: { name: 'Tomas Reyes', email: 'treyes@example.com' },
  createdBy: 'Daniel Gonzalez Bermudez',
  contact,
}
const unassigned: Organization = {
  id: '2',
  name: 'Watts Community Library',
  address: '1822 E 103rd St, Los Angeles CA 90002',
  admin: null,
  createdBy: 'Daniel Gonzalez Bermudez',
  contact,
}
const third: Organization = { ...assigned, id: '3', name: 'Alain Leroy Locke College Prep Academy' }
const three = [third, assigned, unassigned]

const mocked = vi.mocked(fetchOrganizations)

beforeEach(() => {
  mocked.mockReset()
})

describe('OrganizationsPage', () => {
  it('shows one row per organization (AC1)', async () => {
    mocked.mockResolvedValue(three)
    render(<OrganizationsPage />)
    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
  })

  it('shows the assigned panel for an organization with an admin (AC2)', async () => {
    mocked.mockResolvedValue(three)
    const user = userEvent.setup()
    render(<OrganizationsPage />)
    await user.click(await screen.findByRole('button', { name: assigned.name }))
    const panel = screen.getByTestId('org-detail-panel')
    expect(within(panel).getByRole('heading', { name: assigned.name })).toBeInTheDocument()
    expect(within(panel).getByText(assigned.address)).toBeInTheDocument()
    expect(within(panel).getByText('Tomas Reyes')).toBeInTheDocument()
    expect(within(panel).getByText('Daniel Gonzalez Bermudez')).toBeInTheDocument()
    expect(within(panel).getByText('Aisha Patel')).toBeInTheDocument()
    expect(within(panel).getByText(contact.details)).toBeInTheDocument()
  })

  it('shows the unassigned panel instead of the assigned one (AC3)', async () => {
    mocked.mockResolvedValue(three)
    const user = userEvent.setup()
    render(<OrganizationsPage />)
    await user.click(await screen.findByRole('button', { name: /^Watts Community Library/ }))
    expect(screen.getByTestId('org-detail-panel-unassigned')).toBeInTheDocument()
    expect(screen.queryByTestId('org-detail-panel')).not.toBeInTheDocument()
  })

  it('shows the unassigned details with admin unassigned (AC4)', async () => {
    mocked.mockResolvedValue(three)
    const user = userEvent.setup()
    render(<OrganizationsPage />)
    await user.click(await screen.findByRole('button', { name: /^Watts Community Library/ }))
    const panel = screen.getByTestId('org-detail-panel-unassigned')
    expect(within(panel).getByRole('heading', { name: unassigned.name })).toBeInTheDocument()
    expect(within(panel).getByText(unassigned.address)).toBeInTheDocument()
    expect(within(panel).getByText('Daniel Gonzalez Bermudez')).toBeInTheDocument()
    expect(within(panel).getByText('Aisha Patel')).toBeInTheDocument()
    expect(within(panel).getByText(contact.details)).toBeInTheDocument()
    expect(within(panel).getByText('Unassigned')).toBeInTheDocument()
  })

  it('shows "No organizations yet" when there are none (AC5)', async () => {
    mocked.mockResolvedValue([])
    render(<OrganizationsPage />)
    expect(await screen.findByText('No organizations yet')).toBeInTheDocument()
  })

  it('has no action in the empty state (AC6)', async () => {
    mocked.mockResolvedValue([])
    render(<OrganizationsPage />)
    const empty = (await screen.findByText('No organizations yet')).closest('.empty-state')!
    expect(within(empty as HTMLElement).queryByRole('button')).toBeNull()
    expect(within(empty as HTMLElement).queryByRole('link')).toBeNull()
  })

  it('shows a loading skeleton in place of rows (AC7)', () => {
    mocked.mockReturnValue(new Promise(() => {}))
    render(<OrganizationsPage />)
    expect(screen.getByRole('status', { name: 'Loading organizations' })).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).toBeNull()
  })

  it('shows an alert when loading fails (AC8)', async () => {
    mocked.mockRejectedValue(new Error('boom'))
    render(<OrganizationsPage />)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('shows a Try again control in the alert (AC9)', async () => {
    mocked.mockRejectedValue(new Error('boom'))
    render(<OrganizationsPage />)
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('reloads and shows the skeleton again on Try again (AC10)', async () => {
    let resolve!: (orgs: Organization[]) => void
    mocked.mockRejectedValueOnce(new Error('boom')).mockReturnValueOnce(
      new Promise<Organization[]>((r) => {
        resolve = r
      }),
    )
    const user = userEvent.setup()
    render(<OrganizationsPage />)
    await user.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(mocked).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('status', { name: 'Loading organizations' })).toBeInTheDocument()
    resolve(three)
    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
  })

  it('prompts to select an organization when none is selected (AC11)', async () => {
    mocked.mockResolvedValue(three)
    render(<OrganizationsPage />)
    expect(await screen.findByText('Select an organization')).toBeInTheDocument()
    expect(screen.queryByTestId('org-detail-panel')).toBeNull()
    expect(screen.queryByTestId('org-detail-panel-unassigned')).toBeNull()
  })

  it('offers no edit, delete or create actions', async () => {
    mocked.mockResolvedValue(three)
    const user = userEvent.setup()
    render(<OrganizationsPage />)
    await user.click(await screen.findByRole('button', { name: assigned.name }))
    expect(screen.queryByRole('button', { name: /edit|delete|create|add/i })).toBeNull()
  })
})
