# 4N1F Fetch V2.26 Transplant — LOCKED

Source basis: user-supplied `DINI-ANIF-FULL-V2.26-SMART-SOURCE-OWNERSHIP-FINAL(1).zip`.

## Locked product split

The homepage exposes two intentionally different tools:

1. **FETCH** — source ingestion/rebuild path based on the V2.26 Fetch Studio + Source Graph V3 + Smart Source Ownership + its own Native Editor.
2. **PACKAGE KEY / PREVIEW ID** — existing 4N1F immutable package / temporary preview path and the existing 4N1F Live Editor.

These are separate systems by design:

`FETCH NATIVE EDITOR V2.26 != 4N1F LIVE EDITOR`

Do not route Fetch output into `/editor/p_<preview-id>` as a substitute for the V2.26 Native Editor. The Fetch flow keeps its own editor.

## Fetch routes

- `/fetch/` — Fetch Studio V2.26
- `/fetch/preview.html` — source-native Fetch preview
- `/fetch/editor/` — Native Editor V2.26
- `/fetch/editor/clean-preview.html` — applied clean preview
- `/api/fetch-source` — Cloudflare Worker fetch bridge with public-host validation
- `/api/fetch-asset` — chunked asset fetch bridge

## Existing 4N1F routes remain independent

- `/` — Universal Preview Hub / two-gate launcher
- `/p_<preview-id>` — Clean Live Preview
- `/editor/p_<preview-id>` — 4N1F Live Editor
- `/api/kv-session` and `/api/kv-preview` — existing package / preview bridges

## What is preserved from V2.26

- Fetch Studio analysis/rebuild workflow
- Source Graph V3
- Smart Source Ownership
- CSS ownership/cascade handling
- source-native preview handoff
- Native Editor edit/apply/export workflow
- `DiniVisualResolver` JavaScript namespace is retained internally only because the V2.26 engine calls that symbol directly. It is an engine compatibility name, not a dependency on the Dini-Anif project.

## What is detached/adapted

Adaptations are intentionally limited to the transplant boundary:

- 4N1F branding and routes
- Dini-Anif admin authentication removed
- Dini-Anif Supabase/B2 persistence detached from the Fetch tool
- project-specific RSVP/Gift/Guestbook runtime injection omitted
- Cloudflare-safe source and asset fetch proxying
- browser-local Fetch Preview / Native Editor handoff
- clean-preview route repaired for the transplanted editor

The Fetch engine must not import databases, auth, storage, routes, branding, or runtime dependencies from the standalone Dini-Anif project.

## Build integrity

The V2.26 source archive is stored as split base64 payloads under `vendor/fetch-v226/` and expanded only into `dist/fetch` during the Cloudflare build. The build reconstructs and verifies the exact source archive using SHA-256 before extraction, then applies only the transplant-boundary patches above and runs JavaScript syntax guardrails.

Expected archive SHA-256:

`c22efd3c4a12b46a12ba092f4dd74a07fa3da3e23d2d69679e5f13349c2486cf`
