import baseWorker from './worker.js';

const BALI_LAB_KEY = '4N1F_BA11CA1D1A01';
const BALI_LAB_ASSET = '/editor/webgl-lab/bali/index.html';
const PACKAGE_KEY_RE = /^4N1F_[A-F0-9]{12}$/;

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

  // Isolated lab remains preview-only and does not create an editor/session id.
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/kv-package') return loadPackageDirect(request, env);
    return baseWorker.fetch(request, env, ctx);
  }
};
