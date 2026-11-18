import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CLOCK, Clock } from './clock';
import { LEAVE_POLICY, LeavePolicyPort } from './leave-policy.port';
import { LeaveRequest, LeaveRequestOptions, SubmitLeaveRequestInput } from './leave-request.types';
import { LEAVE_REQUEST_REPOSITORY, LeaveRequestRepository } from './leave-requests.repository';
import { countWorkingDays, isValidIsoDate } from './working-days';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function written(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

function plural(count: number): string {
  return `${count} ${count === 1 ? 'day' : 'days'}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;
const MAX_NOTE_LENGTH = 500;

function refuse(code: string, message: string, field?: 'start' | 'end' | 'type'): never {
  throw new UnprocessableEntityException({ code, message, field });
}

@Injectable()
export class LeaveRequestsService {
  constructor(
    @Inject(LEAVE_REQUEST_REPOSITORY) private readonly repository: LeaveRequestRepository,
    @Inject(LEAVE_POLICY) private readonly policy: LeavePolicyPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  options(employeeId: string): LeaveRequestOptions {
    return {
      leaveTypes: this.policy.leaveTypes(employeeId),
      holidays: this.policy.holidays(),
      approverName: this.policy.approverName(employeeId),
    };
  }

  listOwn(employeeId: string): LeaveRequest[] {
    return this.repository
      .listByEmployee(employeeId)
      .sort((a, b) => b.submittedOn.localeCompare(a.submittedOn) || b.id.localeCompare(a.id));
  }

  submit(employeeId: string, input: SubmitLeaveRequestInput): LeaveRequest {
    const { leaveTypeId, startDate, endDate, note } = input;

    if (!isValidIsoDate(startDate)) {
      refuse('invalid_date', 'Enter the first day of your leave as a whole date.', 'start');
    }
    if (!isValidIsoDate(endDate)) {
      refuse('invalid_date', 'Enter the last day of your leave as a whole date.', 'end');
    }
    if (endDate < startDate) {
      refuse(
        'invalid_date',
        `The last day is before the first day. Pick a last day on or after ${written(startDate)}.`,
        'end',
      );
    }

    const spanDays = (Date.parse(endDate) - Date.parse(startDate)) / DAY_MS;
    if (spanDays >= MAX_RANGE_DAYS) {
      refuse('range_too_long', 'Leave can cover at most one year. Shorten your dates or send two requests.', 'end');
    }
    if (note && note.length > MAX_NOTE_LENGTH) {
      refuse('note_too_long', `Keep your note under ${MAX_NOTE_LENGTH} characters.`);
    }

    const today = this.clock.today();
    if (startDate < today) {
      refuse(
        'in_the_past',
        `Leave can't start before today (${written(today)}). Pick today or a later first day.`,
        'start',
      );
    }

    const clash = this.repository
      .listByEmployee(employeeId)
      .find((r) => (r.status === 'pending' || r.status === 'approved') && r.startDate <= endDate && r.endDate >= startDate);
    if (clash) {
      refuse(
        'overlap',
        `You already have ${clash.status} leave from ${written(clash.startDate)} to ${written(clash.endDate)}. Change your dates so they don't overlap.`,
        'start',
      );
    }

    const holidays = new Set(this.policy.holidays().map((h) => h.date));
    const days = countWorkingDays(startDate, endDate, holidays);
    if (days === 0) {
      refuse('no_working_days', "These dates have no working days. Pick days that aren't weekends or company holidays.", 'end');
    }

    const leaveType = this.policy.leaveTypes(employeeId).find((t) => t.id === leaveTypeId);
    if (!leaveType) {
      refuse('unknown_leave_type', 'Choose one of your leave types.', 'type');
    }
    if (days > leaveType.availableDays) {
      refuse(
        'insufficient_balance',
        `You have ${plural(leaveType.availableDays)} of ${leaveType.name} available and this request needs ${days}. Shorten your dates or choose another leave type.`,
        'type',
      );
    }

    return this.repository.insert({
      id: randomUUID(),
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      days,
      status: 'pending',
      submittedOn: today,
      ...(note ? { note } : {}),
    });
  }

  cancel(employeeId: string, requestId: string): LeaveRequest {
    const request = this.repository.findById(requestId);
    if (!request || request.employeeId !== employeeId) {
      throw new NotFoundException({ code: 'not_found', message: 'That request could not be found.' });
    }
    if (request.status !== 'pending') {
      throw new ConflictException({
        code: 'not_cancellable',
        message: 'Only pending requests can be cancelled.',
      });
    }
    return this.repository.update({ ...request, status: 'cancelled' });
  }
}
