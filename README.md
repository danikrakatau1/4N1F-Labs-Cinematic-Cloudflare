# 4N1F Labs Cinematic — Cloudflare

Independent Cloudflare edition of 4N1F Labs Cinematic.

The Vercel edition is treated as frozen. This repository reuses the proven editor/preview engine from a pinned source snapshot while Cloudflare-specific hosting, routing, Functions, and future UI work evolve here independently.

## Locked navigation

- `/` → Universal Preview Hub
- `/p_<preview-id>` → Clean Live Preview
- `/editor/p_<preview-id>` → Live Editor

## Backend

Cloudflare Pages Functions proxy the same-origin `/api/kv-session` and `/api/kv-preview` routes to the existing `4n1f-kv-api` Worker and KV storage.

## Safety

No publisher token, Supabase service-role key, or other server secret belongs in browser code or commits.

See `CLOUDFLARE-SETUP.md` for deployment settings.
