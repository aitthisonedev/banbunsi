# Admin CMS Hub — Design Spec

Version: 1.0  
Date: 2026-10-11  
Status: Approved — implement Phases 1–5

## Goal

Redesign `/[locale]/admin` into a full CMS hub: Documents, Categories, Quizzes, Members/VIP, Settings — with working CRUD and BAN BUNSI admin shell.

## Shell

- Sidebar: Dashboard · Documents · Categories · Quizzes · Members · Settings  
- Top bar: title context, user/role, back to site, logout  
- Roles: Editor → documents (+ quiz drafts); Admin/Owner → all + settings + members/VIP + deletes/publish  

## Phases

1. **Documents** — polish existing CRUD APIs/UI  
2. **Categories** — admin create/update/delete + translations  
3. **Quizzes** — admin CRUD + questions JSON + publish  
4. **Members/VIP** — list users; role/suspend; VIP approve/renew/cancel  
5. **Settings** — restyle existing get/patch in new shell  

## Out of scope

Document binary upload storage, phone OTP, Google admin linking, ads/payments.
