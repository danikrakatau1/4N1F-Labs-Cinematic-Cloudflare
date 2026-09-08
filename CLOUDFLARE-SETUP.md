# 4N1F Labs Cinematic — Cloudflare deployment

This repository is the canonical Cloudflare edition. The frozen Vercel repository is not modified by this project.

## Source snapshot

Frontend/editor source was bootstrapped from:

`danikrakatau1/4NIF-Labs-Cinematic@0e7119054a3e1d88a97f03f4d53138ef89ba9edc`

All Cloudflare-specific platform work belongs in this repository only.

## Canonical Cloudflare target

- Account: `Faqihanif12282000@gmail.com's Account`
- Account ID: `69b3344647228e4e7c1c85f7a5136f23`
- Frontend Worker: `4n1f-labs-cinematic-cloudflare`
- Production origin: `https://4n1f-labs-cinematic-cloudflare.faqihanif12282000.workers.dev`
- KV backend Worker: `4n1f-kv-api`

Do not target the legacy `faqihanif2000` account/Worker.

## Active routes

- `/` → Universal Preview Hub
- `/editor/package-preview.html?package_key=4N1F_...` → direct preview-only renderer
- `/p_<preview-id>` → clean editable-session preview
- `/editor/p_<preview-id>` → Live Editor
- `/api/kv-package?package_key=4N1F_...` → direct package resolver
- `/api/kv-session` → explicit editable-session creation
- `/api/kv-preview?preview_id=p_...` → editable-session state resolver

The preview-only contract is strict: resolving `4N1F_...` must not create a `p_...` session. `p_...` is created only after explicit edit intent.

## Cloudflare Workers + Static Assets

This project uses Workers Builds with static assets. The source of truth is `wrangler.jsonc`.

Current Worker entrypoint:

`src/worker-entry.js`

Current bindings:

- `PREVIEW_PACKAGES` → KV namespace ID `f5d2286e18e8401aa40ec9d8591bf8b6`
- `KV_BACKEND` → Service Binding to Worker `4n1f-kv-api`
- `ASSETS` → `./dist`

Dashboard/build setup:

- Project name: `4n1f-labs-cinematic-cloudflare`
- Build command: `bash build-cloudflare.sh`
- Deploy command: `npx wrangler deploy`
- Non-production deploy command: `npx wrangler versions upload`
- Root directory: `/`
- Protect with Cloudflare Access: off unless private access is explicitly wanted

Production deployment is handled by `.github/workflows/cloudflare-production-deploy.yml` on `main`.

## Storage and publisher

Preview packages are stored directly in canonical Cloudflare KV under keys shaped like:

`pkg:4N1F_XXXXXXXXXXXX`

`4N1F Publisher V1` writes package JSON directly to KV, verifies readback, and smoke-tests `/api/kv-package`. Publishing a normal source/experiment does not require a frontend deployment.

The browser never receives a publisher token, Cloudflare API token, or service-role secret.

## Backend ownership

`4n1f-kv-api` remains the editable-session backend. The frontend Worker reaches it through the `KV_BACKEND` Service Binding for session and preview-state operations.

Direct preview-package lookup belongs to the frontend Worker through `PREVIEW_PACKAGES` and `/api/kv-package`.

## Fetch isolation

Fetch is a separate product pipeline and must not be coupled to Preview Key or Live Editor session generation:

- `/fetch/`
- `/fetch/preview.html`
- `/fetch/editor/`
- `/fetch/editor/clean-preview.html`

Its locked state-seal contract remains:

`CURRENT = APPLY = Clean Preview = Download ZIP`

## Deliberately excluded / frozen

- Legacy Vercel production remains frozen unless explicitly reopened.
- Legacy `faqihanif2000` Cloudflare Worker/account is non-canonical.
- Hardcoded experimental `p_...` visual routes are not the model for normal editable sessions.
- The historical Bali `4N1F_... → p_...` shortcut is not the canonical preview architecture.

## Safety rule

The frozen Vercel repository stays untouched unless explicitly requested. Platform secrets stay server-side and out of commits/browser code.

See `docs/ARCHITECTURE-LOCK-V1.md` for the authoritative architecture contract.
