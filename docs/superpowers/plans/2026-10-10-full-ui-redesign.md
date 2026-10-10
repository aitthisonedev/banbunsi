# Full UI Redesign Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Ship a consistent BAN BUNSI UI kit across all public, auth, and admin pages, plus Critical hardening from the audit.

**Architecture:** Thin React wrappers over existing CSS tokens; public header gains drawer + session awareness; admin gets a dedicated layout; Go/Next harden HTML + files + SSR cookies.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4 + `globals.css` tokens, Go Fiber API.

## Global Constraints

- Brand tokens unchanged (`#0036AD`, navy `#0B1F6B`, etc.)
- UI languages: Lao + English only (no Thai UI)
- Prefer porting old layout patterns over inventing new visual language
- Do not add heavy UI libraries

---

### Task 1: Shared UI kit + feedback states

**Files:**
- Create `apps/web/src/components/ui/{button,form-field,badge,states,pagination,drawer}.tsx`
- Extend `apps/web/src/app/globals.css` only if needed for drawer/admin shell

- [ ] Add Button, FormField, Badge, Empty/Loading/Error/Success, Pagination, Drawer
- [ ] Export from `apps/web/src/components/ui/index.ts`

### Task 2: Public header — mobile drawer + auth awareness

**Files:** `site-header.tsx`, `client-api.ts`, `globals.css`

- [ ] Drawer nav &lt;900px
- [ ] `clientMe()` for account menu / logout / admin link

### Task 3: Auth shell + redesign auth pages

**Files:** auth layout or shared `AuthPanel`, login/register/forgot/reset/verify pages, `i18n.ts`

- [ ] Centered branded panel
- [ ] Bilingual strings + loading/error/success

### Task 4: Admin shell + redesign admin pages

**Files:** `app/[locale]/admin/layout.tsx`, admin pages, `admin-document-form.tsx`

- [ ] Sidebar layout without public footer
- [ ] Fix files payload wipe
- [ ] Modal delete, labeled settings, dashboard polish

### Task 5: Public pages sweep + hardening

**Files:** home, documents, document detail, categories, search, about, contact, vip, privacy, `api.ts`, Go sanitize if needed

- [ ] Hero optimize; Pagination; Error/Empty states
- [ ] Sanitize HTML; forward cookies on document SSR
- [ ] Complete i18n for static pages

### Task 6: Verify

- [ ] `cd apps/web && npm run build`
- [ ] Spot-check `/lo` and `/en` key routes
