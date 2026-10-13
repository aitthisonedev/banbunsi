# BAN BUNSI — Full UI/UX Redesign Design Spec

**Date:** 2026-10-10  
**Status:** Approved (user: “Yes make it all”, scope C)  
**Approach:** Kit first, then full page sweep (Approach B under C)

Related: `doc/Design.md`, `.cursor/skills/banbunsi-design/SKILL.md`, audit canvas `banbunsi-system-audit.canvas.tsx`

---

## 1. Goals

1. Professional, consistent UI across **all** public, auth, and admin pages.
2. Fix Critical audit issues bundled with redesign (XSS, file wipe, SSR session, mobile nav).
3. Keep locked brand: blue `#0036AD`, navy `#0B1F6B`, canvas `#F7F9FC`, Phetsarath + Noto Sans. No new color system.
4. Lao primary + English secondary UI strings on every screen.

## 2. Non-goals

- VIP payment / checkout
- Quizzes / articles CMS (keep “coming soon” cues)
- New brand identity or Thai UI language
- Full WYSIWYG editor (keep HTML textarea; add preview later if needed)

## 3. Design system (shared kit)

Location: `apps/web/src/components/ui/`

| Component | Role |
|---|---|
| `Button` | primary / secondary / ghost; `loading` / `disabled` |
| `Input`, `Textarea`, `Select` | Form controls using existing CSS tokens |
| `FormField` | label + control + hint + error |
| `EmptyState`, `LoadingState`, `ErrorState`, `SuccessBanner` | Feedback |
| `Badge` | access/status (public/member/vip/draft/…) |
| `Pagination` | page controls for lists |
| `Drawer` | mobile nav overlay |
| `Modal` | confirm delete (admin) |

Tokens stay in `globals.css`. Prefer CSS classes already defined (`.btn-primary`, `.input`, `.chip`) wrapped by thin React components for consistency.

## 4. Shells

### 4.1 Public shell

- Sticky header; **mobile drawer &lt;900px** with Home / Knowledge / Documents / Quizzes (muted) / auth actions.
- **Auth-aware header:** guest → Login/Register; signed-in → Account menu (logout; Admin link if staff).
- Knowledge link stays; dropdown with live categories when available.
- Footer: keep 4-column navy pattern.

### 4.2 Auth shell

- Centered card on muted canvas; logo; one primary CTA; bilingual errors/success; link cluster (forgot / register / login).

### 4.3 Admin shell

- Dedicated layout: left nav (Dashboard, Documents, Settings if admin+), top bar with user + logout.
- No public marketing footer.
- Client staff gate retained; API remains source of truth.

## 5. Per-page redesign

| Page | Changes | Rationale |
|---|---|---|
| Home | Optimize hero (remove `unoptimized`); keep structure; bilingual “view all”; clear empty when API fails | LCP + trust |
| Documents | Filters via FormField; Pagination; Empty/Error states; Badge labels | Reduce friction scanning |
| Document detail | Sanitize HTML; SSR cookie forward; clear login/VIP CTAs; Badge for access | Security + gating honesty |
| Categories | Error catch; hierarchy if children; consistent cards | Resilience |
| Search | Empty query hint; Error/Empty; Pagination | Usability |
| About / Contact / VIP / Privacy | Real bilingual copy; Contact uses settings once (no double fetch where avoidable) | Trust |
| Auth pages | Auth shell; loading/error/success; confirm password on register/reset | Fewer failed submits |
| Admin dashboard | Admin shell; labeled stats; hide Settings for editors | Role clarity |
| Admin documents | Safe file payload; table + Modal delete; status filter; Pagination | Bugfix + ops UX |
| Admin settings | Human labels via i18n; back link; success banner | Consistency |

## 6. Hardening (must ship with redesign)

1. **Sanitize** `body_html` before `dangerouslySetInnerHTML` (allowlist tags; strip scripts). Prefer server-side sanitize in Go on write + client/display sanitize as defense in depth.
2. **Admin files:** omit `files` key when unchanged/empty; never send `[]` unless user cleared files intentionally.
3. **SSR session:** forward `Cookie` header from `headers()` when fetching document detail (and any gated public endpoints).
4. **i18n:** complete missing Lao keys; translate auth/admin/static stubs.
5. **Hero:** enable Next image optimization (or provide sized WebP); drop `unoptimized` when possible.
6. **API errors:** consistent `.catch` → ErrorState (not silent empty for categories/settings failures where content is required).

## 7. Success criteria

- All listed routes use shared kit patterns and bilingual strings.
- Mobile (&lt;900px) can reach main nav via drawer.
- Signed-in users see account controls; staff see Admin.
- Document HTML cannot execute script from CMS paste.
- Editing a document without touching files does not delete files.
- Logged-in member with access sees body when session cookie present on SSR.
- `cd apps/web && npm run build` succeeds.

## 8. Out of this pass (follow-ups)

- Real file storage + download endpoint (document as stub CTA until storage exists).
- Auth rate limiting.
- Full CSRF Origin required in production (tighten carefully for API clients).
- FAQ page stub if still missing.
