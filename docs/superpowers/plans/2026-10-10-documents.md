# Documents Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Public documents + staff admin full CRUD (metadata + body HTML; no file bytes).

**Architecture:** Go Fiber/GORM owns documents; Next.js SSR public pages + client admin forms; OpenAPI contract updated.

**Tech Stack:** Next.js App Router, Go Fiber, GORM, Postgres, OpenAPI 3

## Global Constraints

- UI languages: Lao + English only
- Brand primary `#0036AD`; green only for status
- Download requires login cue; no public file URLs
- Editor cannot publish/delete; Admin/Owner can

---

### Task 1: Models + migrate + seed

- [x] Add Document models; AutoMigrate; seed ~8 docs with files
- [x] Verify API starts / migrate OK

### Task 2: Public + admin document handlers

- [x] Implement handlers + wire routes
- [x] Dashboard document count real
- [x] OpenAPI paths/schemas

### Task 3: Web public pages

- [x] api helpers; documents list/detail; search; category; home latest; nav

### Task 4: Web admin CRUD

- [x] client-api; admin list/new/edit; dashboard link

### Task 5: Verify

- [x] `go build` + `npm run build`; smoke list/create
