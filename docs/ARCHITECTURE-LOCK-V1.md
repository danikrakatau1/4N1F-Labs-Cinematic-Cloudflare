# 4N1F Labs — Architecture Lock V1

Status: **LOCKED**

This document is the canonical contract for Preview Key, editable sessions, Cloudflare routing, publisher behavior, Fetch isolation, and Live Editor state sealing.

## 1. Identity semantics

### Preview code

`4N1F_XXXXXXXXXXXX`

Meaning: **preview-only code**.

It identifies source/package content that can be rendered for viewing. It is not an editable document/session ID and must not require a deployment to become viewable.

### Editable document/session

`p_<32 lowercase hex>`

Meaning: **editable web / Live Editor document-session**.

It is created or resolved only when the user explicitly moves into the editor flow.

### Non-negotiable invariant

Opening a `4N1F_...` preview must not create a `p_...` session under the hood.

Correct flow:

```text
source / code / experiment
        ↓
publish package to storage
        ↓
4N1F_XXXXXXXXXXXX
        ↓
PREVIEW ONLY
```

Edit flow:

```text
4N1F_XXXXXXXXXXXX preview
        ↓
explicit Open Live Editor intent
        ↓
create/resolve p_<32hex>
        ↓
4N1F Live Editor
```

## 2. Deployment independence

Normal source/package publication is storage work, not platform deployment work.

A new preview package is written to canonical Cloudflare KV as:

`pkg:4N1F_XXXXXXXXXXXX`

The package is then resolvable through `/api/kv-package` without deploying the frontend Worker.

Frontend deployment is reserved for platform/engine/routing/static changes.

## 3. Canonical Cloudflare ownership

Canonical account:

- Account label: `Faqihanif12282000@gmail.com's Account`
- Account ID: `69b3344647228e4e7c1c85f7a5136f23`

Canonical frontend:

- Worker: `4n1f-labs-cinematic-cloudflare`
- Origin: `https://4n1f-labs-cinematic-cloudflare.faqihanif12282000.workers.dev`

Canonical editable-session backend:

- Worker: `4n1f-kv-api`

Legacy `faqihanif2000` Cloudflare resources are non-canonical/frozen references.

## 4. Frontend Worker bindings

`wrangler.jsonc` is the source of truth.

Required bindings:

- `PREVIEW_PACKAGES` → direct preview-package KV namespace
- `KV_BACKEND` → Service Binding to `4n1f-kv-api`
- `ASSETS` → Worker Static Assets from `dist/`

Current KV namespace ID:

`f5d2286e18e8401aa40ec9d8591bf8b6`

## 5. Route ownership

### Hub / preview / editor

- `/` → Universal Preview Hub
- `/editor/package-preview.html?package_key=4N1F_...` → preview-only package renderer
- `/p_<preview-id>` → clean preview for an editable session
- `/editor/p_<preview-id>` → Live Editor

### Same-origin frontend APIs

- `GET /api/kv-package?package_key=4N1F_...`
  - reads preview package directly
  - must not create an editable session
- `POST /api/kv-session`
  - creates an editable `p_...` session
  - called only after explicit edit intent
- `GET /api/kv-preview?preview_id=p_...`
  - loads editable-session state

The frontend reaches editable-session backend operations through the `KV_BACKEND` Service Binding.

## 6. Publisher contract

`4N1F Publisher V1` must:

1. normalize and validate exactly one package,
2. write it directly to canonical KV,
3. verify KV readback,
4. smoke-test the production direct preview resolver,
5. avoid frontend Worker deployment for normal package publication.

Secrets stay server-side. Browser code must never receive publisher tokens, Cloudflare API tokens, service-role secrets, or equivalent privileged credentials.

## 7. Fetch isolation

Fetch is independent from Preview Key and Live Editor document-session routing.

Locked routes:

- `/fetch/`
- `/fetch/preview.html`
- `/fetch/editor/`
- `/fetch/editor/clean-preview.html`

Locked Fetch engine concepts remain:

- Source Graph V3
- Smart Source Ownership
- CSS ownership/cascade
- native rebuild/preview handoff
- Native Editor
- APPLY
- export

Do not cross-route Fetch Native Editor into 4N1F Live Editor.

## 8. Live Editor state seal

The output contract is:

`CURRENT = APPLY = Clean Preview = Download ZIP`

A sealed export must not contain editor instrumentation, selection overlays, injected editing hooks, transient editor-only state, or other tooling residue.

## 9. Legacy exceptions are not architecture templates

Historical hardcoded experiments may still exist for isolated visual labs. They do not redefine the normal product model.

Specifically:

- hardcoded `p_...` values used as visual-route aliases are not the canonical meaning of `p_...`;
- the historical Bali shortcut `4N1F_... → hardcoded p_...` is not the canonical preview path;
- normal Preview Key flow must not copy those patterns.

## 10. UI/skin lock

Architecture changes must preserve the existing 4N1F visual skin unless a redesign is explicitly requested.

Keep:

- Hub layout and styling,
- Preview Key input/generation UI,
- status motion,
- Live Editor visual identity,
- Fetch visual identity,
- existing theme/animation behavior.

Backend semantics may change without redesigning the shell.

## 11. Frozen boundaries

The following remain frozen unless explicitly reopened:

- legacy Vercel repository `danikrakatau1/4NIF-Labs-Cinematic`,
- legacy `faqihanif2000` Cloudflare target,
- UndanganKuuu project scope,
- unrelated template/package experiments.

## 12. Production acceptance evidence

Production Acceptance V1 completed successfully in GitHub Actions run:

`34265599770`

The run verified:

- backend API-only contract,
- Hub semantic contract,
- Fetch routes present,
- direct `4N1F_...` preview without `p_...` session creation,
- explicit edit intent creating a fresh editable session,
- state seal equality across APPLY / Clean Preview / ZIP.

Acceptance sample produced:

- Preview Key: `4N1F_C7E21B9A6D04`
- Editable session after edit intent: `p_55707397829de07f84012a9a02b8b577`

The production deployment immediately before acceptance used frontend Worker version:

`70f0e2b1-cdb5-4544-a6de-6da79d921b51`

## 13. Regression checklist

Any future platform change must keep all of these true:

- [ ] `4N1F_...` remains preview-only.
- [ ] Preview resolution does not create `p_...`.
- [ ] `p_...` remains editable document/session identity.
- [ ] Edit session creation occurs only after explicit edit intent.
- [ ] Normal package publication remains deployment-independent.
- [ ] `PREVIEW_PACKAGES`, `KV_BACKEND`, and `ASSETS` ownership remains explicit.
- [ ] Fetch remains independent.
- [ ] Existing UI/skin remains unchanged unless explicitly redesigned.
- [ ] `CURRENT = APPLY = Clean Preview = Download ZIP` remains true.
- [ ] Secrets never enter browser code or commits.
- [ ] Legacy Vercel and legacy Cloudflare targets remain frozen unless explicitly reopened.

If a proposed change violates one of these items, treat it as an architecture regression rather than a feature implementation.
