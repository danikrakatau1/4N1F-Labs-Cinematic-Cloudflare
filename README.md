# 4N1F Labs Cinematic — Cloudflare

Standalone Cloudflare edition of 4N1F Labs Cinematic.

This repository is intentionally separate from the frozen Vercel edition. It reuses the existing 4N1F editor/preview architecture and Cloudflare KV backend while allowing Cloudflare-specific routing and deployment work to evolve independently.

## Locked navigation

- `/` → Universal Preview Hub
- `/p_<preview-id>` → Clean Live Preview
- `/editor/p_<preview-id>` → Live Editor

## Storage

Cloudflare KV remains the active package/preview storage path. Legacy Supabase preview fallback may remain available for historical Preview IDs.

## Safety

Do not expose publisher tokens, service-role keys, or other server secrets in browser code or commits.
