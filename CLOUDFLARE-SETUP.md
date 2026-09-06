# 4N1F Labs Cinematic — Cloudflare deployment

This repository is the independent Cloudflare edition. The frozen Vercel repository is not modified by this project.

## Source snapshot

Frontend/editor source is pinned to:

`danikrakatau1/4NIF-Labs-Cinematic@0e7119054a3e1d88a97f03f4d53138ef89ba9edc`

## Active routes

- `/` → Universal Preview Hub
- `/p_<preview-id>` → `preview.html`
- `/editor/p_<preview-id>` → `editor/index.html`
- `/api/kv-session` → Cloudflare Pages Function → existing `4n1f-kv-api` Worker
- `/api/kv-preview` → Cloudflare Pages Function → existing `4n1f-kv-api` Worker

## Cloudflare Pages setup

Connect this GitHub repository as a Cloudflare Pages project.

Recommended settings:

- Production branch: `main`
- Framework preset: None
- Build command: leave empty
- Build output directory: `/`
- Root directory: `/`

Pages Functions are automatically detected from the `functions/` directory.

## Storage

Existing Cloudflare Worker:

`https://4n1f-kv-api.faqihanif12282000.workers.dev`

Existing KV remains the package/preview backend. Browser code never receives a publisher token or service-role secret.

## Deliberately excluded

The Cloudflare edition does not copy inactive Vercel/R2 server files such as `api/r2-*`, `server/r2-*`, `docs/R2-DUAL-STORAGE-SETUP.md`, `vercel.json`, or the old R2 editor bridge.
