# Protection & Licensing Framework

**Classification:** Internal | **Document Version:** 1.0.0
**Status:** Active
**Owner:** Platform Engineering | **Applies To:** All Production Deployments

---

## Executive Summary

This document establishes the Intellectual Property Protection Framework for all software artifacts under the organization's portfolio. The framework implements a multi-layered gating mechanism that ensures software integrity, license compliance, and access control without modifying core application logic.

---

## Protection Gating Mechanism

### Bootstrap Validation Sequence

```
Entry Point → License Key Validation → Entitlement Notification
                  ↓
            Valid? → YES → Boot App
                  → NO  → Terminate + Notice
```

### Validation Payload

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ENTITLEMENT_KEY` | string | YES | Runtime entitlement credential via environment |
| `NODE_ENV` | string | YES | `development` bypasses gate |

### Credential Resolution Order

1. Environment variable (`ENTITLEMENT_KEY`)
2. `.env` file at application root
3. If unresolved → GDM triggered

---

## Entitlement Notice

When entitlement validation fails, the system displays a notice directing users to open an issue at `https://github.com/sanot-tech/RadioFlow/issues` for access.

---

## Developer Workflow

For local development, bypass the gate via:
- Setting `NODE_ENV=development`
- Adding `ENTITLEMENT_KEY=dev-access` to `.env`

---

## Files Modified

| File | Action | Purpose |
|------|--------|---------|
| `.env.example` | Add `ENTITLEMENT_KEY=` | Document required credential |
| `.gitignore` | Add `.env` and `*.local` | Prevent credential leaks |
| `src/entitlement-gate.ts` | Add | Bootstrap validation logic |

---

*Copyright © 2026 Sanot. All Rights Reserved.*
