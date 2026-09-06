# 4N1F Fetch V2.26 Transplant

Source basis: user-supplied `DINI-ANIF-FULL-V2.26-SMART-SOURCE-OWNERSHIP-FINAL(1).zip`.

Purpose: preserve the V2.26 Fetch Studio + Source Graph V3 + Smart Source Ownership + Native Editor as a dedicated `/fetch` tool. It is intentionally separate from the Package Key / Preview ID Live Editor flow.

Adaptations are limited to 4N1F branding/routes, removal of Dini-Anif admin auth/Supabase/B2 UI dependencies, Cloudflare-safe fetch/asset proxying, and browser-local Fetch Preview handoff. The V2.26 source analysis/editor engines remain the basis.

Routes:
- `/fetch/` — Fetch Studio V2.26
- `/fetch/preview.html` — browser-local source-native preview
- `/fetch/editor/` — Native Editor V2.26
- `/fetch/editor/clean-preview.html` — applied clean preview
- `/api/fetch-source` — Cloudflare fetch bridge with public-host validation
- `/api/fetch-asset` — chunked asset fetch bridge

The packed source is stored as split base64 tar.gz parts under `vendor/fetch-v226/` and expanded only into `dist/fetch` during Cloudflare build.
