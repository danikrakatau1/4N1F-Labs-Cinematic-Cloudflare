#!/usr/bin/env bash
set -euo pipefail

rm -rf dist
mkdir -p dist/editor

cp index.html dist/index.html
cp preview.html dist/preview.html
cp _redirects dist/_redirects
cp hub-command-deck-v2.css dist/hub-command-deck-v2.css
cp hub-21st-v3.css dist/hub-21st-v3.css
cp openai-type.css dist/openai-type.css
cp hub-ambient-v4.css dist/hub-ambient-v4.css
cp hub-cosmic-v5.js dist/hub-cosmic-v5.js
cp -R editor/. dist/editor/

# Homepage visual stack:
# V2 command deck + V3 21st refinement + OpenAI typography + V4 hero choreography.
sed -i 's#</head>#  <link rel="stylesheet" href="/hub-command-deck-v2.css">\n  <link rel="stylesheet" href="/hub-21st-v3.css">\n  <link rel="stylesheet" href="/openai-type.css">\n  <link rel="stylesheet" href="/hub-ambient-v4.css">\n</head>#' dist/index.html

# Homepage only: replace the older single-fluid WebGL renderer with the 11-world
# cosmic engine supplied in D(1).zip. Preview + Live Editor keep background-fluid.js.
sed -i 's#<script src="/editor/background-fluid.js"></script>#<script src="/hub-cosmic-v5.js"></script>#' dist/index.html

# Use the same OpenAI/ChatGPT-inspired typography layer in Preview and Live Editor.
sed -i 's#</head>#  <link rel="stylesheet" href="/openai-type.css">\n</head>#' dist/preview.html
sed -i 's#</head>#  <link rel="stylesheet" href="/openai-type.css">\n</head>#' dist/editor/index.html

# Guardrails: only the active static frontend is published.
test -f dist/index.html
test -f dist/preview.html
test -f dist/openai-type.css
test -f dist/hub-command-deck-v2.css
test -f dist/hub-21st-v3.css
test -f dist/hub-ambient-v4.css
test -f dist/hub-cosmic-v5.js
test -f dist/editor/index.html
test -f dist/editor/editor.js
test -f dist/editor/addons/v1.3.2-kv-route-loader.js
test -f dist/editor/addons/v1.3.3-editor-route-nav.js
grep -q 'hub-command-deck-v2.css' dist/index.html
grep -q 'hub-21st-v3.css' dist/index.html
grep -q 'openai-type.css' dist/index.html
grep -q 'hub-ambient-v4.css' dist/index.html
grep -q 'hub-cosmic-v5.js' dist/index.html
! grep -q 'hub-ambient-v4.js' dist/index.html
grep -q 'openai-type.css' dist/preview.html
grep -q 'openai-type.css' dist/editor/index.html

echo "4N1F Cloudflare static bundle ready in ./dist"
