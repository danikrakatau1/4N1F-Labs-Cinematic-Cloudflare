import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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

const htmlCode = String(source.html_code || '');
const cssCode = String(source.css_code || '');
const jsCode = String(source.js_code || '');
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
process.stdout.write(JSON.stringify({ package_key: packageKey, package_hash: packageHash }));
