import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/publisher-v1-prepare.mjs <input.json> <output.json>');
  process.exit(2);
}

const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const packageKey = String(source.package_key || '').trim().toUpperCase();
if (!/^4N1F_[A-F0-9]{12}$/.test(packageKey)) {
  throw new Error('package_key harus 4N1F_ + 12 hexadecimal.');
}

const expectedStem = path.basename(inputPath, path.extname(inputPath)).toUpperCase();
if (expectedStem !== packageKey) {
  throw new Error(`Nama file harus sama dengan package_key (${packageKey}.json).`);
}

function payloadFromInflatedText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const html = String(parsed.html_code || parsed.html || '');
      const css = String(parsed.css_code || parsed.css || '');
      const js = String(parsed.js_code || parsed.js || '');
      if (html.trim()) return { html, css, js, format: 'json' };
    } catch {
      // Continue as raw HTML.
    }
  }

  if (/<!doctype\s+html|<html[\s>]/i.test(trimmed)) {
    return { html: trimmed, css: '', js: '', format: 'html' };
  }

  return null;
}

function orderedSubsets(items) {
  const out = [];
  const used = new Array(items.length).fill(false);
  const current = [];

  function walk() {
    out.push(current.slice());
    for (let i = 0; i < items.length; i += 1) {
      if (used[i]) continue;
      used[i] = true;
      current.push(items[i]);
      walk();
      current.pop();
      used[i] = false;
    }
  }

  walk();
  return out;
}

function inflateStagedPayload(dirValue) {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const assetDir = path.resolve(repoRoot, String(dirValue));
  const allowedRoot = path.resolve(repoRoot, 'publisher', 'assets', packageKey);
  if (assetDir !== allowedRoot) {
    throw new Error(`staged_gzip_base64_dir harus tepat ${path.relative(repoRoot, allowedRoot)}.`);
  }
  if (!fs.existsSync(assetDir) || !fs.statSync(assetDir).isDirectory()) {
    throw new Error(`Staging directory tidak ditemukan: ${assetDir}`);
  }

  const fragments = fs.readdirSync(assetDir)
    .filter((name) => name.endsWith('.b64'))
    .map((name) => ({
      name,
      text: fs.readFileSync(path.join(assetDir, name), 'utf8').replace(/\s+/g, '')
    }))
    .filter((x) => x.text.length > 0);

  if (!fragments.length) throw new Error('Tidak ada fragment .b64 di staging directory.');

  const starts = fragments.filter((x) => x.text.startsWith('H4sI'));
  const ends = fragments.filter((x) => /=+$/.test(x.text));
  if (!starts.length) throw new Error('Fragment awal gzip/base64 (H4sI) tidak ditemukan.');
  if (!ends.length) throw new Error('Fragment akhir base64 ber-padding tidak ditemukan.');

  const preferredNames = [
    ['part-00.b64', 'part-01.b64', 'part-02.b64', 'part-03.b64', 'part-03-04.b64', 'part-05-06.b64', 'part-07-08.b64'],
    ['part-00.b64', 'part-01.b64', 'part-02.b64', 'part-03-04.b64', 'part-05-06.b64', 'part-07-08.b64'],
    ['part-00.b64', 'part-01.b64', 'part-02.b64', 'part-03.b64', 'part-05-06.b64', 'part-07-08.b64']
  ];

  const byName = new Map(fragments.map((x) => [x.name, x]));
  const candidateLists = [];
  const seen = new Set();

  function addCandidate(list) {
    const key = list.map((x) => x.name).join('|');
    if (!list.length || seen.has(key)) return;
    seen.add(key);
    candidateLists.push(list);
  }

  for (const names of preferredNames) {
    if (names.every((name) => byName.has(name))) addCandidate(names.map((name) => byName.get(name)));
  }

  for (const start of starts) {
    for (const end of ends) {
      if (start === end) continue;
      const middle = fragments.filter((x) => x !== start && x !== end);
      for (const permutation of orderedSubsets(middle)) {
        addCandidate([start, ...permutation, end]);
      }
    }
  }

  let lastError = 'no candidate attempted';
  for (const list of candidateLists) {
    try {
      const joined = list.map((x) => x.text).join('');
      const compressed = Buffer.from(joined, 'base64');
      const inflated = zlib.gunzipSync(compressed);
      const decoded = payloadFromInflatedText(inflated.toString('utf8'));
      if (!decoded) {
        lastError = `gzip OK tetapi payload tidak dikenali: ${list.map((x) => x.name).join(', ')}`;
        continue;
      }
      if (/Preparing source-native package/i.test(decoded.html)) {
        lastError = `candidate masih placeholder: ${list.map((x) => x.name).join(', ')}`;
        continue;
      }
      return {
        ...decoded,
        parts: list.map((x) => x.name),
        inflatedBytes: inflated.length
      };
    } catch (error) {
      lastError = `${list.map((x) => x.name).join(', ')} -> ${error.message}`;
    }
  }

  throw new Error(`Gagal merekonstruksi staged source-native payload. Last error: ${lastError}`);
}

let htmlCode = String(source.html_code || '');
let cssCode = String(source.css_code || '');
let jsCode = String(source.js_code || '');
let reconstruction = null;

if (source.staged_gzip_base64_dir) {
  reconstruction = inflateStagedPayload(source.staged_gzip_base64_dir);
  htmlCode = reconstruction.html;
  cssCode = reconstruction.css;
  jsCode = reconstruction.js;
}

if (!htmlCode.trim()) throw new Error('html_code wajib diisi.');

const packageHash = crypto
  .createHash('sha256')
  .update(htmlCode)
  .update('\u0000')
  .update(cssCode)
  .update('\u0000')
  .update(jsCode)
  .digest('hex');

const payload = {
  schema: '4n1f-kv-package-v1',
  storage_engine: 'cloudflare-kv-direct',
  package_key: packageKey,
  project: String(source.project || '4N1F Labs').trim() || '4N1F Labs',
  version: String(source.version || 'draft').trim() || 'draft',
  package_hash: packageHash,
  created_at: source.created_at || new Date().toISOString(),
  pinned: source.pinned === true,
  html_code: htmlCode,
  css_code: cssCode,
  js_code: jsCode
};

fs.writeFileSync(outputPath, JSON.stringify(payload));
process.stdout.write(JSON.stringify({
  package_key: packageKey,
  package_hash: packageHash,
  reconstruction: reconstruction ? {
    format: reconstruction.format,
    parts: reconstruction.parts,
    inflated_bytes: reconstruction.inflatedBytes
  } : null
}));
