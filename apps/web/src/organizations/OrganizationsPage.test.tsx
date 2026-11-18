import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchOrganizations } from './api'
import OrganizationsPage from './OrganizationsPage'
import type { Organization } from './types'

vi.mock('./api')

const contact = { name: 'Aisha Patel', details: 'apatel@wfchocolate.com · (555) 340-1177' }
const hollywood: Organization = {
  id: 'o2',
  name: 'Hollywood Youth Arts Center',
  address: '6600 Sunset Blvd, Los Angeles CA 90028',
  admin: { name: 'Tomas Reyes', email: 'treyes@hyac.example.org' },
  createdBy: 'Daniel Gonzalez Bermudez',
  contact,
}
const watts: Organization = {
  id: 'o3',
  name: 'Watts Community Library',
  address: '1822 E 103rd St, Los Angeles CA 90002',
  admin: null,
  createdBy: 'Daniel Gonzalez Bermudez',
  contact: { name: 'Morgan Gould', details: 'mgould@wfchocolate.com · (555) 218-4400' },
}
const alain: Organization = { ...hollywood, id: 'o1', name: 'Alain Leroy Locke College Prep Academy' }
const three = [alain, hollywood, watts]
const fetchMock = vi.mocked(fetchOrganizations)

beforeEach(() => {
  fetchMock.mockReset()
})

describe('OrganizationsPage', () => {
  it('shows one row per organization (AC1)', async () => {
    fetchMock.mockResolvedValue(three)
    render(<OrganizationsPage />)
    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
  })

  it('shows the assigned panel with all details (AC2)', async () => {
    fetchMock.mockResolvedValue(three)
    render(<OrganizationsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Hollywood Youth Arts Center' }))
    const panel = screen.getByTestId('org-detail-panel')
    expect(within(panel).getByRole('heading', { name: 'Hollywood Youth Arts Center' })).toBeInTheDocument()
    expect(within(panel).getByText('6600 Sunset Blvd, Los Angeles CA 90028')).toBeInTheDocument()
    expect(within(panel).getByText('Tomas Reyes')).toBeInTheDocument()
    expect(within(panel).getByText('treyes@hyac.example.org')).toBeInTheDocument()
    expect(within(panel).getByText('Daniel Gonzalez Bermudez')).toBeInTheDocument()
    expect(within(panel).getByText('Aisha Patel')).toBeInTheDocument()
    expect(within(panel).getByText(contact.details)).toBeInTheDocument()
  })

  it('shows the unassigned panel instead of the assigned one (AC3)', async () => {
    fetchMock.mockResolvedValue(three)
    render(<OrganizationsPage />)
    // the row button's name also carries the "Admin unassigned" badge
    await userEvent.click(await screen.findByRole('button', { name: /^Watts Community Library/ }))
    expect(screen.getByTestId('org-detail-panel-unassigned')).toBeInTheDocument()
    expect(screen.queryByTestId('org-detail-panel')).not.toBeInTheDocument()
  })

  it('shows details and "Unassigned" admin in the unassigned panel (AC4)', async () => {
    fetchMock.mockResolvedValue(three)
    render(<OrganizationsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Open details for Watts Community Library' }))
    const panel = screen.getByTestId('org-detail-panel-unassigned')
    expect(within(panel).getByRole('heading', { name: 'Watts Community Library' })).toBeInTheDocument()
    expect(within(panel).getByText('1822 E 103rd St, Los Angeles CA 90002')).toBeInTheDocument()
    expect(within(panel).getByText('Daniel Gonzalez Bermudez')).toBeInTheDocument()
    expect(within(panel).getByText('Morgan Gould')).toBeInTheDocument()
    expect(within(panel).getByText('mgould@wfchocolate.com · (555) 218-4400')).toBeInTheDocument()
    expect(within(panel).getByText('Unassigned')).toBeInTheDocument()
  })

  it('shows "No organizations yet" when empty (AC5)', async () => {
    fetchMock.mockResolvedValue([])
    render(<OrganizationsPage />)
    expect(await screen.findByText('No organizations yet')).toBeInTheDocument()
  })

  it('shows no action control in the empty state (AC6)', async () => {
    fetchMock.mockResolvedValue([])
    render(<OrganizationsPage />)
    const empty = (await screen.findByText('No organizations yet')).closest('.empty-state')!
    expect(within(empty as HTMLElement).queryByRole('button')).toBeNull()
    expect(within(empty as HTMLElement).queryByRole('link')).toBeNull()
  })

  it('shows a loading skeleton in place of rows while fetching (AC7)', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    render(<OrganizationsPage />)
    expect(screen.getByRole('status', { name: 'Loading organizations' })).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).toBeNull()
  })

  it('shows an alert when loading fails (AC8)', async () => {
    fetchMock.mockRejectedValue(new Error('boom'))
    render(<OrganizationsPage />)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('shows Try again inside the alert (AC9)', async () => {
    fetchMock.mockRejectedValue(new Error('boom'))
    render(<OrganizationsPage />)
    expect(within(await screen.findByRole('alert')).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('reloads and shows the skeleton again on Try again (AC10)', async () => {
    let resolve!: (orgs: Organization[]) => void
    fetchMock.mockRejectedValueOnce(new Error('boom')).mockReturnValueOnce(new Promise((r) => (resolve = r)))
    render(<OrganizationsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('status', { name: 'Loading organizations' })).toBeInTheDocument()
    resolve(three)
    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
  })

  it('prompts to select an organization when none is selected (AC11)', async () => {
    fetchMock.mockResolvedValue(three)
    render(<OrganizationsPage />)
    expect(await screen.findByText('Select an organization')).toBeInTheDocument()
    expect(screen.queryByTestId('org-detail-panel')).toBeNull()
    expect(screen.queryByTestId('org-detail-panel-unassigned')).toBeNull()
  })

  it('offers no edit, delete or create control', async () => {
    fetchMock.mockResolvedValue(three)
    render(<OrganizationsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Hollywood Youth Arts Center' }))
    expect(screen.queryByRole('button', { name: /edit|delete|create|add/i })).toBeNull()
  })
})
