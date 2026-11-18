---
id: ADR-0004
category: component
title: Relational Database
status: accepted
superseded_by: null
component_id: comp_relational_database
responsibility: System of record for employees, departments, teams, reporting hierarchy,
  leave requests, balances, holiday calendars and policy configuration; runs on PostgreSQL
  on Amazon RDS in ap-south-1.
kind: managed_service
split_reason: Backing service the project uses but does not build; data is relational
  (hierarchy, requests, balances)
rule: Only the Leave API and Leave Worker access the PostgreSQL (Amazon RDS) database;
  no client connects directly.
evidence: 'human: "PostgreSQL on Amazon RDS"'
---

## Context

human: "PostgreSQL on Amazon RDS"

## Decision

System of record for employees, departments, teams, reporting hierarchy, leave requests, balances, holiday calendars and policy configuration; runs on PostgreSQL on Amazon RDS in ap-south-1.

Kept separate because Backing service the project uses but does not build; data is relational (hierarchy, requests, balances).
