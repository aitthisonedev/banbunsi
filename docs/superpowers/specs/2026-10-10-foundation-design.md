# BAN BUNSI Foundation — Design Spec

**Date:** 2026-10-10  
**Status:** Approved for implementation (user directed: proceed without further questions)  
**Parent requirements:** `doc/requirement.md` v1.9  
**Scope:** Foundation slice only

## 1. Goal

Ship a working monorepo foundation for BAN BUNSI: Next.js public shell, Go Fiber API, PostgreSQL, email/password auth with sessions and fixed roles, seeded categories and site settings, OpenAPI contract, local email via Mailpit.

## 2. Out of scope (later slices)

- Phone OTP / SMS, Google OAuth
- VIP approval UI and gated downloads
- CMS article/document CRUD, media library, virus scan, S3/R2
- Quizzes, FAQ, promo banners, Search Console
- TOTP 2FA for staff (stub env only; implement in security slice)
- Thai UI language (UI: Lao + English only)

## 3. Architecture

```text
banbunsi/
  apps/web/          Next.js App Router — public + auth + admin shell
  apps/api/          Go Fiber REST API — auth, RBAC, categories, settings
  packages/openapi/  OpenAPI 3 YAML — API contract source of truth
  docker-compose.yml Postgres + Mailpit (when Docker available)
  scripts/           local DB seed / migrate helpers
  doc/               product requirements
```

- API owns identity, authorization, validation, and persistence.
- Web uses REST against the API; public settings/categories are SSR-readable.
- Sessions: opaque token stored hashed in `sessions`, cookie `bb_session` (`HttpOnly`, `Secure` in prod, `SameSite=Lax`).
- No JWT in localStorage for session auth.

## 4. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide |
| Backend | Go, Fiber, GORM |
| DB | PostgreSQL 16+ |
| Contract | OpenAPI 3 |
| Passwords | argon2id |
| Local email | Mailpit (SMTP capture) or log-to-console fallback |
| Fonts | Phetsarath (lo), Noto Sans (en) |
| Brand | Blue `#0036AD`, white surfaces per requirement §5.1 |

## 5. Data model

### users
- `id` UUID PK
- `name`, `email` (unique, citext or lower-normalized)
- `password_hash`
- `email_verified_at` nullable
- `staff_role` enum: `member` | `editor` | `admin` | `owner` (default `member`)
- `account_status` enum: `active` | `suspended`
- timestamps

### sessions
- `id` UUID, `user_id`, `token_hash` unique, `expires_at`, `revoked_at`, `user_agent`, `ip`

### email_verification_tokens / password_reset_tokens
- `user_id`, `token_hash`, `expires_at`, `used_at`

### categories + category_translations
- Max depth 2 (root + one child level)
- Translations: `locale` (`lo`|`en`), `name`, `description`, `slug`, SEO title/description
- `sort_order`, `is_active`, soft delete (`deleted_at`)

### site_settings
- Typed columns preferred for known keys: `site_name_lo`, `site_name_en`, `timezone`, `contact_email`, `whatsapp_number`, `facebook_url`, `tiktok_url`, default SEO fields
- Single-row settings table (`id=1`) for Foundation simplicity

### memberships (stub)
- `user_id`, `tier` (`member`|`vip`), `starts_at`, `ends_at`, `is_current`, `status`, notes
- Unique partial index: one `is_current=true` per user
- Register creates current `member` row; no VIP admin in this slice

### audit_logs
- Append-only: `actor_user_id`, `action`, `target_type`, `target_id`, `result`, `metadata` JSONB, `created_at`
- App DB role must not UPDATE/DELETE this table (document; enforce when hardening)

## 6. API surface

Base path: `/api/v1`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | public | liveness |
| POST | `/auth/register` | public | enumeration-safe response |
| POST | `/auth/login` | public | sets session cookie |
| POST | `/auth/logout` | session | revoke session |
| GET | `/auth/me` | session | user + role + membership stub |
| POST | `/auth/verify-email` | public | token |
| POST | `/auth/resend-verification` | public | enumeration-safe |
| POST | `/auth/forgot-password` | public | enumeration-safe |
| POST | `/auth/reset-password` | public | token + new password |
| GET | `/categories` | public | active tree for locale |
| GET | `/admin/categories` | editor+ | includes inactive |
| GET | `/settings/public` | public | contact + public branding |
| GET | `/admin/settings` | admin+ | full settings |
| PATCH | `/admin/settings` | admin+ | validate email/phone/URLs |
| GET | `/admin/dashboard` | editor+ | placeholder counts |

Suspended users: revoke sessions on status change; reject auth with 401.

## 7. UI pages (Foundation)

**Public (locale prefix `/lo` default, `/en`)**
- Home: brand, short intro, search UI stub (non-functional or client navigate placeholder), category chips from API, contact footer
- Auth: register, login, verify notice, forgot/reset password
- Static stubs: About, Contact, VIP benefits (contact-only, no payment), Privacy placeholder

**Admin (`/lo/admin` …)**
- Requires staff role; redirect members to home
- Dashboard stub, Settings form (Admin/Owner), Categories list (read-only in Foundation)

**Brand rules (adapted for this product)**
- BAN BUNSI as clear brand signal on home
- Blue/white theme; Phetsarath + Noto Sans
- Home first viewport: brand, one headline, short support line, primary search CTA area — no heavy hero image overlay

## 8. Seed data

- Owner from env: `OWNER_EMAIL`, `OWNER_PASSWORD`, `OWNER_NAME`
- Seven root categories (lo/en) from requirement §1.1
- Settings from §1.4 contacts; timezone `Asia/Vientiane`
- WhatsApp stored E.164 `+8562058444184`; wa.me link without `+`

## 9. Security baseline

- Argon2id password hashing
- CSRF: SameSite cookie + Origin check on mutating routes from browser
- Rate limit login/register/forgot (in-memory for local; interface for Redis later)
- Never leak whether email exists on register/forgot/resend
- Downloads/private files not in this slice

## 10. Local development

- `apps/api` on `:8080`
- `apps/web` on `:3000` with `NEXT_PUBLIC_API_URL` / server `API_URL`
- Postgres via Homebrew service or Docker Compose when Docker is available
- Mailpit on `:8025` UI / `:1025` SMTP when available; else API logs verification links

## 11. Success criteria

1. `docker compose up` or documented brew Postgres starts DB
2. API health OK; migrate + seed succeeds
3. Register → verify (Mailpit/log) → login → `/auth/me`
4. Public home shows categories + contact from API
5. Owner can open admin settings and update contact fields
6. OpenAPI file matches implemented routes
