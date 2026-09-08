import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = 'https://4n1f-labs-cinematic-cloudflare.faqihanif12282000.workers.dev';
const PACKAGE_KEY = '4N1F_C7E21B9A6D04';
const marker = `STATE-SEAL-SMOKE-${Date.now()}`;
const artifactsDir = path.resolve('artifacts');
await fs.mkdir(artifactsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

try {
  console.log(`[smoke] opening preview-only package ${PACKAGE_KEY}`);
  await page.goto(`${BASE}/editor/package-preview.html?package_key=${PACKAGE_KEY}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000
  });
  await page.locator('body').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.body.classList.contains('is-ready'), null, { timeout: 20_000 });
  const packageFrame = page.frameLocator('#previewFrame');
  await packageFrame.locator('#proof').waitFor({ state: 'visible', timeout: 15_000 });
  assert.equal(await page.locator('#editorLink').getAttribute('aria-disabled'), null, 'Preview unexpectedly non-editable');

  console.log('[smoke] clicking Open Live Editor and requiring a fresh p_ session');
  await Promise.all([
    page.waitForURL(/\/editor\/p_[a-f0-9]{32}\/?$/i, { timeout: 20_000 }),
    page.locator('#editorLink').click()
  ]);
  const match = page.url().match(/\/(p_[a-f0-9]{32})\/?$/i);
  assert.ok(match, `Editor URL did not contain p_ session: ${page.url()}`);
  const previewId = match[1].toLowerCase();
  console.log(`[smoke] editable session ${previewId}`);

  await page.locator('#previewIdInput').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForFunction(id => document.querySelector('#previewIdInput')?.value?.toLowerCase() === id, previewId, { timeout: 15_000 });
  await page.waitForFunction(() => Boolean(window.__4N1F_STATE_SEAL_API__), null, { timeout: 15_000 });
  await page.locator('#cleanPreviewBtn').waitFor({ state: 'visible', timeout: 15_000 });

  const target = page.frameLocator('#previewFrame');
  await target.locator('#proof').waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal((await target.locator('#proof').textContent())?.trim(), 'Source-only publish proof.');

  console.log('[smoke] editing real iframe target and APPLYing state');
  await target.locator('#proof').click();
  await page.locator('#editorFields').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#textValue').fill(marker);
  await page.locator('#applyBtn').click();
  await page.waitForFunction(value => document.querySelector('#codeOutput')?.textContent?.includes(value), marker, { timeout: 10_000 });
  assert.equal((await target.locator('#proof').textContent())?.trim(), marker, 'CURRENT/APPLY state mismatch');

  console.log('[smoke] opening Clean Preview from the same sealed state');
  const popupPromise = page.waitForEvent('popup', { timeout: 10_000 });
  await page.locator('#cleanPreviewBtn').click();
  const clean = await popupPromise;
  await clean.waitForURL(/^blob:/, { timeout: 15_000 });
  await clean.locator('#proof').waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal((await clean.locator('#proof').textContent())?.trim(), marker, 'Clean Preview diverged from APPLY state');
  const cleanHtml = await clean.locator('html').evaluate(el => el.outerHTML);
  assert.ok(!/__4n1f_/i.test(cleanHtml), 'Reserved __4n1f_ instrumentation leaked into Clean Preview');
  assert.ok(!/data-(?:editor|4n1f|four-n1f)-/i.test(cleanHtml), 'Reserved editor data attributes leaked into Clean Preview');

  console.log('[smoke] exporting Website ZIP · Sealed and comparing index.html');
  await page.locator('#exportBtn').click();
  await page.locator('#exportMenu').waitFor({ state: 'visible', timeout: 5_000 });
  const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
  await page.locator('[data-export="zip"]').click();
  const download = await downloadPromise;
  const zipPath = path.join(artifactsDir, `${previewId}-sealed.zip`);
  await download.saveAs(zipPath);

  const zipHtml = execFileSync('unzip', ['-p', zipPath, 'index.html'], { encoding: 'utf8' });
  const manifestText = execFileSync('unzip', ['-p', zipPath, '4n1f/manifest.json'], { encoding: 'utf8' });
  const manifest = JSON.parse(manifestText);
  assert.ok(zipHtml.includes(marker), 'ZIP index.html diverged from APPLY/Clean Preview state');
  assert.ok(!/__4n1f_/i.test(zipHtml), 'Reserved __4n1f_ instrumentation leaked into ZIP');
  assert.ok(!/data-(?:editor|4n1f|four-n1f)-/i.test(zipHtml), 'Reserved editor data attributes leaked into ZIP');
  assert.equal(manifest.preview_id, previewId);
  assert.equal(manifest.contract, 'CURRENT = APPLY = CLEAN_PREVIEW = ZIP');

  console.log(`[smoke] GREEN ${PACKAGE_KEY} -> ${previewId}`);
  console.log('[smoke] CURRENT = APPLY = CLEAN_PREVIEW = ZIP');
} finally {
  await browser.close();
}
