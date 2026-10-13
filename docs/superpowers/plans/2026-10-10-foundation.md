# BAN BUNSI Foundation Implementation Plan

> **For agentic workers:** Execute inline in this session (user directed: no further prompts). Use checkbox tracking.

**Goal:** Scaffold monorepo with Next.js + Go Fiber API + PostgreSQL, email/password auth, seeded categories/settings, and bilingual public/admin shells.

**Architecture:** `apps/api` owns auth/RBAC/data; `apps/web` SSR/CSR against REST; OpenAPI in `packages/openapi`; Postgres for persistence; session cookie auth.

**Tech Stack:** Next.js, TypeScript, Tailwind, shadcn/ui, Go, Fiber, GORM, PostgreSQL, argon2id, OpenAPI 3.

## Global Constraints

- UI locales: Lao (`lo`) primary, English (`en`) second — no Thai UI in v1
- Brand primary blue: `#0036AD`; fonts: Phetsarath + Noto Sans
- Passwords: argon2id; sessions: HttpOnly cookie `bb_session`
- Staff roles fixed: member | editor | admin | owner
- Timezone default: `Asia/Vientiane`
- Contact seed: banbunsi26@gmail.com, WhatsApp +8562058444184, Facebook/TikTok per requirement §1.4
- No phone OTP, Google OAuth, file uploads, or VIP gates in this plan
- Commit only when user requests

---

### Task 1: Repo scaffold + tooling

**Files:**
- Create: `README.md`, `.gitignore`, `.env.example`, `docker-compose.yml`
- Create: `apps/api/go.mod`, `apps/api/cmd/server/main.go` (health only)
- Create: `packages/openapi/openapi.yaml` (health path)
- Create: `apps/web` via `create-next-app`

- [ ] **Step 1:** Init git if missing; write `.gitignore` for Node/Go/env/IDE
- [ ] **Step 2:** Write `docker-compose.yml` with `postgres:16` and `mailpit`
- [ ] **Step 3:** Install Go + PostgreSQL via Homebrew if missing; start Postgres
- [ ] **Step 4:** Scaffold `apps/api` with Fiber `/api/v1/health`
- [ ] **Step 5:** Scaffold `apps/web` Next.js App Router + TypeScript + Tailwind
- [ ] **Step 6:** Verify `curl` health and `npm run dev` load

### Task 2: Database models, migrate, seed

**Files:**
- Create: `apps/api/internal/config/config.go`
- Create: `apps/api/internal/db/db.go`
- Create: `apps/api/internal/models/*.go`
- Create: `apps/api/internal/seed/seed.go`

- [ ] **Step 1:** Define GORM models per design spec §5
- [ ] **Step 2:** AutoMigrate on boot (Foundation); document SQL migrations later
- [ ] **Step 3:** Seed owner, 7 categories (lo/en), site settings
- [ ] **Step 4:** Verify seed with `psql` or API list

### Task 3: Auth + sessions

**Files:**
- Create: `apps/api/internal/auth/*` (hash, session, middleware)
- Create: `apps/api/internal/handlers/auth.go`
- Create: `apps/api/internal/mail/mailer.go`
- Update: OpenAPI auth paths

- [ ] **Step 1:** Implement register/login/logout/me
- [ ] **Step 2:** Email verification + forgot/reset with enumeration-safe responses
- [ ] **Step 3:** Suspended account rejection + session revoke
- [ ] **Step 4:** Manual test via curl + cookie jar

### Task 4: Categories + settings + admin dashboard API

**Files:**
- Create: `apps/api/internal/handlers/categories.go`
- Create: `apps/api/internal/handlers/settings.go`
- Create: `apps/api/internal/handlers/admin.go`
- Update: OpenAPI

- [ ] **Step 1:** Public categories tree + admin list
- [ ] **Step 2:** Public settings + admin get/patch with validation
- [ ] **Step 3:** Admin dashboard stub
- [ ] **Step 4:** RBAC middleware for editor+/admin+

### Task 5: Web shell — brand, i18n, public pages

**Files:**
- Create: `apps/web` locale layout, home, contact, footer, auth pages
- Create: API client helpers

- [ ] **Step 1:** Theme tokens + fonts (Phetsarath, Noto Sans)
- [ ] **Step 2:** `/[locale]` home with categories + contact from API
- [ ] **Step 3:** Register/login/logout UX wired to API
- [ ] **Step 4:** Admin shell: dashboard + settings form for owner

### Task 6: Verify end-to-end

- [ ] **Step 1:** Register → verify (log/Mailpit) → login → me
- [ ] **Step 2:** Owner updates settings; public contact reflects change
- [ ] **Step 3:** Home shows 7 categories in lo and en
- [ ] **Step 4:** Fix gaps; update README run instructions

---

## Execution note

User requested immediate implementation without further approval gates. Execute tasks sequentially in this session; skip commit steps unless user asks.
