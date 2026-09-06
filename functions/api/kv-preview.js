const WORKER_URL = 'https://4n1f-kv-api.faqihanif12282000.workers.dev';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const previewId = String(url.searchParams.get('preview_id') || '').trim().toLowerCase();
  if (!/^p_[a-f0-9]{32}$/.test(previewId)) {
    return json({ success: false, message: 'Preview ID tidak valid.' }, 400);
  }

  try {
    const response = await fetch(`${WORKER_URL}/preview/${encodeURIComponent(previewId)}`, {
      method: 'GET',
      headers: { 'accept': 'application/json' }
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return json(data || { success: false, message: `KV preview gagal (${response.status}).` }, response.status);
    }
    return json(data || { success: false, message: 'Respons KV preview kosong.' }, 200);
  } catch (error) {
    return json({ success: false, message: error?.message || 'Cloudflare KV preview bridge gagal.' }, 502);
  }
}

export function onRequest() {
  return json({ success: false, message: 'Method not allowed.' }, 405);
}
