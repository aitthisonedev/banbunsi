# Account Hub Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Ship member account hub with editable profile, avatar upload, password change, membership view, and FR-05 stubs.

**Architecture:** Go Fiber account handlers + static uploads; Next.js `/[locale]/account` tabbed page; extend User model and `/auth/me` payload.

**Tech Stack:** Go Fiber, GORM, Next.js App Router, bilingual i18n

## Global Constraints

- UI languages: Lao primary, English secondary
- Members cannot change email, staff_role, or membership tier
- Avatar ≤ 2MB; JPEG/PNG/WebP only
- History tabs are empty stubs only

## Tasks

- [x] Extend User model + userPayload + seed/register name mapping
- [x] Account handlers (profile, avatar, password) + routes + static uploads
- [x] Web types, client-api, i18n, header Account link
- [x] Account page UI with tabs
- [x] Verify build + login smoke tests
