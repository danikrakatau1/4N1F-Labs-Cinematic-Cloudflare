# 4N1F Labs Cinematic — Cloudflare deployment

This repository is the independent Cloudflare edition. The frozen Vercel repository is not modified by this project.

## Source snapshot

Frontend/editor source was bootstrapped from:

`danikrakatau1/4NIF-Labs-Cinematic@0e7119054a3e1d88a97f03f4d53138ef89ba9edc`

All future Cloudflare-specific work belongs in this repository only.

## Active routes

- `/` → Universal Preview Hub
- `/p_<preview-id>` → clean `preview.html`
- `/editor/p_<preview-id>` → `editor/index.html`
- `/api/kv-session` → Cloudflare Worker bridge → existing `4n1f-kv-api`
- `/api/kv-preview` → Cloudflare Worker bridge → existing `4n1f-kv-api`

## Cloudflare Workers + Static Assets

This project uses Workers Builds with static assets. The source of truth is `wrangler.jsonc`.

Dashboard setup:

- Project name: `4n1f-labs-cinematic-cloudflare`
- Build command: `bash build-cloudflare.sh`
- Deploy command: `npx wrangler deploy`
- Builds for non-production branches: enabled
- Non-production deploy command: `npx wrangler versions upload`
- Path / root directory: `/`
- Protect with Cloudflare Access: off unless private access is explicitly wanted

Use a dedicated Cloudflare build API token for this project. Do not reuse tokens belonging to unrelated projects.

The build script publishes only the active static frontend into `dist/`. `src/worker.js` handles API bridges and dynamic Preview/Editor routes, while Wrangler uploads `dist/` as Worker Static Assets.

## Storage

Existing Cloudflare Worker backend:

`https://4n1f-kv-api.faqihanif12282000.workers.dev`

Existing KV remains the package/preview backend. Browser code never receives a publisher token or service-role secret.

## Deliberately excluded

The Cloudflare edition does not carry inactive Vercel/R2 runtime paths such as `api/r2-*`, `server/r2-*`, `docs/R2-DUAL-STORAGE-SETUP.md`, `vercel.json`, or the old R2 editor bridge.

## Safety rule

The frozen Vercel repository stays untouched unless explicitly requested.
