---
id: ADR-0012
category: cross_cutting
title: 'Cross-cutting: Data residency'
status: accepted
superseded_by: null
component_id: null
rule: Store all data and backups only in AWS ap-south-1 (India); never replicate outside
  India.
decision: All employee and leave data, including backups, stays in India; single AWS
  region ap-south-1 (Mumbai), no cross-border replicas.
evidence: 'human: "Data must stay in one named country"; "India (Mumbai)"'
---

## Context

human: "Data must stay in one named country"; "India (Mumbai)"

## Decision

All employee and leave data, including backups, stays in India; single AWS region ap-south-1 (Mumbai), no cross-border replicas.
