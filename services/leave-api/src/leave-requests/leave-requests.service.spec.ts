import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Clock } from './clock';
import { InMemoryLeavePolicy } from './leave-policy.port';
import { LeaveRequest, LeaveRequestStatus } from './leave-request.types';
import { InMemoryLeaveRequestRepository } from './leave-requests.repository';
import { LeaveRequestsService } from './leave-requests.service';

class FakeClock implements Clock {
  constructor(private date = '2026-11-18') {}
  today() {
    return this.date;
  }
  set(date: string) {
    this.date = date;
  }
}

const refusal = (code: string, status = 422) =>
  expect.objectContaining({ status, response: expect.objectContaining({ code }) });

describe('LeaveRequestsService', () => {
  let repository: InMemoryLeaveRequestRepository;
  let clock: FakeClock;
  let service: LeaveRequestsService;
  let seeded = 0;

  const seed = (
    employeeId: string,
    { start, end, status }: { start: string; end: string; status: LeaveRequestStatus },
  ): LeaveRequest =>
    repository.insert({
      id: `seed-${(seeded += 1)}`,
      employeeId,
      leaveTypeId: 'annual',
      startDate: start,
      endDate: end,
      days: 3,
      status,
      submittedOn: '2026-11-03',
    });

  beforeEach(() => {
    repository = new InMemoryLeaveRequestRepository();
    clock = new FakeClock();
    service = new LeaveRequestsService(repository, new InMemoryLeavePolicy(), clock);
  });

  it('AC1: stores a funded whole-day request as pending and lists it', () => {
    const r = service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-12-08', endDate: '2026-12-10' });
    expect(r.status).toBe('pending');
    expect(service.listOwn('emp-a').map((x) => x.id)).toContain(r.id);
  });

  it('AC2: refuses dates that carry a time of day or half-day suffix', () => {
    expect(() =>
      service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-12-08T12:00', endDate: '2026-12-10' }),
    ).toThrowError(refusal('invalid_date'));
    expect(() =>
      service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-12-08', endDate: '2026-12-10 AM' }),
    ).toThrowError(refusal('invalid_date'));
  });

  it('refuses an end date before the start date', () => {
    expect(() =>
      service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-12-10', endDate: '2026-12-08' }),
    ).toThrowError(refusal('invalid_date'));
  });

  it('AC3: refuses 4 days when 3 are available, storing nothing', () => {
    expect(() =>
      service.submit('emp-a', { leaveTypeId: 'casual', startDate: '2026-11-23', endDate: '2026-11-26' }),
    ).toThrowError(refusal('insufficient_balance'));
    expect(service.listOwn('emp-a')).toHaveLength(0);
  });

  it('AC4: accepts exactly the available days', () => {
    const r = service.submit('emp-a', { leaveTypeId: 'casual', startDate: '2026-11-30', endDate: '2026-12-02' });
    expect(r.days).toBe(3);
    expect(r.status).toBe('pending');
  });

  it.each(['pending', 'approved'] as const)('AC5: refuses overlap with a %s request', (status) => {
    seed('emp-a', { start: '2027-03-08', end: '2027-03-10', status });
    expect(() =>
      service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2027-03-10', endDate: '2027-03-11' }),
    ).toThrowError(refusal('overlap'));
  });

  it.each(['rejected', 'cancelled'] as const)('AC5: allows the dates of a %s request', (status) => {
    seed('emp-a', { start: '2027-03-08', end: '2027-03-10', status });
    const r = service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2027-03-10', endDate: '2027-03-11' });
    expect(r.status).toBe('pending');
  });

  it('AC5: another employee’s request does not block', () => {
    seed('emp-b', { start: '2027-03-08', end: '2027-03-10', status: 'approved' });
    const r = service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2027-03-10', endDate: '2027-03-10' });
    expect(r.status).toBe('pending');
  });

  it.each(['pending', 'approved', 'rejected', 'cancelled'] as const)('AC6: lists a %s request unchanged', (status) => {
    const s = seed('emp-a', { start: '2027-03-08', end: '2027-03-10', status });
    expect(service.listOwn('emp-a').find((x) => x.id === s.id)?.status).toBe(status);
  });

  it('AC7: lists only the caller’s requests', () => {
    seed('emp-a', { start: '2027-03-08', end: '2027-03-10', status: 'pending' });
    seed('emp-a', { start: '2027-04-08', end: '2027-04-10', status: 'approved' });
    seed('emp-b', { start: '2027-03-08', end: '2027-03-10', status: 'pending' });
    expect(service.listOwn('emp-a')).toHaveLength(2);
    expect(service.listOwn('emp-a').every((r) => r.employeeId === 'emp-a')).toBe(true);
  });

  it('lists the newest submitted first', () => {
    const first = service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-12-08', endDate: '2026-12-08' });
    clock.set('2026-11-19');
    const second = service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-12-10', endDate: '2026-12-10' });
    expect(service.listOwn('emp-a').map((r) => r.id)).toEqual([second.id, first.id]);
  });

  it('AC8: a pending request stays pending as time passes', () => {
    const r = service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-12-08', endDate: '2026-12-10' });
    clock.set('2026-12-20');
    expect(service.listOwn('emp-a').find((x) => x.id === r.id)?.status).toBe('pending');
  });

  it('AC9: nothing is sent or scheduled as time passes', () => {
    vi.useFakeTimers();
    try {
      const policy = new InMemoryLeavePolicy();
      const deps = { repository, policy, clock };
      const insert = vi.spyOn(repository, 'insert');
      const update = vi.spyOn(repository, 'update');
      const guarded = new LeaveRequestsService(deps.repository, deps.policy, deps.clock);
      guarded.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-12-08', endDate: '2026-12-10' });
      vi.advanceTimersByTime(30 * 24 * 3600 * 1000);
      guarded.listOwn('emp-a');
      expect(insert).toHaveBeenCalledTimes(1);
      expect(update).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      expect(Object.keys(deps)).not.toContain('notifier');
    } finally {
      vi.useRealTimers();
    }
  });

  it('AC10: cancels a pending request', () => {
    const r = service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-12-08', endDate: '2026-12-10' });
    expect(service.cancel('emp-a', r.id).status).toBe('cancelled');
    expect(service.listOwn('emp-a')[0].status).toBe('cancelled');
  });

  it.each(['approved', 'rejected', 'cancelled'] as const)('AC11: refuses to cancel a %s request', (status) => {
    const s = seed('emp-a', { start: '2027-03-08', end: '2027-03-10', status });
    expect(() => service.cancel('emp-a', s.id)).toThrowError(refusal('not_cancellable', 409));
  });

  it('refuses to cancel a missing request or another employee’s request', () => {
    const s = seed('emp-b', { start: '2027-03-08', end: '2027-03-10', status: 'pending' });
    expect(() => service.cancel('emp-a', s.id)).toThrowError(expect.objectContaining({ status: 404 }));
    expect(() => service.cancel('emp-a', 'missing')).toThrowError(expect.objectContaining({ status: 404 }));
    expect(repository.findById(s.id)?.status).toBe('pending');
  });

  it('AC12: refuses dates before today but accepts starting today', () => {
    expect(() =>
      service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-11-16', endDate: '2026-11-17' }),
    ).toThrowError(refusal('in_the_past'));
    const r = service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-11-18', endDate: '2026-11-18' });
    expect(r.status).toBe('pending');
  });

  it('AC13: a company holiday inside the request is not counted against the balance', () => {
    const r = service.submit('emp-a', { leaveTypeId: 'sick', startDate: '2026-12-23', endDate: '2026-12-25' });
    expect(r.days).toBe(2);
    expect(r.status).toBe('pending');
  });

  it('refuses dates with no working days', () => {
    expect(() =>
      service.submit('emp-a', { leaveTypeId: 'annual', startDate: '2026-12-12', endDate: '2026-12-13' }),
    ).toThrowError(refusal('no_working_days'));
  });

  it('refuses an unknown leave type', () => {
    expect(() =>
      service.submit('emp-a', { leaveTypeId: 'sabbatical', startDate: '2026-12-08', endDate: '2026-12-08' }),
    ).toThrowError(refusal('unknown_leave_type'));
  });
});
