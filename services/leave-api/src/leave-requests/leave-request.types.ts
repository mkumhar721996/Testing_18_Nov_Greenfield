export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveRequestStatus;
  submittedOn: string;
  note?: string;
}

export interface SubmitLeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  note?: string;
}

export interface LeaveTypeOption {
  id: string;
  name: string;
  availableDays: number;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface LeaveRequestOptions {
  leaveTypes: LeaveTypeOption[];
  holidays: Holiday[];
  approverName: string;
}
