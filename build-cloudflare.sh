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

# Pristine Fetch V2.26 package rebuilt directly from the original healthy ZIP.
# One continuous base64 stream; no historical correction-fragment reconstruction.
FETCH_VENDOR="vendor/fetch-v226-pristine"
required_fetch_parts=(
  "$FETCH_VENDOR/part-00.b64"
  "$FETCH_VENDOR/part-01.b64"
  "$FETCH_VENDOR/part-02.b64"
  "$FETCH_VENDOR/part-03.b64"
  "$FETCH_VENDOR/part-04.b64"
  "$FETCH_VENDOR/part-05.b64"
  "$FETCH_VENDOR/part-06.b64"
  "$FETCH_VENDOR/part-07.b64"
  "$FETCH_VENDOR/part-08.b64"
  "$FETCH_VENDOR/part-09.b64"
  "$FETCH_VENDOR/part-10-00.b64"
  "$FETCH_VENDOR/part-10-01.b64"
  "$FETCH_VENDOR/part-10-02.b64"
  "$FETCH_VENDOR/part-10-03.b64"
  "$FETCH_VENDOR/part-11-00.b64"
  "$FETCH_VENDOR/part-11-01.b64"
  "$FETCH_VENDOR/part-11-02.b64"
  "$FETCH_VENDOR/part-11-03.b64"
  "$FETCH_VENDOR/part-12-00.b64"
  "$FETCH_VENDOR/part-12-01.b64"
  "$FETCH_VENDOR/part-12-02.b64"
  "$FETCH_VENDOR/part-12-03.b64"
)

for part in "${required_fetch_parts[@]}"; do
  test -s "$part" || { echo "[4N1F build] missing pristine Fetch V2.26 part: $part" >&2; exit 1; }
done

cat "${required_fetch_parts[@]}" > /tmp/4n1f-fetch-v226-pristine.b64
test "$(wc -c < /tmp/4n1f-fetch-v226-pristine.b64)" -eq 153424
base64 -d /tmp/4n1f-fetch-v226-pristine.b64 > /tmp/4n1f-fetch-v226-pristine.tar.gz

echo "b7ce8462dece1f872284f4cfaf139fcbfd68a569b55950e90215e85dedd293bb  /tmp/4n1f-fetch-v226-pristine.tar.gz" | sha256sum -c -
gzip -t /tmp/4n1f-fetch-v226-pristine.tar.gz
tar -tzf /tmp/4n1f-fetch-v226-pristine.tar.gz >/dev/null
tar -xzf /tmp/4n1f-fetch-v226-pristine.tar.gz -C dist
rm -f /tmp/4n1f-fetch-v226-pristine.b64 /tmp/4n1f-fetch-v226-pristine.tar.gz

node <<'NODE'
const fs = require('node:fs');
function patch(file, replacements) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to] of replacements) text = text.split(from).join(to);
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

sed -i 's#</head>#  <link rel="stylesheet" href="/hub-command-deck-v2.css">\n  <link rel="stylesheet" href="/hub-21st-v3.css">\n  <link rel="stylesheet" href="/openai-type.css">\n  <link rel="stylesheet" href="/hub-ambient-v4.css">\n  <link rel="stylesheet" href="/hub-portals-v6.css">\n  <script src="/hub-portals-v6.js" defer></script>\n</head>#' dist/index.html
sed -i 's#<script src="/editor/background-fluid.js"></script>#<script src="/hub-cosmic-v5.js"></script>#' dist/index.html
sed -i 's#</head>#  <link rel="stylesheet" href="/openai-type.css">\n</head>#' dist/preview.html
sed -i 's#</head>#  <link rel="stylesheet" href="/openai-type.css">\n</head>#' dist/editor/index.html

test -f dist/index.html
test -f dist/preview.html
test -f dist/hub-portals-v6.css
test -f dist/hub-portals-v6.js
test -f dist/fetch/index.html
test -f dist/fetch/studio.js
test -f dist/fetch/preview-studio.js
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

grep -q 'class="hub-gate hub-gate-fetch" href="/fetch/"' dist/index.html
grep -q '<strong>FETCH</strong>' dist/index.html
! grep -q 'Masukkan Package Key untuk membuat sesi Preview baru' dist/index.html
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
node --check dist/fetch/visual-resolver.js
node --check dist/fetch/editor/editor.js
node --check dist/fetch/editor/clean-preview.js

echo "4N1F Cloudflare PRISTINE bundle PASS: Hub + Fetch V2.26 + Native Editor + Preview ID"
