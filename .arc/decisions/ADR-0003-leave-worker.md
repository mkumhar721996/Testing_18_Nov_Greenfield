---
id: ADR-0003
category: component
title: Leave Worker
status: accepted
superseded_by: null
component_id: comp_leave_worker
responsibility: 'Scheduled and background jobs: leave accrual, carry-forward processing,
  and notifications on request status changes.'
kind: worker
split_reason: Scheduled jobs with a different runtime profile from request/response
  API (proposed from accrual and carry-forward policies)
talks_to:
- component_id: comp_relational_database
  interaction: sync
  evidence: 'proposed: jobs read and update balances and requests'
rule: Accrual, carry-forward and notification jobs run only in the Leave Worker, never
  in request handlers.
evidence: 'human: leave accrual and carry-forward policies; track approval status'
---

## Context

human: leave accrual and carry-forward policies; track approval status

## Decision

Scheduled and background jobs: leave accrual, carry-forward processing, and notifications on request status changes.

Kept separate because Scheduled jobs with a different runtime profile from request/response API (proposed from accrual and carry-forward policies).

## Talks to

- **Relational Database** (sync) — proposed: jobs read and update balances and requests
