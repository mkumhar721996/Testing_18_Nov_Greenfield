CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entra_object_id text UNIQUE NOT NULL,
  display_name text NOT NULL,
  email text,
  job_title text,
  department text,
  manager_id uuid REFERENCES employees(id) ON DELETE RESTRICT,
  active boolean NOT NULL DEFAULT true,
  deactivated_at timestamptz,
  synced_at timestamptz NOT NULL
);

CREATE INDEX employees_manager_id_idx ON employees (manager_id);

CREATE TABLE leave_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('pending', 'blocked', 'approved', 'declined', 'cancelled')),
  routed_manager_id uuid REFERENCES employees(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX leave_approvals_employee_id_idx ON leave_approvals (employee_id);

CREATE TABLE entra_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL CHECK (status IN ('running', 'succeeded', 'partial', 'failed')),
  attempt int NOT NULL,
  fetched int NOT NULL DEFAULT 0,
  created int NOT NULL DEFAULT 0,
  updated int NOT NULL DEFAULT 0,
  deactivated int NOT NULL DEFAULT 0,
  skipped int NOT NULL DEFAULT 0,
  error text
);
