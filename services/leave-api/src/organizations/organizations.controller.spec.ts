import { describe, expect, it, vi } from 'vitest';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import type { Organization } from './organization';

const org = (name: string): Organization => ({
  id: name,
  name,
  address: '1 Main St',
  admin: null,
  createdBy: 'Test Creator',
  contact: { name: 'Test Contact', details: 'contact details' },
});

describe('OrganizationsController', () => {
  it('lists every organization', async () => {
    const repo = { findAll: vi.fn().mockResolvedValue([org('A'), org('B'), org('C')]) };
    const controller = new OrganizationsController(new OrganizationsService(repo));
    expect(await controller.list()).toHaveLength(3);
  });
});
