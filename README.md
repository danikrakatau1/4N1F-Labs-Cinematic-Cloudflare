# 4N1F Labs Cinematic — Cloudflare

Canonical Cloudflare edition of 4N1F Labs Cinematic.

The legacy Vercel repository is frozen. Platform/runtime changes belong in this repository.

## Architecture lock

Authoritative semantics:

- `4N1F_XXXXXXXXXXXX` = **preview-only code**.
- `p_<32hex>` = **editable web / Live Editor document-session**.
- Opening a `4N1F_...` preview must **not** create a `p_...` session.
- A `p_...` session is created only after explicit edit intent, such as **Open Live Editor**.
- Publishing a new preview package writes to storage and does **not** require a frontend deployment.

See [`docs/ARCHITECTURE-LOCK-V1.md`](docs/ARCHITECTURE-LOCK-V1.md).

## Canonical runtime

- Frontend Worker: `4n1f-labs-cinematic-cloudflare`
- Cloudflare account ID: `69b3344647228e4e7c1c85f7a5136f23`
- Production origin: `https://4n1f-labs-cinematic-cloudflare.faqihanif12282000.workers.dev`
- KV backend Worker: `4n1f-kv-api`

Bindings declared by `wrangler.jsonc`:

- `PREVIEW_PACKAGES` → direct preview-package KV
- `KV_BACKEND` → Service Binding to `4n1f-kv-api`
- `ASSETS` → static assets from `dist/`

## Locked routes

- `/` → Universal Preview Hub
- `/editor/package-preview.html?package_key=4N1F_...` → preview-only renderer
- `/p_<preview-id>` → clean editable-session preview
- `/editor/p_<preview-id>` → Live Editor
- `/api/kv-package?package_key=4N1F_...` → direct package lookup; no session creation
- `/api/kv-session` → create editable `p_...` session after explicit edit intent
- `/api/kv-preview?preview_id=p_...` → load editable-session state

Fetch remains a separate pipeline:

- `/fetch/`
- `/fetch/preview.html`
- `/fetch/editor/`
- `/fetch/editor/clean-preview.html`

## Publisher contract

`4N1F Publisher V1` normalizes one package, writes `pkg:4N1F_...` directly to the canonical KV namespace, verifies readback, and smoke-tests the production resolver. It does not deploy the frontend Worker.

## State seal

Live Editor export contract is locked as:

`CURRENT = APPLY = Clean Preview = Download ZIP`

Exported output must not leak editor instrumentation.

## Safety

No publisher token, Cloudflare API token, Supabase service-role key, or other server secret belongs in browser code or commits.

See `CLOUDFLARE-SETUP.md` for deployment settings.
