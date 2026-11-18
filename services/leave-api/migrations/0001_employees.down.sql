-- Manual rollback only: the migrate runner never runs *.down.sql files.
DROP TABLE IF EXISTS entra_sync_runs;
DROP TABLE IF EXISTS leave_approvals;
DROP TABLE IF EXISTS employees;
