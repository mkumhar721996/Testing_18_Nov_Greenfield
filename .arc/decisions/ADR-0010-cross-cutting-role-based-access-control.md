---
id: ADR-0010
category: cross_cutting
title: 'Cross-cutting: Role-based access control'
status: accepted
superseded_by: null
component_id: null
rule: Every Leave API endpoint checks the caller's role and, for managers, that the
  target employee reports to them.
decision: 'Three roles: Employee (own requests and balances, team calendar), Manager
  (their reports'' requests), HR Administrator (policies, employee records, reports).
  Enforced in the Leave API.'
evidence: 'human: employees, managers and HR administrators with distinct capabilities'
---

## Context

human: employees, managers and HR administrators with distinct capabilities

## Decision

Three roles: Employee (own requests and balances, team calendar), Manager (their reports' requests), HR Administrator (policies, employee records, reports). Enforced in the Leave API.
