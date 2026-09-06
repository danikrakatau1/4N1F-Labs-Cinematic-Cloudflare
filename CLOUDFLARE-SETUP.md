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
- Build command: `bash build-cloudflare.sh`
- Build output directory: `dist`
- Root directory: leave blank (repository root)

The build script publishes only the active static frontend into `dist/`. Pages Functions remain at the repository root under `functions/` and are automatically routed by Cloudflare.

## Storage

Existing Cloudflare Worker:

`https://4n1f-kv-api.faqihanif12282000.workers.dev`

Existing KV remains the package/preview backend. Browser code never receives a publisher token or service-role secret.

## Deliberately excluded

The Cloudflare edition does not copy inactive Vercel/R2 server files such as `api/r2-*`, `server/r2-*`, `docs/R2-DUAL-STORAGE-SETUP.md`, `vercel.json`, or the old R2 editor bridge.

## Safety rule

Future Cloudflare-specific UI and routing work belongs in this repository only. The frozen Vercel repository stays untouched unless explicitly requested.
