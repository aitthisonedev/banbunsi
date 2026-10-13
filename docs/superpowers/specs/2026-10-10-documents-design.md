# BAN BUNSI Documents — Design Spec

**Date:** 2026-10-10  
**Status:** Approved for implementation (user: implement front + back full CRUD)  
**Parent:** `docs/superpowers/requirement.md` FR-02/03/04 (subset)

## 1. Goal

Ship working **documents** end-to-end: bilingual metadata + summary + `body_html`, public list/detail/search, home latest, category listings, and **staff admin CRUD** (create/read/update/delete) with file **metadata** rows. Download buttons gate guests to login; **no binary file storage/serve** in this slice.

## 2. In scope

- Models: `documents`, `document_translations`, `document_files` (metadata only)
- Public API: list, get by slug, search (ILIKE)
- Admin API: list all statuses, get by id, create, update, soft-delete
- Seed sample published documents
- Next.js: `/documents`, `/documents/[slug]`, wired `/search`, category detail docs, home latest
- Admin UI: list + create/edit form + delete
- OpenAPI paths updated
- Brand UI per `doc/Design.md` / banbunsi-design skill

## 3. Out of scope

- Real upload/storage, virus scan, PDF preview bytes
- VIP approval workflow UI
- Article CMS, quizzes, phone/Google auth
- Editor revision-queue for published edits (simple rules below)

## 4. Data model

### documents
- `id` UUID, `document_number` (unique), `category_id` FK
- `read_access`: `public` | `member` | `vip`
- `status`: `draft` | `published` | `archived`
- `published_at` nullable, `effective_date` nullable date, `year` int
- `tags` string (comma-separated for ILIKE)
- soft delete

### document_translations
- `document_id` + `locale` (lo|en) unique
- `title`, `slug` (unique per locale), `summary`, `body_html`, SEO title/description

### document_files
- `document_id`, `label`, `file_name`, `mime`, `size_bytes`, `language`, `version`
- `download_access`: `member` | `vip`
- no storage key / public URL

## 5. Access rules

| Actor | Public list/detail | Body HTML | Download CTA |
|---|---|---|---|
| Guest | published only; VIP/member titles+summaries discoverable | only if `read_access=public` | → login with `next` |
| Member session | same + body if public/member | yes for public/member | login-gated stub (no bytes) |
| VIP session | + VIP body | yes | stub |
| Staff admin | all statuses via `/admin/documents` | always | N/A |

**RBAC:** Editor create/update drafts; cannot publish or delete. Admin/Owner publish, archive, delete, edit any.

## 6. API

Base `/api/v1`

| Method | Path | Auth |
|---|---|---|
| GET | `/documents` | public |
| GET | `/documents/{slug}` | public (optional session for body) |
| GET | `/admin/documents` | staff |
| GET | `/admin/documents/{id}` | staff |
| POST | `/admin/documents` | staff |
| PATCH | `/admin/documents/{id}` | staff (publish/delete rules) |
| DELETE | `/admin/documents/{id}` | admin+ |

Search uses `GET /documents?q=`.

## 7. Web routes

- `/[locale]/documents` — filters + rows
- `/[locale]/documents/[slug]` — detail + file badges + login CTA
- `/[locale]/search` — uses documents API
- `/[locale]/admin/documents` — CRUD list
- `/[locale]/admin/documents/new` + `/[locale]/admin/documents/[id]` — form
