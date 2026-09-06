#!/usr/bin/env bash
set -euo pipefail

rm -rf dist
mkdir -p dist/editor

cp index.html dist/index.html
cp preview.html dist/preview.html
cp _redirects dist/_redirects
cp -R editor/. dist/editor/

# Guardrails: only the active static frontend is published.
test -f dist/index.html
test -f dist/preview.html
test -f dist/editor/index.html
test -f dist/editor/editor.js
test -f dist/editor/addons/v1.3.2-kv-route-loader.js
test -f dist/editor/addons/v1.3.3-editor-route-nav.js

echo "4N1F Cloudflare static bundle ready in ./dist"
