import { describe, expect, it, vi } from 'vitest';
import { PgOrganizationsRepository } from './pg-organizations.repository';

const row = (over: Record<string, unknown> = {}) => ({
  id: 'o1',
  name: 'Hollywood Youth Arts Center',
  address: '6600 Sunset Blvd',
  admin_name: 'Tomas Reyes',
  admin_email: 'treyes@example.org',
  created_by: 'Daniel Gonzalez Bermudez',
  contact_name: 'Morgan Gould',
  contact_details: 'mgould@wfchocolate.com · (555) 218-4400',
  ...over,
});
const repoWith = (rows: unknown[]) => new PgOrganizationsRepository({ query: vi.fn().mockResolvedValue({ rows }) } as never);

describe('PgOrganizationsRepository', () => {
  it('maps a row with an admin', async () => {
    const [o] = await repoWith([row()]).findAll();
    expect(o.admin).toEqual({ name: 'Tomas Reyes', email: 'treyes@example.org' });
    expect(o.contact).toEqual({ name: 'Morgan Gould', details: 'mgould@wfchocolate.com · (555) 218-4400' });
    expect(o.createdBy).toBe('Daniel Gonzalez Bermudez');
  });

  it('maps a row without an admin to admin: null', async () => {
    const [o] = await repoWith([row({ admin_name: null, admin_email: null })]).findAll();
    expect(o.admin).toBeNull();
  });

  it('returns [] for an empty table', async () => {
    expect(await repoWith([]).findAll()).toEqual([]);
  });
});
