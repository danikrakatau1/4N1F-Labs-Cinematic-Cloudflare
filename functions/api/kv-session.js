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

export async function onRequestPost({ request }) {
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
    const response = await fetch(`${WORKER_URL}/session`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({ package_key: packageKey })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return json(data || { success: false, message: `KV session gagal (${response.status}).` }, response.status);
    }
    return json(data || { success: false, message: 'Respons KV session kosong.' }, 200);
  } catch (error) {
    return json({ success: false, message: error?.message || 'Cloudflare KV session bridge gagal.' }, 502);
  }
}

export function onRequest() {
  return json({ success: false, message: 'Method not allowed.' }, 405);
}
