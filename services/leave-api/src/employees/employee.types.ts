export type EmployeeStatusFilter = 'active' | 'inactive' | 'all';

export interface EmployeeRow {
  id: string;
  displayName: string;
  email: string | null;
  jobTitle: string | null;
  department: string | null;
  active: boolean;
  managerId: string | null;
  managerName: string | null;
}

export interface ApprovalRow {
  id: string;
  status: string;
  routedManagerId: string | null;
  createdAt: string;
}

export interface EmployeeDto {
  id: string;
  displayName: string;
  email: string | null;
  jobTitle: string | null;
  department: string | null;
  status: 'active' | 'inactive';
  manager: { id: string; displayName: string } | null;
  flags: { noManager: boolean };
}

export interface EmployeeRecordDto extends EmployeeDto {
  approvals: ApprovalRow[];
}

export interface Caller {
  employeeId: string;
  isHr: boolean;
}
