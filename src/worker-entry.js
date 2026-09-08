import baseWorker from './worker.js';

const BALI_LAB_KEY = '4N1F_BA11CA1D1A01';
const BALI_LAB_ASSET = '/editor/webgl-lab/bali/index.html';
const PACKAGE_KEY_RE = /^4N1F_[A-F0-9]{12}$/;
const PREVIEW_ID_RE = /^p_[a-f0-9]{32}$/i;

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

async function loadPackageDirect(request, env) {
  if (request.method !== 'GET') return json({ success:false, message:'Method not allowed.' }, 405);
  const url = new URL(request.url);
  const packageKey = String(url.searchParams.get('package_key') || '').trim().toUpperCase();
  if (!PACKAGE_KEY_RE.test(packageKey)) return json({ success:false, message:'Format Preview Key tidak valid.' }, 400);

  if (packageKey === BALI_LAB_KEY) {
    return json({
      success:true,
      schema:'4n1f-direct-preview-v1',
      storage_engine:'4n1f-isolated-lab',
      package_key:packageKey,
      project:'bali-candi-bentar-v1',
      asset_url:BALI_LAB_ASSET,
      editable:false
    });
  }

  if (!env.PREVIEW_PACKAGES) return json({ success:false, message:'Binding PREVIEW_PACKAGES belum tersedia.' }, 503);
  try {
    const row = await env.PREVIEW_PACKAGES.get(`pkg:${packageKey}`, 'json');
    if (!row) return json({ success:false, message:'Preview Key tidak ditemukan.' }, 404);
    if (!row.html_code && !row.asset_url) return json({ success:false, message:'Source package Preview Key tidak lengkap.' }, 422);
    return json({
      success:true,
      schema:row.schema || '4n1f-kv-package-v1',
      storage_engine:row.storage_engine || 'cloudflare-kv-direct',
      package_key:packageKey,
      project:row.project || '4N1F Labs',
      version:row.version || null,
      package_hash:row.package_hash || null,
      created_at:row.created_at || null,
      html_code:String(row.html_code || ''),
      css_code:String(row.css_code || ''),
      js_code:String(row.js_code || ''),
      asset_url:row.asset_url || null,
      editable:true
    });
  } catch (error) {
    return json({ success:false, message:error?.message || 'Direct Preview Key resolver gagal.' }, 502);
  }
}

async function createEditorSession(request, env) {
  if (request.method !== 'POST') return json({ success:false, message:'Method not allowed.' }, 405);
  if (!env.KV_BACKEND) return json({ success:false, message:'Binding KV_BACKEND belum tersedia.' }, 503);
  const body = await request.json().catch(() => null);
  const packageKey = String(body?.package_key || '').trim().toUpperCase();
  if (!PACKAGE_KEY_RE.test(packageKey)) return json({ success:false, message:'Format Package Key tidak valid.' }, 400);
  if (packageKey === BALI_LAB_KEY) return json({ success:false, message:'Isolated lab ini preview-only.' }, 409);
  try {
    const response = await env.KV_BACKEND.fetch('https://4n1f-kv-api.internal/session', {
      method:'POST',
      headers:{'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({package_key:packageKey})
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) return json(data || {success:false,message:`KV session gagal (${response.status}).`},response.status);
    return json(data || {success:false,message:'Respons KV session kosong.'});
  } catch (error) {
    return json({ success:false, message:error?.message || 'KV service session gagal.' }, 502);
  }
}

async function loadEditorPreview(request, env) {
  if (request.method !== 'GET') return json({ success:false, message:'Method not allowed.' }, 405);
  if (!env.KV_BACKEND) return json({ success:false, message:'Binding KV_BACKEND belum tersedia.' }, 503);
  const url = new URL(request.url);
  const previewId = String(url.searchParams.get('preview_id') || '').trim().toLowerCase();
  if (!PREVIEW_ID_RE.test(previewId)) return json({ success:false, message:'Preview ID tidak valid.' }, 400);
  try {
    const response = await env.KV_BACKEND.fetch(`https://4n1f-kv-api.internal/preview/${encodeURIComponent(previewId)}`, {
      method:'GET',
      headers:{accept:'application/json'}
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) return json(data || {success:false,message:`KV preview gagal (${response.status}).`},response.status);
    return json(data || {success:false,message:'Respons KV preview kosong.'});
  } catch (error) {
    return json({ success:false, message:error?.message || 'KV service preview gagal.' }, 502);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/kv-package') return loadPackageDirect(request, env);
    if (url.pathname === '/api/kv-session') return createEditorSession(request, env);
    if (url.pathname === '/api/kv-preview') return loadEditorPreview(request, env);
    return baseWorker.fetch(request, env, ctx);
  }
};
