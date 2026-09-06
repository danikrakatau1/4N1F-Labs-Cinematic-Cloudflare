(() => {
  'use strict';

  const RPC_MARKER = '/rest/v1/rpc/get_lab_preview_source';
  const originalFetch = window.fetch.bind(window);

  function validPreviewId(value) {
    return /^p_[a-f0-9]{32}$/i.test(String(value || '').trim());
  }

  function getUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    return input?.url || '';
  }

  function readPreviewId(init) {
    if (!init?.body) return '';
    try {
      const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      return String(body?.input_preview_id || '').trim().toLowerCase();
    } catch {
      return '';
    }
  }

  async function loadFromKv(previewId) {
    const response = await originalFetch(`/api/kv-preview?preview_id=${encodeURIComponent(previewId)}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store'
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`KV preview gagal (${response.status}).`);

    const data = await response.json().catch(() => null);
    if (!data?.success || !data?.html_code) return null;
    return { ...data, success: true, storage_engine: data.storage_engine || 'cloudflare-kv' };
  }

  window.fetch = async function fourN1FKvFirstFetch(input, init) {
    const url = getUrl(input);
    if (!url.includes(RPC_MARKER)) return originalFetch(input, init);

    const previewId = readPreviewId(init);
    if (!validPreviewId(previewId)) return originalFetch(input, init);

    try {
      const kv = await loadFromKv(previewId);
      if (kv) {
        window.dispatchEvent(new CustomEvent('4n1f:preview-source', {
          detail: { preview_id: previewId, storage_engine: 'cloudflare-kv' }
        }));
        return new Response(JSON.stringify([kv]), {
          status: 200,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store'
          }
        });
      }
    } catch (error) {
      console.warn('[4N1F KV Loader] KV unavailable, fallback to legacy Supabase.', error);
    }

    const legacyResponse = await originalFetch(input, init);
    window.dispatchEvent(new CustomEvent('4n1f:preview-source', {
      detail: { preview_id: previewId, storage_engine: 'supabase-legacy' }
    }));
    return legacyResponse;
  };

  window.__4N1F_KV_LOADER__ = Object.freeze({
    version: '1.3.2',
    mode: 'same-origin-kv-first-legacy-fallback'
  });
})();
