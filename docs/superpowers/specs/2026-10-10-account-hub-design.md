# Account Hub — Design Spec

Version: 1.0  
Date: 2026-10-10  
Status: Approved for implementation (user chose approach 1 + avatar upload + history stubs)

## Goal

Logged-in members manage their own profile (photo, first/last name, phone), change password, view membership, and see stubs for login methods / favorites / downloads / quiz history — per FR-05 account hub, without building deferred phone/Google or history storage yet.

## Decisions

| Topic | Choice |
|---|---|
| Scope | Full account hub UI; real profile + password + membership |
| Histories | Empty-state stubs |
| Avatar | File upload (JPEG/PNG/WebP ≤ 2MB) on API disk |
| Layout | Single `/[locale]/account` page with tabs |

## Data model

Extend `users`:

- `first_name` (string, required for profile save)
- `last_name` (string, optional)
- `phone` (string, optional)
- `avatar_path` (string, optional; e.g. `avatars/{uuid}.webp`)

Keep `name` as display name = `trim(first_name + " " + last_name)`. Register continues to accept a single `name` mapped to `first_name`.

## API (session required)

| Method | Path | Notes |
|---|---|---|
| GET | `/auth/me` | Extended payload |
| PATCH | `/account/profile` | first_name, last_name, phone |
| POST | `/account/avatar` | multipart `avatar` |
| DELETE | `/account/avatar` | clear photo |
| POST | `/account/password` | current_password, new_password |

`/auth/me` / login payload adds: `first_name`, `last_name`, `phone`, `avatar_url`, `membership_ends_at` (nullable).

Static: `GET /uploads/*` from API `uploads/` directory.

## UI

- Route `/[locale]/account` (redirect guests to login `?next=`)
- Tabs: Profile · Security · Login methods · Membership · Favorites · Downloads · Quiz history
- Header: Account link + Logout (Admin unchanged for staff)
- Lao + English strings in `i18n.ts`

## Out of scope

Email change, phone OTP, Google link, favorites/downloads/quiz persistence, admin member management.
