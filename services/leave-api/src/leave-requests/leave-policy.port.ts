import { Injectable } from '@nestjs/common';
import { Holiday, LeaveTypeOption } from './leave-request.types';

export interface LeavePolicyPort {
  leaveTypes(employeeId: string): LeaveTypeOption[];
  holidays(): Holiday[];
  approverName(employeeId: string): string;
}

export const LEAVE_POLICY = Symbol('LEAVE_POLICY');

/**
 * Seed data until the HR configuration and directory stories land.
 * Available days are the opening balance less approved days; pending requests reserve nothing.
 */
@Injectable()
export class InMemoryLeavePolicy implements LeavePolicyPort {
  leaveTypes(): LeaveTypeOption[] {
    return [
      { id: 'annual', name: 'Annual leave', availableDays: 10 },
      { id: 'casual', name: 'Casual leave', availableDays: 3 },
      { id: 'sick', name: 'Sick leave', availableDays: 2 },
    ];
  }

  holidays(): Holiday[] {
    return [
      { date: '2026-12-25', name: 'Christmas Day' },
      { date: '2027-01-01', name: "New Year's Day" },
    ];
  }

  approverName(): string {
    return 'your manager';
  }
}
