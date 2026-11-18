import { describe, expect, it, vi } from 'vitest';
import type { Organization } from './organization';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

const org = (id: string): Organization => ({
  id,
  name: `Org ${id}`,
  address: '1 Main St',
  admin: null,
  createdBy: 'Daniel Gonzalez Bermudez',
  contact: { name: 'Morgan Gould', details: 'mgould@wfchocolate.com' },
});

describe('OrganizationsController', () => {
  it('lists every organization', async () => {
    const repo = { findAll: vi.fn().mockResolvedValue([org('a'), org('b'), org('c')]) };
    const controller = new OrganizationsController(new OrganizationsService(repo));
    expect(await controller.list()).toHaveLength(3);
  });
});
