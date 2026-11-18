---
id: ADR-0005
category: component
title: Identity Provider
status: accepted
superseded_by: null
component_id: comp_identity_provider
responsibility: Company single sign-on for all users; runs on Microsoft Entra ID.
  Issues tokens the Web App and Leave API trust.
kind: managed_service
split_reason: Backing service the project uses but does not build
rule: All users sign in through Entra ID SSO; the app stores no passwords.
evidence: 'human: "Company SSO via Entra ID"'
---

## Context

human: "Company SSO via Entra ID"

## Decision

Company single sign-on for all users; runs on Microsoft Entra ID. Issues tokens the Web App and Leave API trust.

Kept separate because Backing service the project uses but does not build.
