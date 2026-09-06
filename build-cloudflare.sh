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

# Reconstruct the user-supplied V2.26 Fetch + Native Editor archive.
# The original multipart upload had one overlapping segment; the correction
# fragments below restore the exact source archive byte-for-byte.
{
  cat vendor/fetch-v226/corr-prefix-00
  cat vendor/fetch-v226/corr-prefix-01
  head -c 12000 vendor/fetch-v226/fetch-v226.tar.gz.b64.part-01
  cat vendor/fetch-v226/fetch-v226.tar.gz.b64.part-02
  cat vendor/fetch-v226/fetch-v226.tar.gz.b64.part-03
  cat vendor/fetch-v226/fetch-v226.tar.gz.b64.part-04
  cat vendor/fetch-v226/fetch-v226.tar.gz.b64.part-05
  cat vendor/fetch-v226/fetch-v226.tar.gz.b64.part-06
  cat vendor/fetch-v226/corr-tail-a
  cat vendor/fetch-v226/corr-tail-b
  cat vendor/fetch-v226/corr-tail-cd
} > /tmp/4n1f-fetch-v226.b64

base64 -d /tmp/4n1f-fetch-v226.b64 > /tmp/4n1f-fetch-v226.tar.gz
echo "c22efd3c4a12b46a12ba092f4dd74a07fa3da3e23d2d69679e5f13349c2486cf  /tmp/4n1f-fetch-v226.tar.gz" | sha256sum -c -
tar -xzf /tmp/4n1f-fetch-v226.tar.gz -C dist
rm -f /tmp/4n1f-fetch-v226.b64 /tmp/4n1f-fetch-v226.tar.gz

# Keep the V2.26 engine intact while removing the remaining project-specific
# surface strings/routes from the transplanted Fetch tool. The historical
# DiniVisualResolver namespace is deliberately preserved because the V2.26
# Source Graph engine calls it internally.
node <<'NODE'
const fs = require('node:fs');

function patch(file, replacements) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to] of replacements) {
    if (!text.includes(from)) {
      console.warn(`[4N1F build] optional patch marker not found in ${file}: ${from.slice(0, 80)}`);
      continue;
    }
    text = text.split(from).join(to);
  }
  fs.writeFileSync(file, text);
}

patch('dist/fetch/editor/index.html', [
  ['href="./invitation.html?clean=1"', 'href="./clean-preview.html"']
]);

patch('dist/fetch/editor/editor.js', [
  ["title:'Dini Anif — '+", "title:'4N1F Fetch — '+"],
  ["frame.src='./invitation.html?editor=1&blankguard=1'", "frame.src='about:blank'"],
  ["frame.src='./invitation.html?editor=1'", "frame.src='about:blank'"],
  ['Package belum memakai Dynamic Native Schema. Scrape ulang dari menu Fetch.', 'Package belum memakai Dynamic Native Schema. Fetch ulang dari halaman Fetch.']
]);

patch('dist/fetch/studio.js', [
  ["title:'Dini Anif — '+", "title:'4N1F Fetch — '+"],
  ["format:'dini-anif-rebuild-package'", "format:'4n1f-fetch-rebuild-package'"]
]);

patch('dist/fetch/visual-resolver.js', [
  ["title='Dini Anif — Template'", "title='4N1F Fetch — Template'"],
  ["desc.content='Undangan Dini Anif'", "desc.content='4N1F Fetch source-native rebuild'"],
  ["data-dini-identity-sanitized", "data-4n1f-identity-sanitized"]
]);

patch('dist/fetch/preview.html', [
  ['← Kembali ke Scrape', '← Kembali ke Fetch'],
  ['Kembali ke halaman Scrape, Analyze lalu Generate Rebuild.', 'Kembali ke halaman Fetch, Analyze lalu Generate Rebuild.'],
  ['Buka Scrape Studio', 'Buka Fetch Studio']
]);
NODE

# Homepage visual stack + the two locked entry points.
sed -i 's#</head>#  <link rel="stylesheet" href="/hub-command-deck-v2.css">\n  <link rel="stylesheet" href="/hub-21st-v3.css">\n  <link rel="stylesheet" href="/openai-type.css">\n  <link rel="stylesheet" href="/hub-ambient-v4.css">\n  <link rel="stylesheet" href="/hub-portals-v6.css">\n  <script src="/hub-portals-v6.js" defer></script>\n</head>#' dist/index.html

# Homepage only: 11-world cosmic renderer. Preview + Live Editor keep background-fluid.js.
sed -i 's#<script src="/editor/background-fluid.js"></script>#<script src="/hub-cosmic-v5.js"></script>#' dist/index.html

# Same typography layer in Preview and Live Editor.
sed -i 's#</head>#  <link rel="stylesheet" href="/openai-type.css">\n</head>#' dist/preview.html
sed -i 's#</head>#  <link rel="stylesheet" href="/openai-type.css">\n</head>#' dist/editor/index.html

# Guardrails: both independent tool paths must survive the build.
test -f dist/index.html
test -f dist/preview.html
test -f dist/hub-portals-v6.css
test -f dist/hub-portals-v6.js
test -f dist/fetch/index.html
test -f dist/fetch/studio.js
test -f dist/fetch/visual-resolver.js
test -f dist/fetch/preview.html
test -f dist/fetch/editor/index.html
test -f dist/fetch/editor/editor.js
test -f dist/fetch/editor/clean-preview.html
test -f dist/fetch/editor/clean-preview.js
test -f dist/editor/index.html
test -f dist/editor/editor.js
test -f dist/editor/addons/v1.3.2-kv-route-loader.js
test -f dist/editor/addons/v1.3.3-editor-route-nav.js

grep -q 'hub-portals-v6.css' dist/index.html
grep -q 'hub-portals-v6.js' dist/index.html
grep -q 'hub-cosmic-v5.js' dist/index.html
grep -q '4N1F LABS · FETCH ENGINE V2.26' dist/fetch/index.html
grep -q '4N1F — FETCH NATIVE EDITOR V2.26' dist/fetch/editor/index.html
grep -q 'href="./clean-preview.html"' dist/fetch/editor/index.html
grep -q "const adminSb=null" dist/fetch/editor/editor.js
grep -q "format:'4n1f-fetch-rebuild-package'" dist/fetch/studio.js
grep -q "title='4N1F Fetch — Template'" dist/fetch/visual-resolver.js
! grep -q 'invitation.html?clean=1' dist/fetch/editor/index.html
! grep -q 'Dini Anif —' dist/fetch/studio.js

node --check dist/fetch/studio.js
node --check dist/fetch/preview-studio.js
node --check dist/fetch/editor/editor.js
node --check dist/fetch/editor/clean-preview.js

echo "4N1F Cloudflare bundle ready: Hub + Fetch V2.26 Native Editor + Package/Preview Live Editor"
