import { describe, expect, it } from 'vitest';
import { planSync, type EntraUser, type ExistingEmployee, type PendingApproval } from './plan-sync.js';

function user(over: Partial<EntraUser> = {}): EntraUser {
  return {
    id: 'e1',
    displayName: 'Asha Rao',
    email: null,
    jobTitle: null,
    department: null,
    accountEnabled: true,
    managerId: null,
    ...over,
  };
}

function existing(over: Partial<ExistingEmployee> = {}): ExistingEmployee {
  return {
    id: 'e1-uuid',
    entraId: 'e1',
    displayName: 'Asha Rao',
    email: null,
    jobTitle: null,
    department: null,
    managerEntraId: null,
    active: true,
    ...over,
  };
}

function approval(over: Partial<PendingApproval> = {}): PendingApproval {
  return { id: 'a1', employeeId: 'e1-uuid', status: 'pending', routedManagerId: null, ...over };
}

describe('planSync', () => {
  it('AC1: creates an employee unknown to the app', () => {
    const plan = planSync([user({ id: 'e1', displayName: 'Asha Rao' })], [], []);
    expect(plan.create.map((e) => e.entraId)).toEqual(['e1']);
  });

  it('AC2: carries the Entra manager onto a created employee', () => {
    const plan = planSync([user({ id: 'm1' }), user({ id: 'e1', managerId: 'm1' })], [], []);
    expect(plan.create.find((e) => e.entraId === 'e1')?.managerEntraId).toBe('m1');
  });

  it('AC3: updates only changed details and leaves unchanged employees alone', () => {
    const changed = planSync([user({ jobTitle: 'Lead' })], [existing({ jobTitle: 'Analyst' })], []);
    expect(changed.update[0].changes).toEqual({ jobTitle: 'Lead' });
    expect(planSync([user()], [existing()], []).update).toEqual([]);
  });

  it('AC4: Entra name wins over the app name', () => {
    const plan = planSync([user()], [existing({ displayName: 'A. Rao' })], []);
    expect(plan.update[0].changes.displayName).toBe('Asha Rao');
  });

  it('AC5: a changed manager is updated', () => {
    const snapshot = [user({ id: 'm1' }), user({ id: 'm2' }), user({ managerId: 'm2' })];
    const known = [
      existing({ id: 'm1-uuid', entraId: 'm1', displayName: 'M1' }),
      existing({ id: 'm2-uuid', entraId: 'm2', displayName: 'M1' }),
      existing({ managerEntraId: 'm1' }),
    ];
    const plan = planSync(snapshot, known, []);
    expect(plan.update.find((u) => u.entraId === 'e1')?.changes.managerEntraId).toBe('m2');
  });

  it('AC5: a manager no longer in Entra is cleared', () => {
    const plan = planSync([user({ managerId: null })], [existing({ managerEntraId: 'm1' })], []);
    expect(plan.update[0].changes.managerEntraId).toBeNull();
  });

  describe('AC8: approvals blocked', () => {
    const m1 = existing({ id: 'm1-uuid', entraId: 'm1', displayName: 'M1' });
    const e1 = existing({ managerEntraId: 'm1' });
    const blocked = [{ id: 'a1', status: 'blocked', routedManagerId: null }];

    it('when the manager is disabled', () => {
      const plan = planSync(
        [user({ id: 'm1', accountEnabled: false }), user({ managerId: 'm1' })],
        [m1, e1],
        [approval({ routedManagerId: 'm1-uuid' })],
      );
      expect(plan.approvals).toEqual(blocked);
    });

    it('when the manager is absent from the snapshot', () => {
      const plan = planSync([user({ managerId: 'm1' })], [m1, e1], [approval({ routedManagerId: 'm1-uuid' })]);
      expect(plan.approvals).toEqual(blocked);
    });

    it('when the employee has no manager', () => {
      const plan = planSync([user()], [existing()], [approval()]);
      expect(plan.approvals).toEqual(blocked);
    });
  });

  it('AC9: a blocked approval is routed to the new active manager', () => {
    const plan = planSync(
      [user({ id: 'm2' }), user({ managerId: 'm2' })],
      [existing({ id: 'm2-uuid', entraId: 'm2', displayName: 'M2' }), existing()],
      [approval({ status: 'blocked' })],
    );
    expect(plan.approvals).toEqual([{ id: 'a1', status: 'pending', routedManagerId: 'm2-uuid' }]);
  });

  it('leaves an already correctly routed approval untouched', () => {
    const plan = planSync(
      [user({ id: 'm2' }), user({ managerId: 'm2' })],
      [existing({ id: 'm2-uuid', entraId: 'm2', displayName: 'M2' }), existing()],
      [approval({ routedManagerId: 'm2-uuid' })],
    );
    expect(plan.approvals).toEqual([]);
  });

  describe('AC10: deactivation', () => {
    it('when the user is disabled in Entra', () => {
      const plan = planSync([user({ accountEnabled: false })], [existing()], []);
      expect(plan.deactivate).toEqual(['e1-uuid']);
    });

    it('when the user is missing from the snapshot', () => {
      const plan = planSync([user({ id: 'other' })], [existing()], []);
      expect(plan.deactivate).toEqual(['e1-uuid']);
    });

    it('does not deactivate twice and reactivates a returning user', () => {
      expect(planSync([user({ accountEnabled: false })], [existing({ active: false })], []).deactivate).toEqual([]);
      expect(planSync([user()], [existing({ active: false })], []).reactivate).toEqual(['e1-uuid']);
    });
  });

  it('skips entries without id or display name and counts them', () => {
    const plan = planSync([user({ id: '' }), user({ id: 'x', displayName: null }), user({ id: 'ok' })], [], []);
    expect(plan.skipped).toBe(2);
    expect(plan.create.map((e) => e.entraId)).toEqual(['ok']);
  });

  it('does not deactivate anyone when no usable entry was received', () => {
    const plan = planSync([user({ id: '' })], [existing()], []);
    expect(plan.deactivate).toEqual([]);
  });
});
