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
    const invalidMatches = [...raw.matchAll(/[^A-Za-z0-9+/=]/g)];
    if (invalidMatches.length) {
      const first = invalidMatches[0].index;
      const last = invalidMatches[invalidMatches.length - 1].index;
      console.error(`${name}: invalid=${invalidMatches.length} positions=${invalidMatches.map(m => m.index).join(',')} context=${JSON.stringify(raw.slice(Math.max(0, first - 24), Math.min(raw.length, last + 25)))}`);
    }
    const text = raw.replace(/[^A-Za-z0-9+/=]/g, '');
    return { name, text, rawLength: raw.length };
  });

  console.error('D78 staged fragments after separator cleanup:');
  for (const p of parts) console.error(`${p.name}: raw=${p.rawLength} clean=${p.text.length} mod4=${p.text.length % 4} head=${p.text.slice(0,8)} tail=${p.text.slice(-8)}`);

  let joined = '';
  const prefixDiagnostics = [];
  for (const p of parts) {
    joined += p.text;
    try {
      const inflated = zlib.gunzipSync(Buffer.from(joined, 'base64'));
      prefixDiagnostics.push(`${p.name}: OK inflated=${inflated.length}`);
    } catch (error) {
      prefixDiagnostics.push(`${p.name}: ${error.code || error.name}: ${error.message}`);
    }
  }
  console.error('D78 gzip prefix diagnostics: ' + prefixDiagnostics.join(' | '));

  let inflated;
  try { inflated = zlib.gunzipSync(Buffer.from(joined, 'base64')); }
  catch (error) { throw new Error(`D78 deterministic reconstruction gagal: ${error.code || error.name}: ${error.message}`); }

  const decoded = decodePayload(inflated.toString('utf8'));
  if (!decoded) throw new Error(`D78 gzip berhasil (${inflated.length} bytes) tetapi payload bukan JSON/HTML yang dikenali.`);
  if (/Preparing source-native package/i.test(decoded.html)) throw new Error('D78 reconstruction menghasilkan placeholder; publish diblokir.');
  return { ...decoded, parts: sequence, inflatedBytes: inflated.length };
}

let htmlCode = String(source.html_code || '');
let cssCode = String(source.css_code || '');
let jsCode = String(source.js_code || '');
let reconstruction = null;
if (source.staged_gzip_base64_dir) {
  reconstruction = stagedPayload(source.staged_gzip_base64_dir);
  htmlCode = reconstruction.html;
  cssCode = reconstruction.css;
  jsCode = reconstruction.js;
}
if (!htmlCode.trim()) throw new Error('html_code wajib diisi.');
const packageHash = crypto.createHash('sha256').update(htmlCode).update('\u0000').update(cssCode).update('\u0000').update(jsCode).digest('hex');
const payload = {
  schema: '4n1f-kv-package-v1', storage_engine: 'cloudflare-kv-direct', package_key: packageKey,
  project: String(source.project || '4N1F Labs').trim() || '4N1F Labs',
  version: String(source.version || 'draft').trim() || 'draft', package_hash: packageHash,
  created_at: source.created_at || new Date().toISOString(), pinned: source.pinned === true,
  html_code: htmlCode, css_code: cssCode, js_code: jsCode
};
fs.writeFileSync(outputPath, JSON.stringify(payload));
process.stdout.write(JSON.stringify({ package_key: packageKey, package_hash: packageHash,
  reconstruction: reconstruction ? { format: reconstruction.format, parts: reconstruction.parts, inflated_bytes: reconstruction.inflatedBytes } : null }));
