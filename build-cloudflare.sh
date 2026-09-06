#!/usr/bin/env bash
set -euo pipefail

rm -rf dist
mkdir -p dist/editor

cp index.html dist/index.html
cp preview.html dist/preview.html
cp _redirects dist/_redirects
cp hub-command-deck-v2.css dist/hub-command-deck-v2.css
cp -R editor/. dist/editor/

# Inject the Preview Hub visual override only into the built homepage.
sed -i 's#</head>#  <link rel="stylesheet" href="/hub-command-deck-v2.css">\n</head>#' dist/index.html

# Guardrails: only the active static frontend is published.
test -f dist/index.html
test -f dist/preview.html
test -f dist/hub-command-deck-v2.css
test -f dist/editor/index.html
test -f dist/editor/editor.js
test -f dist/editor/addons/v1.3.2-kv-route-loader.js
test -f dist/editor/addons/v1.3.3-editor-route-nav.js
grep -q 'hub-command-deck-v2.css' dist/index.html

echo "4N1F Cloudflare static bundle ready in ./dist"
