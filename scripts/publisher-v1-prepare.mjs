import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/publisher-v1-prepare.mjs <input.json> <output.json>');
  process.exit(2);
}

const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const packageKey = String(source.package_key || '').trim().toUpperCase();
if (!/^4N1F_[A-F0-9]{12}$/.test(packageKey)) throw new Error('package_key harus 4N1F_ + 12 hexadecimal.');
const expectedStem = path.basename(inputPath, path.extname(inputPath)).toUpperCase();
if (expectedStem !== packageKey) throw new Error(`Nama file harus sama dengan package_key (${packageKey}.json).`);

function decodePayload(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const html = String(parsed.html_code || parsed.html || '');
      const css = String(parsed.css_code || parsed.css || '');
      const js = String(parsed.js_code || parsed.js || '');
      if (html.trim()) return { html, css, js, format: 'json' };
    } catch {}
  }
  if (/<!doctype\s+html|<html[\s>]/i.test(trimmed)) return { html: trimmed, css: '', js: '', format: 'html' };
  return null;
}

function generatedPayload(fileValue) {
  if (packageKey !== '4N1F_D78A3066B413') throw new Error('generated_html_path hanya diizinkan untuk recovery package D78.');
  const expected = '/tmp/d78-source-native.html';
  const file = path.resolve(String(fileValue));
  if (file !== expected) throw new Error(`generated_html_path harus ${expected}.`);
  if (!fs.existsSync(file)) throw new Error(`Generated source-native belum tersedia: ${file}`);
  const html = fs.readFileSync(file, 'utf8');
  if (!/^<!doctype html>/i.test(html.trim())) throw new Error('Generated D78 payload bukan HTML source-native.');
  if (/Preparing source-native package/i.test(html)) throw new Error('Generated D78 payload masih placeholder.');
  if (!/data-4n1f-identity-sanitized="1"/.test(html)) throw new Error('Generated D78 payload kehilangan identity sanitation marker.');
  if (!/https:\/\/www\.arteriorshome\.com\//i.test(html)) throw new Error('Generated D78 payload bukan rebuild Arteriors.');
  return {html, css:'', js:'', format:'generated-browser-v2.26'};
}

function stagedPayload(dirValue) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, '..');
  const expectedDir = path.resolve(repoRoot, 'publisher', 'assets', packageKey);
  const assetDir = path.resolve(repoRoot, String(dirValue));
  if (assetDir !== expectedDir) throw new Error(`staged_gzip_base64_dir harus tepat ${path.relative(repoRoot, expectedDir)}.`);

  const sequence = ['part-00.b64','part-01.b64','part-02.b64','part-03.b64','part-05-06.b64','part-07-08.b64'];
  const parts = sequence.map((name) => {
    const file = path.join(assetDir, name);
    if (!fs.existsSync(file)) throw new Error(`Fragment wajib tidak ditemukan: ${name}`);
    const raw = fs.readFileSync(file, 'utf8').replace(/\s+/g, '');
    const text = raw.replace(/[^A-Za-z0-9+/=]/g, '');
    return { name, text };
  });
  const joined = parts.map(p=>p.text).join('');
  let inflated;
  try { inflated = zlib.gunzipSync(Buffer.from(joined, 'base64')); }
  catch (error) { throw new Error(`D78 staged reconstruction gagal: ${error.code || error.name}: ${error.message}`); }
  const decoded = decodePayload(inflated.toString('utf8'));
  if (!decoded) throw new Error(`D78 gzip berhasil (${inflated.length} bytes) tetapi payload bukan JSON/HTML yang dikenali.`);
  if (/Preparing source-native package/i.test(decoded.html)) throw new Error('D78 reconstruction menghasilkan placeholder; publish diblokir.');
  return { ...decoded, parts: sequence, inflatedBytes: inflated.length };
}

let htmlCode = String(source.html_code || '');
let cssCode = String(source.css_code || '');
let jsCode = String(source.js_code || '');
let reconstruction = null;

if (source.generated_html_path) {
  reconstruction = generatedPayload(source.generated_html_path);
  htmlCode = reconstruction.html;
  cssCode = reconstruction.css;
  jsCode = reconstruction.js;
} else if (source.staged_gzip_base64_dir) {
  reconstruction = stagedPayload(source.staged_gzip_base64_dir);
  htmlCode = reconstruction.html;
  cssCode = reconstruction.css;
  jsCode = reconstruction.js;
}

if (!htmlCode.trim()) throw new Error('html_code wajib diisi.');
const packageHash = crypto.createHash('sha256').update(htmlCode).update('\u0000').update(cssCode).update('\u0000').update(jsCode).digest('hex');
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
    parts: reconstruction.parts || null,
    inflated_bytes: reconstruction.inflatedBytes || null,
    html_chars: htmlCode.length
  } : null
}));
