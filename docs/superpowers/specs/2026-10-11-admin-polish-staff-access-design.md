# Admin Polish + Staff Access — Design

Version: 1.0  
Date: 2026-10-11  
Status: Approved (role promotion approach)

## Goal

Polish the admin CMS shell for a calmer BAN BUNSI look, put the signed-in staff profile (avatar) on the top-right, and make granting backend access clearer via staff role promotion.

## Approach

Keep fixed roles: `member` · `editor` · `admin` · `owner`. No fine-grained module ACL.

| Role | Backend access |
|---|---|
| member | None |
| editor | Documents + quiz drafts |
| admin | All modules + members/VIP + settings + publish/delete |
| owner | Same as admin; can assign owner |

## UI

1. **Top bar (right):** avatar + name chip → dropdown (account, back to site, logout); role badge beside avatar.
2. **Sidebar:** brand, nav, compact staff card with avatar.
3. **Members:** staff-access legend + member cards/rows with avatar, role select labeled as backend permission, VIP/status actions.

## Out of scope

Per-module permission checkboxes, custom roles, invite-by-email flow.
