# BAN BUNSI — Design Scope (Logo, Layout, UI Skill)

Version: 1.0  
Date: 2026-10-10  
Status: Active design reference for the Next.js + Go rebuild  
Language: English (UI remains Lao primary + English)

Related docs:

- Product requirements: `docs/superpowers/requirement.md` (and original `REQUIREMENTS_TH` in the old repo)
- Foundation tech design: `docs/superpowers/specs/2026-10-10-foundation-design.md`
- Agent skill: `.cursor/skills/banbunsi-design/SKILL.md`

Old layout reference (checked): [aitthisonedev/banbunsi](https://github.com/aitthisonedev/banbunsi.git)

---

## 1. Purpose of this file

This document locks **logo usage**, **public layout scope**, and **visual rules** for agents and developers. Use it when designing or reviewing pages so the new stack matches the approved old BAN BUNSI layout patterns, with the current brand files.

It is the source of truth for the `banbunsi-design` skill in this repository.

---

## 2. What we checked from the old layout

Source repo: `https://github.com/aitthisonedev/banbunsi.git` (Laravel + Blade + Filament).

| Area | Old reference path | Takeaway for new app |
|---|---|---|
| Public shell | `resources/views/layouts/public.blade.php` | Header logo light/dark, nav, language switch, auth CTA, dark footer 4 columns |
| Home | `resources/views/home.blade.php` | Hero with background image + search, feature bridge cards, latest documents, category chips, latest articles |
| Brand files | `public/brand/` | `banbunsi-logo-light.png`, `banbunsi-logo-dark.png`, SVG, favicon |
| Design skill | `.cursor/skills/banbunsi-design/SKILL.md` | Blue–white tokens, Phetsarath/Noto, bilingual UI, CMS access cues |
| Tokens / CSS | `resources/css/app.css` | Brand `#0036AD`, spacing scale, footer/hero classes |

### 2.1 Old header pattern (keep)

1. Logo left — light logo on light header; dark logo when dark theme is on  
2. Nav: Home · Knowledge (dropdown categories) · Documents · Quizzes  
3. Utilities: Search (when not on home) · theme toggle · language (ລາວ / English) · Login / Account  
4. Logo height: **40 px mobile / 48 px desktop**  
5. Content max width ≈ **1200 px**

### 2.2 Old home pattern (keep structure)

```text
[Header]
[Hero full-bleed: background image + search + title + lead]
[Feature bridge: 3 quick cards overlapping hero bottom]
[Latest documents — up to 5]
[Category chips + Latest articles — up to 3]
[Promo band if configured]
[Footer]
```

Hero image in the rebuild: `apps/web/public/brand/hero-financial-advisor.jpeg`  
(Owner-provided; same role as CMS “homepage background” in the old app.)

### 2.3 Old footer pattern (keep)

Dark navy footer (`#0B1F6B` family), four columns:

1. **Brand** — dark logo + short intro  
2. **Knowledge** — Documents, Latest articles, Quizzes  
3. **Useful links** — About, FAQ, VIP benefits  
4. **Contact** — email, WhatsApp/phone, social icons (Facebook, TikTok, WhatsApp)

Bottom bar: copyright left · Privacy right.

---

## 3. Logo skill — assets and rules

### 3.1 Files in this repo

| File | Use on |
|---|---|
| `apps/web/public/brand/logo-light.png` | Light backgrounds (header, white pages) |
| `apps/web/public/brand/logo-dark.png` | Dark backgrounds (footer, hero overlay, dark mode header) |
| `apps/web/public/brand/banbunsi-logo-light.png` | Alias matching old repo name |
| `apps/web/public/brand/banbunsi-logo-dark.png` | Alias matching old repo name |
| `apps/web/public/brand/ban-bunsi.svg` | Vector / favicon source when needed |
| `apps/web/public/images/hero-default.jpeg` | **Home hero background** (replace this file to change the hero) |
| `apps/web/public/brand/hero-financial-advisor.jpeg` | Extra brand photo (not used by home unless you change page.tsx) |
| `apps/web/public/favicon.svg` | Primary browser favicon (SVG) |
| `apps/web/public/favicon.png` / `favicon-32.png` | 32×32 PNG favicon |
| `apps/web/public/favicon-192.png` | 192×192 PWA / Android icon |
| `apps/web/public/apple-touch-icon.png` | iOS home-screen icon |
| `apps/web/public/favicon.ico` | Legacy shortcut icon |
| `apps/web/public/brand/favicon-source.png` | Master source for regenerating favicons |
| `apps/web/public/images/hero-default.jpeg` | Fallback hero from old CMS |

Wired in `apps/web/src/app/layout.tsx` (`metadata.icons`) and App Router `icon.svg` / `apple-icon.png`.

Component: `apps/web/src/components/brand-logo.tsx`  
- `variant="light"` → light logo  
- `variant="dark"` → dark logo  

### 3.2 Hard rules

- Use owner-provided logo files only — do not redraw, stretch, or recolor the mark  
- Keep aspect ratio; do not crop the house mark or “BAN BUNSI / ບ້ານບັນຊີ” wordmark  
- Clear space around the logo roughly equal to the roof peak height  
- Alt text: `BAN BUNSI` (decorative duplicate images may use empty `alt` if adjacent text already names the brand)  
- Header: light logo in light mode; dark logo in dark mode (`.logo-light` / `.logo-dark`)  

- Footer / dark hero: dark (white) logo on navy — **no CSS invert filters** if the asset is already correct  

### 3.3 Sizes

| Surface | Height |
|---|---|
| Header mobile | 40 px |
| Header desktop | 48 px |
| Footer | 48 px |
| Hero brand mark | 56–64 px |

---

## 4. Brand tokens (aligned with requirements + old skill)

| Token | Value | Use |
|---|---|---|
| Brand / primary | `#0036AD` | Primary buttons, links, active state |
| Brand hover | `#002C8E` | Hover/active buttons |
| Footer / hero navy | `#0B1F6B` | Dark footer, hero wash |
| Surface | `#FFFFFF` | Main reading surface |
| Canvas | `#F7F9FC` | Section bands |
| Tint | `#EEF4FF` | Soft highlight bands |
| Ink | `#1F2937` | Body text |
| Muted | `#475569` | Secondary text |
| Line | `#E2E8F0` | Borders |

Buttons:

- Primary: fill `#0036AD`, text white  
- Secondary: white fill, `#0036AD` border and text  
- Green / red / amber only for success / error / warning status — not decoration  

Fonts:

- Lao: **Phetsarath** 400 / 700 (`display=swap`)  
- English: **Noto Sans** + system fallback  
- Body 16–18 px, line-height 1.7–1.9; do not clip Lao vowels/tones  

---

## 5. Layout scope for the rebuild (in / out)

### 5.1 In scope now (match old public UX)

- [x] Logo light/dark assets + header/footer usage  
- [x] Home hero with `ai-financial-advisor` image + search  
- [x] Dark 4-column footer with contacts from settings  
- [x] Locale routes `/lo` · `/en`  
- [ ] Feature bridge (3 cards) under hero — port from old home  
- [ ] Knowledge dropdown with live categories  
- [ ] Latest documents / articles rows (when CMS exists)  
- [x] Theme toggle (light/dark) like old layout  

- [ ] FAQ page stub + footer link  
- [ ] Mobile nav drawer matching old responsive behavior  

### 5.2 Out of scope for design-only work

- Payment / VIP checkout UI  
- AI chat widgets, social feed embeds, floating ad popups  
- Redrawing the logo or inventing a new brand system  
- Thai UI language (docs may be Thai; site UI stays Lao + English)  

---

## 6. Page inventory (design coverage)

| Page | Old Blade | New App Router | Design notes |
|---|---|---|---|
| Home | `home.blade.php` | `app/[locale]/page.tsx` | Hero + search first; then categories / feeds |
| Categories | `categories/*` | `app/[locale]/categories/*` | Chips + list; max depth 2 |
| Documents | `documents/*` | later CMS slice | Login gate before download/preview |
| Articles | `articles/*` | later CMS slice | Public summary vs gated body |
| Quizzes | `quizzes/*` | later | Progress + results clarity |
| Auth | `auth/*` | `app/[locale]/auth/*` | Email first in Foundation |
| Account | `account.blade.php` | later | Profile, VIP status, history |
| About / Contact / VIP / Privacy | `pages/*` | matching routes | Contact data from site settings |
| Admin | Filament | `app/[locale]/admin/*` | Functional first; brand tokens later |

---

## 7. Accessibility & responsive checklist

- Breakpoints to verify: 320, 360, 390, 768, 1024, 1440  
- No horizontal page scroll  
- Touch targets ≥ 44×44 px  
- Contrast ≥ 4.5:1 for body text on surfaces  
- Social / icon buttons have accessible names  
- Respect `prefers-reduced-motion`  
- Set `lang="lo"` / `lang="en"` on the active locale shell  

---

## 8. Agent workflow (logo + layout skill)

When a task touches UI, logo, home, header, or footer:

1. Read this file (`doc/Design.md`) and the relevant section of requirements §5  
2. Follow `.cursor/skills/banbunsi-design/SKILL.md`  
3. Prefer existing components: `brand-logo`, `site-header`, `site-footer`  
4. Compare behavior/structure with the old Blade layout when unsure  
5. Verify both locales and at least mobile + desktop  

Do **not** invent a new visual language. Prefer porting the old layout patterns into the Next.js shell.

---

## 9. Current gap vs old layout (tracked)

| Gap | Status |
|---|---|
| Hero image + search bar + green CTA + 3 feature cards | Done (matches reference / old home) |
| Light logo in header / dark in footer | Done |
| Feature bridge 3 cards | Not yet |
| Category dropdown in header | Partial (link only) |
| Dark mode toggle | Done |
| Light mode (default / “right mode”) | Done — matches reference header + hero + feature cards |
| Latest documents / articles blocks | Waiting on CMS data |
| Footer SVG social icons (vs text glyphs) | Improve when polishing |

---

## 10. Approval note

Layout structure and logo pairing are validated against the old GitHub project. Hero photography uses the owner file `ai-financial-advisor.jpeg`. Further CMS content blocks should follow the old home section order unless the owner requests a change.
