---
id: ADR-0002
category: component
title: Leave API
status: accepted
superseded_by: null
component_id: comp_leave_api
responsibility: Business logic and validation for leave requests, approvals, balances,
  employee/department data, leave policies and reports; enforces role-based access
  (Employee, Manager, HR Administrator).
kind: api_service
split_reason: Central API serving the web client; one API for all domains to start
  (proposed)
talks_to:
- component_id: comp_relational_database
  interaction: sync
  evidence: 'proposed: API persists leave data'
- component_id: comp_identity_provider
  interaction: sync
  evidence: 'human: Company SSO via Entra ID'
rule: All leave, balance and policy writes go through the Leave API, which enforces
  role-based access on every call.
evidence: 'human: submit/approve/cancel requests, balances, policy configuration,
  reports'
---

## Context

human: submit/approve/cancel requests, balances, policy configuration, reports

## Decision

Business logic and validation for leave requests, approvals, balances, employee/department data, leave policies and reports; enforces role-based access (Employee, Manager, HR Administrator).

Kept separate because Central API serving the web client; one API for all domains to start (proposed).

## Talks to

- **Relational Database** (sync) — proposed: API persists leave data
- **Identity Provider** (sync) — human: Company SSO via Entra ID
