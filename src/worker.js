const KV_API = 'https://4n1f-kv-api.faqihanif12282000.workers.dev';

const PREVIEW_PATH = /^\/p_[a-f0-9]{32}\/?$/i;
const EDITOR_PATH = /^\/editor\/p_[a-f0-9]{32}\/?$/i;

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

  const assetRequest = new Request(url.toString(), {
    method: 'GET',
    headers: request.headers
  });
  const response = await env.ASSETS.fetch(assetRequest);
  const headers = new Headers(response.headers);

  if (noindex) {
    headers.set('cache-control', 'no-store');
    headers.set('x-robots-tag', 'noindex, nofollow');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function createPreviewSession(request) {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed.' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: 'Body JSON tidak valid.' }, 400);
  }

  const packageKey = String(body?.package_key || '').trim().toUpperCase();
  if (!/^4N1F_[A-F0-9]{12}$/.test(packageKey)) {
    return json({ success: false, message: 'Format Package Key tidak valid.' }, 400);
  }

  try {
    const response = await fetch(`${KV_API}/session`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({ package_key: packageKey })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return json(
        data || { success: false, message: `KV session gagal (${response.status}).` },
        response.status
      );
    }

    return json(data || { success: false, message: 'Respons KV session kosong.' });
  } catch (error) {
    return json(
      { success: false, message: error?.message || 'Cloudflare KV session bridge gagal.' },
      502
    );
  }
}

async function loadPreview(request) {
  if (request.method !== 'GET') {
    return json({ success: false, message: 'Method not allowed.' }, 405);
  }

  const url = new URL(request.url);
  const previewId = String(url.searchParams.get('preview_id') || '').trim().toLowerCase();
  if (!/^p_[a-f0-9]{32}$/.test(previewId)) {
    return json({ success: false, message: 'Preview ID tidak valid.' }, 400);
  }

  try {
    const response = await fetch(`${KV_API}/preview/${encodeURIComponent(previewId)}`, {
      method: 'GET',
      headers: { accept: 'application/json' }
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return json(
        data || { success: false, message: `KV preview gagal (${response.status}).` },
        response.status
      );
    }

    return json(data || { success: false, message: 'Respons KV preview kosong.' });
  } catch (error) {
    return json(
      { success: false, message: error?.message || 'Cloudflare KV preview bridge gagal.' },
      502
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/kv-session') return createPreviewSession(request);
    if (path === '/api/kv-preview') return loadPreview(request);

    if (PREVIEW_PATH.test(path)) {
      return serveAsset(request, env, '/preview.html', true);
    }

    if (EDITOR_PATH.test(path)) {
      return serveAsset(request, env, '/editor/index.html', true);
    }

    return env.ASSETS.fetch(request);
  }
};
