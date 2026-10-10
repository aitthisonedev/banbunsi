# BAN BUNSI

Knowledge center CMS (Foundation slice): Next.js public shell + Go Fiber API + PostgreSQL.

Production deployment and GitHub Actions: [VPS guide](deploy/README.md).

## Stack

- `apps/web` — Next.js (App Router), Tailwind, Lao/English UI
- `apps/api` — Go, Fiber, GORM, argon2id sessions
- `packages/openapi` — OpenAPI 3 contract
- PostgreSQL 16 (Homebrew or Docker Compose)
- Design/plan: `docs/superpowers/`

## Prerequisites

- Node.js 20+
- Go 1.22+
- PostgreSQL 16 (`brew services start postgresql@16`)

Optional: Docker for `postgres` + Mailpit (`docker compose up -d`).

## Quick start (all-in-one)

```bash
# first time only
cp .env.example .env
# create DB if needed:
#   createuser -s banbunsi && createdb -O banbunsi banbunsi
cd apps/web && npm install && cd ../..

# start frontend + backend (keep this terminal open)
./run.sh

# stop from the same terminal: Ctrl+C
# or from another terminal:
./run.sh stop

# check status
./run.sh status
```

- Frontend: http://localhost:3000/lo  
- Backend: http://localhost:8080/api/v1/health  
- Logs: `.run/api.log` and `.run/web.log`

### Manual (two terminals)

```bash
# API
cd apps/api && go run ./cmd/server

# Web
cd apps/web && npm run dev
```

### Seeded demo accounts

Upserted on API boot in development (also in `.env` for the owner):

| Role | Email | Password |
|---|---|---|
| Admin / owner | `banbunsi26@gmail.com` | `admin123` |
| General member | `user@gmail.com` | `user123` |
| VIP member | `vip@gmail.com` | `vip1123` |

Staff land on `/admin`; members stay on the public site. Production requires an
explicit owner email and a password of at least 12 characters, creates the owner
once, and does not seed demo member/VIP accounts.

## What Foundation includes

- Email/password register, verify, login, logout, forgot/reset
- Session cookie auth + fixed roles (member/editor/admin/owner)
- Seeded 7 knowledge categories (lo/en)
- Public settings + admin settings edit
- Public home, categories, contact, VIP/about/privacy stubs
- Admin dashboard stub

## Deferred (next slices)

Phone OTP, Google OAuth, CMS content/files, VIP gates, quizzes, SEO hardening, staff 2FA.
