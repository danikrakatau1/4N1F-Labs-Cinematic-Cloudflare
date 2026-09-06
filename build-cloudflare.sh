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
cp hub-portals-v6.css dist/hub-portals-v6.css
cp hub-portals-v6.js dist/hub-portals-v6.js
cp -R editor/. dist/editor/

# Expand the user-supplied V2.26 Fetch + Native Editor transplant.
cat vendor/fetch-v226/fetch-v226.tar.gz.b64.part-* > /tmp/4n1f-fetch-v226.b64
base64 -d /tmp/4n1f-fetch-v226.b64 > /tmp/4n1f-fetch-v226.tar.gz
echo "c22efd3c4a12b46a12ba092f4dd74a07fa3da3e23d2d69679e5f13349c2486cf  /tmp/4n1f-fetch-v226.tar.gz" | sha256sum -c -
tar -xzf /tmp/4n1f-fetch-v226.tar.gz -C dist
rm -f /tmp/4n1f-fetch-v226.b64 /tmp/4n1f-fetch-v226.tar.gz

# Homepage visual stack + the two locked entry points.
sed -i 's#</head>#  <link rel="stylesheet" href="/hub-command-deck-v2.css">\n  <link rel="stylesheet" href="/hub-21st-v3.css">\n  <link rel="stylesheet" href="/openai-type.css">\n  <link rel="stylesheet" href="/hub-ambient-v4.css">\n  <link rel="stylesheet" href="/hub-portals-v6.css">\n  <script src="/hub-portals-v6.js" defer></script>\n</head>#' dist/index.html

# Homepage only: 11-world cosmic renderer. Preview + Live Editor keep background-fluid.js.
sed -i 's#<script src="/editor/background-fluid.js"></script>#<script src="/hub-cosmic-v5.js"></script>#' dist/index.html

# Same typography layer in Preview and Live Editor.
sed -i 's#</head>#  <link rel="stylesheet" href="/openai-type.css">\n</head>#' dist/preview.html
sed -i 's#</head>#  <link rel="stylesheet" href="/openai-type.css">\n</head>#' dist/editor/index.html

# Guardrails.
test -f dist/index.html
test -f dist/preview.html
test -f dist/hub-portals-v6.css
test -f dist/hub-portals-v6.js
test -f dist/fetch/index.html
test -f dist/fetch/studio.js
test -f dist/fetch/visual-resolver.js
test -f dist/fetch/editor/index.html
test -f dist/fetch/editor/editor.js
test -f dist/editor/index.html
test -f dist/editor/editor.js
test -f dist/editor/addons/v1.3.2-kv-route-loader.js
test -f dist/editor/addons/v1.3.3-editor-route-nav.js
grep -q 'hub-portals-v6.css' dist/index.html
grep -q 'hub-portals-v6.js' dist/index.html
grep -q 'hub-cosmic-v5.js' dist/index.html
grep -q '4N1F LABS · FETCH ENGINE V2.26' dist/fetch/index.html
grep -q '4N1F — FETCH NATIVE EDITOR V2.26' dist/fetch/editor/index.html

echo "4N1F Cloudflare bundle ready: Hub + Fetch V2.26 + Package/Preview flow"
