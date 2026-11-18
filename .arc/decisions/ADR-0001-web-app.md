---
id: ADR-0001
category: component
title: Web App
status: accepted
superseded_by: null
component_id: comp_web_app
responsibility: Browser UI for employees (apply, balances, status, history, team calendar),
  managers (review, approve/reject, comment, team availability) and HR administrators
  (leave policies, employee records, reports).
kind: web_ui
split_reason: Browser client is a different runtime from the API (human's description)
talks_to:
- component_id: comp_leave_api
  interaction: sync
  evidence: 'proposed: browser client calls the API'
- component_id: comp_identity_provider
  interaction: sync
  evidence: 'human: Company SSO via Entra ID'
rule: The Web App talks only to the Leave API and holds no business rules of its own.
evidence: 'human: Leave Tracker Web Application used by employees, managers and HR
  administrators'
---

## Context

human: Leave Tracker Web Application used by employees, managers and HR administrators

## Decision

Browser UI for employees (apply, balances, status, history, team calendar), managers (review, approve/reject, comment, team availability) and HR administrators (leave policies, employee records, reports).

Kept separate because Browser client is a different runtime from the API (human's description).

## Talks to

- **Leave API** (sync) — proposed: browser client calls the API
- **Identity Provider** (sync) — human: Company SSO via Entra ID
