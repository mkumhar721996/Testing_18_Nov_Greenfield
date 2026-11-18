export interface EntraUser {
  id: string;
  displayName: string | null;
  email: string | null;
  jobTitle: string | null;
  department: string | null;
  accountEnabled: boolean;
  managerId: string | null;
}

export interface ExistingEmployee {
  id: string;
  entraId: string;
  displayName: string;
  email: string | null;
  jobTitle: string | null;
  department: string | null;
  managerEntraId: string | null;
  active: boolean;
}

export interface PendingApproval {
  id: string;
  employeeId: string;
  status: 'pending' | 'blocked';
  routedManagerId: string | null;
}

export interface EmployeeFields {
  displayName: string;
  email: string | null;
  jobTitle: string | null;
  department: string | null;
  managerEntraId: string | null;
}

export interface CreateEmployee extends EmployeeFields {
  entraId: string;
  active: boolean;
}

export interface UpdateEmployee {
  id: string;
  entraId: string;
  changes: Partial<EmployeeFields>;
}

export interface ApprovalChange {
  id: string;
  status: 'pending' | 'blocked';
  routedManagerId: string | null;
  /** Set when the manager is created in this same run and has no stored id yet. */
  routedManagerEntraId?: string;
}

export interface SyncPlan {
  create: CreateEmployee[];
  update: UpdateEmployee[];
  reactivate: string[];
  deactivate: string[];
  approvals: ApprovalChange[];
  skipped: number;
}

const DETAIL_KEYS = ['displayName', 'email', 'jobTitle', 'department', 'managerEntraId'] as const;

/**
 * Pure diff of the Entra ID snapshot against the stored employees. Entra always wins:
 * nothing entered in the app is read back. Employees are never deleted, only deactivated.
 */
export function planSync(
  snapshot: EntraUser[],
  existing: ExistingEmployee[],
  approvals: PendingApproval[],
): SyncPlan {
  const usable = snapshot.filter((u) => u.id && u.displayName);
  const plan: SyncPlan = {
    create: [],
    update: [],
    reactivate: [],
    deactivate: [],
    approvals: [],
    skipped: snapshot.length - usable.length,
  };
  // Nothing usable means a bad fetch, not an empty company: never deactivate everyone.
  if (usable.length === 0) return plan;

  const byEntraId = new Map(usable.map((u) => [u.id, u]));
  const stored = new Map(existing.map((e) => [e.entraId, e]));
  const storedById = new Map(existing.map((e) => [e.id, e]));
  // A manager link only counts when the manager is a known user in the snapshot.
  const managerOf = (u: EntraUser) => (u.managerId && byEntraId.has(u.managerId) ? u.managerId : null);

  for (const u of usable) {
    const fields: EmployeeFields = {
      displayName: u.displayName as string,
      email: u.email,
      jobTitle: u.jobTitle,
      department: u.department,
      managerEntraId: managerOf(u),
    };
    const current = stored.get(u.id);
    if (!current) {
      plan.create.push({ entraId: u.id, active: u.accountEnabled, ...fields });
      continue;
    }
    const changes: Partial<EmployeeFields> = {};
    for (const key of DETAIL_KEYS) {
      if (current[key] !== fields[key]) (changes as Record<string, unknown>)[key] = fields[key];
    }
    if (Object.keys(changes).length > 0) plan.update.push({ id: current.id, entraId: u.id, changes });
    if (current.active && !u.accountEnabled) plan.deactivate.push(current.id);
    if (!current.active && u.accountEnabled) plan.reactivate.push(current.id);
  }
  for (const e of existing) {
    if (e.active && !byEntraId.has(e.entraId)) plan.deactivate.push(e.id);
  }

  // A manager created in this run has no id yet: the approval carries the Entra id and the
  // store resolves it inside the same transaction.
  const activeManager = (employeeId: string): { id: string | null; entraId: string } | null => {
    const employee = storedById.get(employeeId);
    const user = employee && byEntraId.get(employee.entraId);
    const managerEntraId = user && user.accountEnabled ? managerOf(user) : null;
    const manager = managerEntraId ? byEntraId.get(managerEntraId) : undefined;
    return manager?.accountEnabled ? { id: stored.get(manager.id)?.id ?? null, entraId: manager.id } : null;
  };
  for (const a of approvals) {
    const manager = activeManager(a.employeeId);
    const routedManagerId = manager?.id ?? null;
    const status = manager ? 'pending' : 'blocked';
    if (a.status !== status || a.routedManagerId !== routedManagerId || (manager && !manager.id)) {
      plan.approvals.push({
        id: a.id,
        status,
        routedManagerId,
        ...(manager && !manager.id ? { routedManagerEntraId: manager.entraId } : {}),
      });
    }
  }
  return plan;
}
