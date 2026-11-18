---
id: ADR-0008
category: deployment_target
title: "Deployment target: AWS, all components as containers in a single region, ap-south-1\
  \ (Mumbai)\u2026"
status: accepted
superseded_by: null
component_id: null
rule: Run all components as containers on AWS in ap-south-1 only, one stack per environment.
decision: AWS, all components as containers in a single region, ap-south-1 (Mumbai),
  India; production and staging environments assumed; no cross-region replicas outside
  India.
evidence: 'human: "AWS, containers"; "India (Mumbai)"'
---

## Context

human: "AWS, containers"; "India (Mumbai)"

## Decision

AWS, all components as containers in a single region, ap-south-1 (Mumbai), India; production and staging environments assumed; no cross-region replicas outside India.
