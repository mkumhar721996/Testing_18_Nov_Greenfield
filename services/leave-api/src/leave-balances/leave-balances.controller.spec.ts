import { describe, expect, it, vi } from 'vitest';
import { LeaveBalancesController } from './leave-balances.controller';
import { LeaveBalancesService } from './leave-balances.service';

describe('LeaveBalancesController', () => {
  it('AC3: passes the principal employee id and nothing else', async () => {
    const getForEmployee = vi.fn().mockResolvedValue({ asOf: '2026-11-18', balances: [] });
    const controller = new LeaveBalancesController({
      getForEmployee,
    } as unknown as LeaveBalancesService);

    const res = await controller.getMine('emp-a');

    expect(getForEmployee).toHaveBeenCalledWith('emp-a');
    expect(getForEmployee).not.toHaveBeenCalledWith('emp-b');
    expect(res).toEqual({ asOf: '2026-11-18', balances: [] });
  });
});
