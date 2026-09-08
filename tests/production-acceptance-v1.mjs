import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, request as playwrightRequest } from 'playwright';

const FRONTEND = 'https://4n1f-labs-cinematic-cloudflare.faqihanif12282000.workers.dev';
const BACKEND = 'https://4n1f-kv-api.faqihanif12282000.workers.dev';
const PACKAGE_KEY = '4N1F_C7E21B9A6D04';
const marker = `ACCEPTANCE-${Date.now()}`;
const artifactsDir = path.resolve('artifacts');
await fs.mkdir(artifactsDir, { recursive: true });

const api = await playwrightRequest.newContext();
console.log('[acceptance] backend API-only contract');
{
  const health = await api.get(`${BACKEND}/health`);
  assert.equal(health.status(), 200);
  const h = await health.json();
  assert.equal(h.success, true);
  assert.equal(h.service, '4n1f-kv-api');

  const root = await api.get(`${BACKEND}/`);
  assert.equal(root.status(), 404, 'Backend root must not serve legacy editor assets');
  const r = await root.json();
  assert.equal(r.success, false);
  assert.equal(r.message, 'Route tidak ditemukan.');

  const pkg = await api.get(`${BACKEND}/package/${PACKAGE_KEY}`);
  assert.equal(pkg.status(), 200);
  const p = await pkg.json();
  assert.equal(p.success, true);
  assert.equal(p.package_key, PACKAGE_KEY);
}

console.log('[acceptance] frontend Hub semantic contract');
{
  const root = await api.get(`${FRONTEND}/`);
  assert.equal(root.status(), 200);
  const html = await root.text();
  assert.ok(html.includes('4N1F = PREVIEW ONLY · p_ = EDITABLE SESSION'));
  assert.ok(html.includes('4N1F Preview Key → Preview-only · p_ Editor Session → Live Editor'));
  assert.ok(!html.includes('IMMUTABLE PACKAGE · TEMPORARY PREVIEW SESSION'));
  assert.ok(!html.includes('Package Key → Generate → Preview → Open Live Editor → Revision → Key baru'));
}

console.log('[acceptance] Fetch routes remain present');
for (const route of ['/fetch/', '/fetch/preview.html', '/fetch/editor/', '/fetch/editor/clean-preview.html']) {
  const res = await api.get(`${FRONTEND}${route}`);
  assert.equal(res.status(), 200, `${route} unavailable`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();
const requests = [];
page.on('request', req => requests.push(req.url()));

try {
  console.log('[acceptance] 4N1F preview resolves directly without p_ session');
  await page.goto(`${FRONTEND}/editor/package-preview.html?package_key=${PACKAGE_KEY}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000
  });
  await page.waitForFunction(() => document.body.classList.contains('is-ready'), null, { timeout: 20_000 });
  await page.frameLocator('#previewFrame').locator('#proof').waitFor({ state: 'visible', timeout: 15_000 });
  assert.ok(requests.some(u => u.includes('/api/kv-package?package_key=')), 'Direct package resolver was not used');
  assert.ok(!requests.some(u => u.includes('/api/kv-session')), 'Preview-only load created p_ session before edit intent');
  assert.equal((await page.frameLocator('#previewFrame').locator('#proof').textContent())?.trim(), 'Source-only publish proof.');

  console.log('[acceptance] edit intent creates fresh p_ session only on click');
  const requestCountBeforeEdit = requests.length;
  await Promise.all([
    page.waitForURL(/\/editor\/p_[a-f0-9]{32}\/?$/i, { timeout: 20_000 }),
    page.locator('#editorLink').click()
  ]);
  assert.ok(requests.slice(requestCountBeforeEdit).some(u => u.includes('/api/kv-session')), 'Edit intent did not create editable session');
  const match = page.url().match(/\/(p_[a-f0-9]{32})\/?$/i);
  assert.ok(match, `Editor URL missing p_ session: ${page.url()}`);
  const previewId = match[1].toLowerCase();
  console.log(`[acceptance] editable session ${previewId}`);

  await page.locator('#previewIdInput').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForFunction(id => document.querySelector('#previewIdInput')?.value?.toLowerCase() === id, previewId, { timeout: 15_000 });
  await page.waitForFunction(() => Boolean(window.__4N1F_STATE_SEAL_API__), null, { timeout: 15_000 });
  const target = page.frameLocator('#previewFrame');
  await target.locator('#proof').waitFor({ state: 'visible', timeout: 20_000 });

  console.log('[acceptance] state seal CURRENT = APPLY = Clean Preview = ZIP');
  await target.locator('#proof').click();
  await page.locator('#editorFields').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#textValue').fill(marker);
  await page.locator('#applyBtn').click();
  await page.waitForFunction(value => document.querySelector('#codeOutput')?.textContent?.includes(value), marker, { timeout: 10_000 });
  assert.equal((await target.locator('#proof').textContent())?.trim(), marker);

  const popupPromise = page.waitForEvent('popup', { timeout: 10_000 });
  await page.locator('#cleanPreviewBtn').click();
  const clean = await popupPromise;
  await clean.waitForURL(/^blob:/, { timeout: 15_000 });
  await clean.locator('#proof').waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal((await clean.locator('#proof').textContent())?.trim(), marker);
  assert.equal(await clean.locator('#__4n1f_box').count(), 0);
  assert.equal(await clean.locator('[class*="__4n1f_"]').count(), 0);

  await page.locator('#exportBtn').click();
  await page.locator('#exportMenu').waitFor({ state: 'visible', timeout: 5_000 });
  const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
  await page.locator('[data-export="zip"]').click();
  const download = await downloadPromise;
  const zipPath = path.join(artifactsDir, `${previewId}-acceptance.zip`);
  await download.saveAs(zipPath);
  const zipHtml = execFileSync('unzip', ['-p', zipPath, 'index.html'], { encoding: 'utf8' });
  const manifest = JSON.parse(execFileSync('unzip', ['-p', zipPath, '4n1f/manifest.json'], { encoding: 'utf8' }));
  assert.ok(zipHtml.includes(marker));
  assert.ok(!zipHtml.includes('__4n1f_selected') && !zipHtml.includes('__4n1f_box'));
  assert.equal(manifest.preview_id, previewId);
  assert.equal(manifest.contract, 'CURRENT = APPLY = CLEAN_PREVIEW = ZIP');

  console.log(`[acceptance] GREEN ${PACKAGE_KEY} -> ${previewId}`);
  console.log('[acceptance] HUB + DIRECT PREVIEW + EDIT SESSION + API-ONLY BACKEND + FETCH + STATE SEAL = GREEN');
} finally {
  await browser.close();
  await api.dispose();
}
