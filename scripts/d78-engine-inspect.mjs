import fs from 'node:fs';

const candidates = [
  'dist/fetch/studio.js',
  'dist/fetch/editor/studio.js',
  'dist/fetch/defaults.js',
  'dist/fetch/visual-resolver.js',
  'dist/fetch/zip-builder.js'
];
const needles = [
  'buildBtn', 'source-native', 'sourceNative', 'generateRebuild', 'buildRebuild',
  'preview.html', 'localStorage', 'sessionStorage', 'analyzeBtn', 'fetchSourceBtn',
  'DiniVisualResolver', 'SourceGraph', 'sourceGraph'
];

for (const file of candidates) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  console.error(`\n===== ${file} (${text.length} chars) =====`);
  const lines = text.split(/\r?\n/);
  const hits = new Set();
  for (let i = 0; i < lines.length; i += 1) {
    if (needles.some((n) => lines[i].includes(n))) hits.add(i);
  }
  for (const i of [...hits].slice(0, 80)) {
    const a = Math.max(0, i - 5);
    const b = Math.min(lines.length, i + 13);
    console.error(`--- ${file}:${i + 1} ---`);
    for (let j = a; j < b; j += 1) console.error(`${j + 1}: ${lines[j]}`);
  }
}
