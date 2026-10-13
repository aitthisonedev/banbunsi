---
name: banbunsi-design
description: Design, implement, or review BAN BUNSI public pages using blue-and-white brand, light/dark logos, Phetsarath Lao typography, bilingual layouts, and the old Laravel layout patterns ported to Next.js. Use for UI/UX, logo placement, hero/footer, styling, navigation, and visual accessibility in this repo.
---

# BAN BUNSI Design Skill

Design the knowledge-center site so people can browse, search, and (after login) download documents easily. UI languages: Lao primary, English secondary. Keep the interface calm, orderly, and uncluttered.

## Must read first

1. Latest user instructions win over this skill.
2. Read [doc/Design.md](../../../doc/Design.md) for logo rules, layout scope, and gaps vs the old site.
3. Read the relevant parts of [docs/superpowers/requirement.md](../../../docs/superpowers/requirement.md) §5 when acceptance criteria matter.
4. Inspect current Next.js components before editing.

## Project anchors (new stack)

- Design scope + logo rules: [doc/Design.md](../../../doc/Design.md)
- Tokens / global CSS: [apps/web/src/app/globals.css](../../../apps/web/src/app/globals.css)
- Brand assets: [apps/web/public/brand/](../../../apps/web/public/brand/)
- Favicons: [apps/web/public/favicon.svg](../../../apps/web/public/favicon.svg) (+ `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png`, `favicon.ico`) — wired in root `layout.tsx` metadata
- Theme: light (default) / dark via `html.dark`, toggle in header, persist `localStorage.banbunsi-theme`; logos swap with `.logo-light` / `.logo-dark`
- Logo component: [apps/web/src/components/brand-logo.tsx](../../../apps/web/src/components/brand-logo.tsx)
- Header / footer: [apps/web/src/components/site-header.tsx](../../../apps/web/src/components/site-header.tsx), [site-footer.tsx](../../../apps/web/src/components/site-footer.tsx)
- Home: [apps/web/src/app/[locale]/page.tsx](../../../apps/web/src/app/[locale]/page.tsx)
- Copy dictionaries: [apps/web/src/lib/i18n.ts](../../../apps/web/src/lib/i18n.ts)

## Old layout reference

When structure is unclear, compare with the previous implementation:

- Repo: https://github.com/aitthisonedev/banbunsi.git
- Public layout: `resources/views/layouts/public.blade.php`
- Home: `resources/views/home.blade.php`
- Old skill (historical): `.cursor/skills/banbunsi-design/SKILL.md` in that repo

Prefer **porting** old layout sections into Next.js over inventing a new visual system.

## Logo rules (summary)

| Surface | Asset |
|---|---|
| White header / light UI | `logo-light.png` / `banbunsi-logo-light.png` |
| Dark footer, hero on navy, dark mode header | `logo-dark.png` / `banbunsi-logo-dark.png` |
| Home hero photo | `hero-financial-advisor.jpeg` |

- Heights: 40 px mobile header, 48 px desktop header, ~48 px footer
- Never redraw, stretch, or CSS-invert a correctly prepared asset
- Use `BrandLogo` with `variant="light" | "dark"`

Full rules: [doc/Design.md](../../../doc/Design.md) §3.

## Brand tokens

| Use | Value |
|---|---|
| Brand | `#0036AD` |
| Brand hover | `#002C8E` |
| Footer / hero navy | `#0B1F6B` |
| Surface | `#FFFFFF` |
| Canvas | `#F7F9FC` |
| Tint | `#EEF4FF` |
| Ink | `#1F2937` |
| Muted | `#475569` |
| Line | `#E2E8F0` |

Primary button: brand fill + white text. Secondary: white + brand border. Green/red/amber only for real status.

## Typography

- Lao: Phetsarath 400/700 via Google Fonts `display=swap`
- English: Noto Sans + system fallback
- Body 16–18 px, line-height 1.7–1.9; do not clip Lao diacritics
- Set `lang` to `lo` or `en` on the locale shell
- UI strings live in `i18n.ts` (or future message catalogs) — do not add Thai UI

## Layout patterns to preserve

**Header:** logo · Home · Knowledge · Documents · Quizzes · language · login/account  

**Home order:**

1. Full-bleed hero (image + search + title + lead)
2. Feature bridge (3 cards) — port if missing
3. Latest documents (≤5)
4. Category chips + latest articles (≤3)
5. Optional promo band
6. Dark 4-column footer

**Footer columns:** Brand · Knowledge · Useful links · Contact (+ social) · copyright / privacy bar  

Content width ≈ 1200–1280 px; mobile padding 16–20 px; spacing scale 8 / 16 / 24 / 32 / 48.

## CMS / access cues (when building those screens)

- Guests can read public summaries; **every file download/preview requires login** and server-side Member/VIP checks
- Show clear login / request-VIP paths; never hide gated URLs in the HTML
- Staff roles are fixed: Editor drafts; Admin/Owner publish

## Responsive & a11y

Check 320, 360, 390, 768, 1024, 1440. No horizontal scroll. Touch targets ≥ 44×44. Contrast ≥ 4.5:1. Icon-only controls need accessible names. Honor `prefers-reduced-motion`.

## How to work

1. Change only the flow the user asked for  
2. Reuse tokens and shared components  
3. After UI changes: `cd apps/web && npm run build` and spot-check `/lo` and `/en`  
4. Summarize what changed, what was checked, and remaining gaps vs [doc/Design.md](../../../doc/Design.md) §9  

If the task is documentation or skill-only, validate links and structure — do not claim UI was browser-tested unless it was.
