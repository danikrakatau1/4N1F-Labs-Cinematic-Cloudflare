# 4N1F Labs — Experiment Key Flow V1

Status: implementation contract

## Hard lock

- Deploy Cloudflare/Vercel only when the platform/engine/UI/runtime changes.
- An experiment must never require a production deploy.
- Every experiment/version gets a new immutable Package Key.
- Old Package Keys stay valid and are never overwritten.
- Package Key is `4N1F_` + 12 hexadecimal characters.
- Preview ID is `p_` + 32 hexadecimal characters.
- Package Key != Preview ID.

## Existing runtime contract

The current production preview renderer already supports arbitrary immutable HTML + CSS + JS snapshots loaded by Preview ID. The normal flow remains:

`Package Key -> POST /api/kv-session -> Preview ID -> /p_<id> -> /editor/p_<id>`

Experiments therefore belong in the package store. They must not be hardcoded into `src/worker.js`, special-routed to static files, or merged into the production asset tree just to change scene content.

## Experiment package shape

```json
{
  "schema": "4n1f.experiment.v1",
  "kind": "illustration-scene",
  "project": "Bali Painterly Cinematic V1",
  "html_code": "<main id=\"scene\"></main>",
  "css_code": "html,body{margin:0}",
  "js_code": "",
  "meta": {
    "aspect_ratio": "9:16",
    "duration": 9.66,
    "motion_recipe": "cinematic-soft-reveal-v1",
    "source_mode": "illustration-based"
  }
}
```

The secure publisher stores this immutable snapshot and returns the Package Key. The public browser must never receive publisher secrets, Cloudflare API tokens, service-role credentials, or KV write credentials.

## Runtime behavior

1. User enters Package Key in Universal Preview Hub.
2. Hub calls `POST /api/kv-session`.
3. Backend validates the Package Key and creates a random Preview ID.
4. `/p_<preview-id>` calls `/api/kv-preview?preview_id=...`.
5. Preview renderer injects `html_code`, `css_code`, and `js_code` into the sandboxed iframe.
6. Live Editor opens at `/editor/p_<preview-id>` and reads the same immutable source snapshot.

## No-deploy rule

Creating or revising an experiment changes only package-store data. It must not require a new static experiment route, a hardcoded Preview ID, a Worker source edit, a Vercel deployment, or a Cloudflare deployment.

A platform deploy is allowed only when the renderer/editor/platform capability itself changes.

## Anti-regression

Forbidden pattern for experiments:

```js
const SOME_EXPERIMENT_KEY = '4N1F_...';
const SOME_EXPERIMENT_PREVIEW = 'p_...';
if (packageKey === SOME_EXPERIMENT_KEY) { /* special experiment route */ }
```

Experiments must resolve through the same package/session backend as every other Package Key.
