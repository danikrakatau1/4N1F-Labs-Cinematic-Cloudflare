const KV_API = 'https://4n1f-kv-api.faqihanif12282000.workers.dev';

const PREVIEW_PATH = /^\/p_[a-f0-9]{32}\/?$/i;
const EDITOR_PATH = /^\/editor\/p_[a-f0-9]{32}\/?$/i;
const FETCH_SOURCE_LIMIT = 3_500_000;
const FETCH_ASSET_CHUNK = 3_000_000;
const FETCH_REDIRECTS = 3;

// Isolated 4N1F experiment contract. This never enters the immutable-package KV flow.
const BALI_LAB_KEY = '4N1F_BA11CA1D1A01';
const BALI_LAB_PREVIEW = 'p_ba11ca1d1a0100000000000000000000';
const BALI_LAB_ASSET = '/editor/webgl-lab/bali/index.html';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

async function serveAsset(request, env, pathname, noindex = false) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = '';
  const assetRequest = new Request(url.toString(), { method: 'GET', headers: request.headers });
  const response = await env.ASSETS.fetch(assetRequest);
  const headers = new Headers(response.headers);
  if (noindex) {
    headers.set('cache-control', 'no-store');
    headers.set('x-robots-tag', 'noindex, nofollow');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function normalizeHost(hostname) {
  return String(hostname || '').toLowerCase().replace(/^\[|\]$/g,'').replace(/\.$/,'');
}
function isIPv4(host) { return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host); }
function isIPv6(host) { return host.includes(':'); }
function blockedIPv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  return p[0] === 0 || p[0] === 10 || p[0] === 127 ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) ||
    (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
    (p[0] === 192 && p[1] === 0 && (p[2] === 0 || p[2] === 2)) ||
    (p[0] === 198 && (p[1] === 18 || p[1] === 19)) ||
    (p[0] === 198 && p[1] === 51 && p[2] === 100) ||
    (p[0] === 203 && p[1] === 0 && p[2] === 113) || p[0] >= 224;
}
function blockedIPv6(ip) {
  const v = normalizeHost(ip).split('%')[0];
  return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') ||
    /^fe[89ab]/.test(v) || v.startsWith('ff') || v.startsWith('2001:db8:') ||
    v.startsWith('::ffff:127.') || v.startsWith('::ffff:10.') || v.startsWith('::ffff:192.168.');
}
function blockedIp(ip) {
  if (isIPv4(ip)) return blockedIPv4(ip);
  if (isIPv6(ip)) return blockedIPv6(ip);
  return true;
}

async function resolvePublicHost(host) {
  if (isIPv4(host) || isIPv6(host)) {
    if (blockedIp(host)) throw new Error('IP lokal/private diblok.');
    return;
  }
  const addresses = [];
  for (const type of ['A','AAAA']) {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, {
      headers: { accept: 'application/dns-json' },
      cf: { cacheTtl: 60, cacheEverything: true }
    });
    if (!r.ok) throw new Error('Validasi DNS gagal.');
    const data = await r.json().catch(() => null);
    for (const ans of data?.Answer || []) {
      if ((ans.type === 1 || ans.type === 28) && typeof ans.data === 'string') addresses.push(ans.data);
    }
  }
  if (!addresses.length) throw new Error('Hostname tidak dapat di-resolve.');
  if (addresses.some(blockedIp)) throw new Error('Hostname mengarah ke jaringan lokal/private.');
}

async function validateTarget(url) {
  if (!['http:','https:'].includes(url.protocol)) throw new Error('Hanya URL http/https yang didukung.');
  if (url.username || url.password) throw new Error('URL dengan username/password tidak didukung.');
  const host = normalizeHost(url.hostname);
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Host lokal/private diblok.');
  }
  await resolvePublicHost(host);
}

async function readLimitedText(response, limit = FETCH_SOURCE_LIMIT) {
  const len = Number(response.headers.get('content-length') || 0);
  if (len && len > limit) throw new Error(`Source terlalu besar. Maks ${(limit/1_000_000).toFixed(1)} MB.`);
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      try { await reader.cancel(); } catch {}
      throw new Error(`Source terlalu besar. Maks ${(limit/1_000_000).toFixed(1)} MB.`);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(out);
}

async function fetchHtml(rawUrl) {
  let current = new URL(rawUrl);
  for (let i = 0; i <= FETCH_REDIRECTS; i++) {
    await validateTarget(current);
    const response = await fetch(current.href, {
      method: 'GET', redirect: 'manual',
      headers: {
        accept: 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.5,*/*;q=0.1',
        'user-agent': 'Mozilla/5.0 (compatible; 4N1F-Fetch-Studio/2.26; Cloudflare-Worker)'
      },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect tanpa Location header.');
      if (i === FETCH_REDIRECTS) throw new Error('Terlalu banyak redirect.');
      current = new URL(location,current);
      continue;
    }
    if (!response.ok) throw new Error(`Website mengembalikan HTTP ${response.status}.`);
    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (type && !/(text\/html|application\/xhtml\+xml|text\/plain)/.test(type)) throw new Error(`Content-Type bukan HTML (${type.split(';')[0]}).`);
    const html = await readLimitedText(response);
    if (!/<(?:!doctype|html|head|body|section|div)[\s>]/i.test(html)) throw new Error('Response tidak terlihat seperti HTML yang bisa dianalisis.');
    return { html, finalUrl: current.href, contentType: type || 'unknown' };
  }
  throw new Error('Fetch source gagal.');
}

async function fetchSource(request) {
  if (!['GET','POST'].includes(request.method)) return json({ok:false,error:'Method tidak didukung.'},405);
  const url = new URL(request.url);
  let raw = url.searchParams.get('url');
  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    raw = body?.url;
  }
  if (!raw || typeof raw !== 'string') return json({ok:false,error:'URL wajib diisi.'},400);
  if (raw.length > 2048) return json({ok:false,error:'URL terlalu panjang.'},400);
  try {
    const result = await fetchHtml(raw.trim());
    return json({ok:true,url:result.finalUrl,bytes:new TextEncoder().encode(result.html).byteLength,contentType:result.contentType,html:result.html});
  } catch (error) {
    return json({ok:false,error:error?.message || 'Fetch source gagal.'},422);
  }
}

function safeAssetName(url, contentType) {
  let name = 'asset';
  try { name = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'asset'); } catch {}
  name = name.replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-120) || 'asset';
  if (!/\.[a-z0-9]{2,5}$/i.test(name)) {
    const ext = {'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','video/mp4':'.mp4','audio/mpeg':'.mp3'}[String(contentType||'').split(';')[0]];
    if (ext) name += ext;
  }
  return name;
}

async function fetchAsset(request) {
  if (request.method !== 'GET') return json({ok:false,error:'Method tidak didukung.'},405);
  const reqUrl = new URL(request.url);
  const raw = String(reqUrl.searchParams.get('url') || '');
  if (!raw) return json({ok:false,error:'URL asset wajib diisi.'},400);
  const offset = Math.max(0, Number(reqUrl.searchParams.get('offset') || 0) || 0);
  const size = Math.min(FETCH_ASSET_CHUNK, Math.max(64*1024, Number(reqUrl.searchParams.get('size') || FETCH_ASSET_CHUNK) || FETCH_ASSET_CHUNK));
  try {
    let current = new URL(raw);
    let response;
    for (let i=0;i<=FETCH_REDIRECTS;i++) {
      await validateTarget(current);
      response = await fetch(current.href, {
        method:'GET', redirect:'manual',
        headers:{Range:`bytes=${offset}-${offset+size-1}`,'user-agent':'Mozilla/5.0 (compatible; 4N1F-AssetGenerator/2.26)'},
        cf:{cacheTtl:0,cacheEverything:false}
      });
      if ([301,302,303,307,308].includes(response.status)) {
        const location=response.headers.get('location');
        if (!location) throw new Error('Redirect asset tanpa Location header.');
        if (i===FETCH_REDIRECTS) throw new Error('Terlalu banyak redirect asset.');
        current=new URL(location,current); continue;
      }
      break;
    }
    if (!response || (!response.ok && response.status !== 206)) throw new Error(`Asset HTTP ${response?.status || 502}`);
    if (offset > 0 && response.status !== 206) throw new Error('Server sumber tidak mendukung Range untuk asset besar.');
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > FETCH_ASSET_CHUNK + 512000) throw new Error('Chunk asset melebihi batas aman.');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentRange = response.headers.get('content-range') || '';
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > FETCH_ASSET_CHUNK + 512000) throw new Error('Chunk asset melebihi batas aman.');
    const match = contentRange.match(/\/(\d+)$/);
    const total = match ? Number(match[1]) : (response.status === 200 ? bytes.byteLength : 0);
    return new Response(bytes, {status:200,headers:{
      'content-type':contentType,'cache-control':'no-store','x-content-type-options':'nosniff',
      'x-asset-total':String(total || bytes.byteLength),'x-asset-offset':String(offset),
      'x-asset-name':encodeURIComponent(safeAssetName(current.href,contentType)),
      'x-asset-range':response.status === 206 ? '1' : '0'
    }});
  } catch (error) {
    return json({ok:false,error:error?.message || 'Fetch asset gagal.'},422);
  }
}

async function createPreviewSession(request) {
  if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed.' }, 405);
  const body = await request.json().catch(() => null);
  if (!body) return json({ success: false, message: 'Body JSON tidak valid.' }, 400);
  const packageKey = String(body?.package_key || '').trim().toUpperCase();
  if (!/^4N1F_[A-F0-9]{12}$/.test(packageKey)) return json({ success: false, message: 'Format Package Key tidak valid.' }, 400);

  if (packageKey === BALI_LAB_KEY) {
    return json({
      success: true,
      preview_id: BALI_LAB_PREVIEW,
      storage_engine: '4n1f-isolated-lab',
      experiment: 'bali-candi-bentar-v1'
    });
  }

  try {
    const response = await fetch(`${KV_API}/session`, {method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({package_key:packageKey})});
    const data = await response.json().catch(() => null);
    if (!response.ok) return json(data || {success:false,message:`KV session gagal (${response.status}).`},response.status);
    return json(data || {success:false,message:'Respons KV session kosong.'});
  } catch (error) { return json({success:false,message:error?.message || 'Cloudflare KV session bridge gagal.'},502); }
}

async function loadPreview(request) {
  if (request.method !== 'GET') return json({ success: false, message: 'Method not allowed.' }, 405);
  const url = new URL(request.url);
  const previewId = String(url.searchParams.get('preview_id') || '').trim().toLowerCase();
  if (!/^p_[a-f0-9]{32}$/.test(previewId)) return json({ success: false, message: 'Preview ID tidak valid.' }, 400);
  try {
    const response = await fetch(`${KV_API}/preview/${encodeURIComponent(previewId)}`, {method:'GET',headers:{accept:'application/json'}});
    const data = await response.json().catch(() => null);
    if (!response.ok) return json(data || {success:false,message:`KV preview gagal (${response.status}).`},response.status);
    return json(data || {success:false,message:'Respons KV preview kosong.'});
  } catch (error) { return json({success:false,message:error?.message || 'Cloudflare KV preview bridge gagal.'},502); }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === '/api/kv-session') return createPreviewSession(request);
    if (path === '/api/kv-preview') return loadPreview(request);
    if (path === '/api/fetch-source') return fetchSource(request);
    if (path === '/api/fetch-asset') return fetchAsset(request);

    if (path === `/${BALI_LAB_PREVIEW}` || path === `/${BALI_LAB_PREVIEW}/`) return serveAsset(request, env, BALI_LAB_ASSET, true);
    if (path === `/editor/${BALI_LAB_PREVIEW}` || path === `/editor/${BALI_LAB_PREVIEW}/`) return serveAsset(request, env, BALI_LAB_ASSET, true);

    if (path === '/fetch' || path === '/fetch/') return serveAsset(request, env, '/fetch/index.html', true);
    if (path === '/fetch/editor' || path === '/fetch/editor/') return serveAsset(request, env, '/fetch/editor/index.html', true);
    if (PREVIEW_PATH.test(path)) return serveAsset(request, env, '/preview.html', true);
    if (EDITOR_PATH.test(path)) return serveAsset(request, env, '/editor/index.html', true);
    return env.ASSETS.fetch(request);
  }
};
