(() => {
  'use strict';

  if (window.StatusMotion) return;

  // Preview Key resilience guard: the Hub's editor-session creation awaits
  // /api/kv-session. If the upstream KV bridge stalls, fail cleanly so the
  // existing Hub catch/finally path restores the UI.
  if (!window.__4n1fPreviewSessionFetchGuard) {
    const nativeFetch = window.fetch.bind(window);
    window.__4n1fPreviewSessionFetchGuard = true;
    window.fetch = async function guarded4N1FFetch(input, init) {
      let url;
      try {
        const raw = typeof input === 'string' || input instanceof URL ? String(input) : String(input?.url || '');
        url = new URL(raw, location.href);
      } catch {
        return nativeFetch(input, init);
      }
      const isPreviewSession = url.origin === location.origin && url.pathname === '/api/kv-session';
      if (!isPreviewSession || init?.signal) return nativeFetch(input, init);

      let lastError;
      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6500);
        try {
          const response = await nativeFetch(input, { ...(init || {}), signal: controller.signal });
          clearTimeout(timer);
          if (attempt === 0 && response.status >= 500) {
            await new Promise(resolve => setTimeout(resolve, 260));
            continue;
          }
          return response;
        } catch (error) {
          clearTimeout(timer);
          lastError = error;
          if (attempt === 0) {
            await new Promise(resolve => setTimeout(resolve, 260));
            continue;
          }
        }
      }
      const timedOut = lastError?.name === 'AbortError';
      throw new Error(timedOut
        ? 'Preview session timeout. Bridge KV tidak merespons; silakan Generate lagi.'
        : (lastError?.message || 'Preview session bridge gagal. Silakan Generate lagi.'));
    };
  }

  const ACTIONS = {
    'home-preview': { title:'Generate Preview', glyph:'▣' },
    fetch: { title:'Fetch Source', glyph:'↗' },
    analyze: { title:'Analyze Source', glyph:'⌁' },
    rebuild: { title:'Generate Rebuild', glyph:'◇' },
    preview: { title:'Open Preview', glyph:'◉' }
  };
  const pending = new Set();
  const bound = new Map();
  let hideTimer = 0;

  const svg = `
    <svg class="sm-svg" viewBox="0 0 48 48" aria-hidden="true">
      <circle class="sm-ring" cx="24" cy="24" r="18"></circle>
      <circle class="sm-orbit" cx="24" cy="24" r="18"></circle>
      <path class="sm-check" d="M15.5 24.5 21.5 30.5 33.5 18"></path>
      <path class="sm-cross-a" d="M17.5 17.5 30.5 30.5"></path>
      <path class="sm-cross-b" d="M30.5 17.5 17.5 30.5"></path>
    </svg>`;

  function iconHTML(action, state='idle') {
    const glyph = ACTIONS[action]?.glyph || '•';
    return `<span class="sm-icon" data-state="${state}">${svg}<span class="sm-glyph">${glyph}</span></span>`;
  }

  function host() {
    let el = document.querySelector('.sm-status-host');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'sm-status-host';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    el.innerHTML = `<div class="sm-host-icon"></div><div class="sm-copy"><strong>4N1F Status</strong><small>Ready.</small></div>`;
    document.body.appendChild(el);
    return el;
  }

  function bind(el, action) {
    if (!el || bound.has(el)) return;
    el.classList.add('sm-bound');
    el.dataset.smAction = action;
    const wrap = document.createElement('span');
    wrap.className = 'sm-button-icon';
    wrap.dataset.state = 'idle';
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML = iconHTML(action, 'idle');
    el.appendChild(wrap);
    bound.set(el, { action, wrap });
  }

  function setBoundState(action, state) {
    for (const [el, info] of bound) {
      if (info.action !== action) continue;
      el.dataset.smState = state;
      info.wrap.dataset.state = state;
      const icon = info.wrap.querySelector('.sm-icon');
      if (icon) icon.dataset.state = state;
      if (state === 'success' || state === 'error') {
        setTimeout(() => {
          if (el.dataset.smState === state) {
            el.dataset.smState = 'idle';
            info.wrap.dataset.state = 'idle';
            if (icon) icon.dataset.state = 'idle';
          }
        }, state === 'success' ? 2600 : 3600);
      }
    }
  }

  function present(action, state, message) {
    const el = host();
    clearTimeout(hideTimer);
    el.dataset.state = state;
    el.dataset.action = action;
    el.querySelector('.sm-host-icon').innerHTML = iconHTML(action, state);
    el.querySelector('.sm-copy strong').textContent = ACTIONS[action]?.title || '4N1F Status';
    el.querySelector('.sm-copy small').textContent = message || (state === 'success' ? 'Selesai.' : state === 'error' ? 'Operasi gagal.' : 'Memproses…');
    requestAnimationFrame(() => el.classList.add('show'));
    if (state !== 'loading') {
      hideTimer = setTimeout(() => el.classList.remove('show'), state === 'success' ? 3400 : 4800);
    }
    setBoundState(action, state);
  }

  function begin(action, message) {
    pending.add(action);
    present(action, 'loading', message);
  }
  function success(action, message, force=false) {
    if (!force && !pending.has(action)) return;
    pending.delete(action);
    present(action, 'success', message);
  }
  function error(action, message, force=false) {
    if (!force && !pending.has(action)) return;
    pending.delete(action);
    present(action, 'error', message);
  }

  const positive = text => /\b(berhasil|selesai|complete|completed|ready|fetched|generated|tersedia|dibuat|valid|success)\b/i.test(text || '');
  const negative = text => /(gagal|error|failed|invalid|tidak valid|ditolak|blocked|unsupported|tidak tersedia|timeout)/i.test(text || '');

  function observe(el, callback) {
    if (!el) return;
    const run = () => callback((el.textContent || '').trim(), el);
    new MutationObserver(run).observe(el, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['class','aria-disabled'] });
  }

  function autoHub() {
    const button = document.getElementById('generateBtn');
    const state = document.getElementById('state');
    const stateText = document.getElementById('stateText');
    const input = document.getElementById('sourceInput');
    const resultBox = document.getElementById('resultBox');
    const resultId = document.getElementById('resultId');
    const copyBtn = document.getElementById('copyBtn');
    const openBtn = document.getElementById('openBtn');
    if (!button || !state || !stateText || !input) return;

    const setHubState = (message, kind='') => {
      state.className = `state${kind ? ` ${kind}` : ''}`;
      stateText.textContent = message;
    };
    const validPackage = value => /^4N1F_[A-F0-9]{12}$/i.test(String(value || '').trim());
    const validPreview = value => /^p_[a-f0-9]{32}$/i.test(String(value || '').trim());
    let currentRef = '';
    let currentUrl = '';

    const packagePreviewUrl = key => `/editor/package-preview.html?package_key=${encodeURIComponent(String(key).toUpperCase())}`;
    const editorUrl = previewId => `/editor/${encodeURIComponent(String(previewId).toLowerCase())}`;
    const showHubResult = (ref, url) => {
      currentRef = ref;
      currentUrl = url;
      if (resultId) resultId.textContent = ref;
      resultBox?.classList.add('show');
    };
    const clearHubResult = () => {
      currentRef = '';
      currentUrl = '';
      if (resultId) resultId.textContent = '';
      resultBox?.classList.remove('show');
    };
    const openTarget = url => {
      const popup = window.open(url, '_blank', 'noopener,noreferrer');
      if (!popup) {
        error('home-preview', 'Browser memblokir tab baru. Izinkan pop-up lalu tekan Open Preview lagi.', true);
      }
    };
    const readJson = async response => {
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.message || `Request gagal (${response.status}).`);
      return data;
    };
    const verifyPackage = async key => {
      const response = await fetch(`/api/kv-package?package_key=${encodeURIComponent(key)}`, {
        headers:{ accept:'application/json' }, cache:'no-store'
      });
      return readJson(response);
    };
    const verifyEditableSession = async id => {
      const response = await fetch(`/api/kv-preview?preview_id=${encodeURIComponent(id)}`, {
        headers:{ accept:'application/json' }, cache:'no-store'
      });
      return readJson(response);
    };

    bind(button, 'home-preview');
    button.addEventListener('click', async event => {
      if (button.disabled) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      const value = String(input.value || '').trim();
      clearHubResult();
      button.disabled = true;
      button.setAttribute('aria-busy','true');

      try {
        if (validPackage(value)) {
          const key = value.toUpperCase();
          begin('home-preview', `Memvalidasi Preview Key · ${key}…`);
          await verifyPackage(key);
          const url = packagePreviewUrl(key);
          showHubResult(key, url);
          setHubState(`Preview-only · ${key}`, 'ok');
          success('home-preview', `Berhasil · Preview ${key} siap dibuka.`);
          return;
        }

        if (validPreview(value)) {
          const id = value.toLowerCase();
          begin('home-preview', `Memvalidasi editable session · ${id}…`);
          await verifyEditableSession(id);
          const url = editorUrl(id);
          showHubResult(id, url);
          setHubState(`Editable session · ${id}`, 'ok');
          success('home-preview', `Berhasil · Live Editor ${id} siap dibuka.`);
          return;
        }

        setHubState('Format harus 4N1F_XXXXXXXXXXXX atau Preview ID p_ + 32 hex.', 'error');
        error('home-preview', 'Gagal · Preview Key / Preview ID tidak valid.', true);
        input.focus();
      } catch (err) {
        const message = err?.message || 'Preview tidak dapat divalidasi.';
        setHubState(`Gagal · ${message}`, 'error');
        error('home-preview', `Gagal · ${message}`, true);
      } finally {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    }, { capture:true });

    copyBtn?.addEventListener('click', async event => {
      if (!currentRef) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        await navigator.clipboard.writeText(currentRef);
        setHubState(`${validPackage(currentRef) ? 'Preview Key' : 'Preview ID'} disalin.`, 'ok');
      } catch {
        setHubState('Browser tidak mengizinkan clipboard.', 'error');
      }
    }, { capture:true });

    openBtn?.addEventListener('click', event => {
      if (!currentUrl) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openTarget(currentUrl);
    }, { capture:true });

    observe(state, () => {
      if (!pending.has('home-preview')) return;
      const text = stateText.textContent || '';
      if (state.classList.contains('error') || negative(text)) error('home-preview', text || 'Generate Preview gagal.');
      else if (state.classList.contains('ok')) success('home-preview', text || 'Preview siap.');
    });
  }

  function autoFetchStudio() {
    const fetchBtn = document.getElementById('fetchSourceBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const buildBtn = document.getElementById('buildBtn');
    const previewBtn = document.getElementById('previewBtn');
    if (!fetchBtn && !analyzeBtn && !buildBtn && !previewBtn) return;

    bind(fetchBtn, 'fetch');
    bind(analyzeBtn, 'analyze');
    bind(buildBtn, 'rebuild');
    bind(previewBtn, 'preview');

    fetchBtn?.addEventListener('click', () => {
      if (fetchBtn.disabled) return;
      begin('fetch', 'Mengambil source melalui secure Cloudflare bridge…');
    }, { capture:true });
    analyzeBtn?.addEventListener('click', () => {
      if (analyzeBtn.disabled) return;
      begin('analyze', 'Source Graph V3 sedang memetakan struktur dan dependency…');
    }, { capture:true });
    buildBtn?.addEventListener('click', () => {
      if (buildBtn.disabled) return;
      begin('rebuild', 'Menyusun source-native rebuild package…');
    }, { capture:true });

    previewBtn?.addEventListener('click', (event) => {
      const disabled = previewBtn.classList.contains('disabled') || previewBtn.getAttribute('aria-disabled') === 'true';
      if (disabled) {
        event.preventDefault();
        error('preview', 'Preview belum tersedia. Generate rebuild terlebih dahulu.', true);
        return;
      }
      const href = previewBtn.getAttribute('href');
      if (!href) {
        event.preventDefault();
        error('preview', 'Route preview tidak tersedia.', true);
        return;
      }
      event.preventDefault();
      begin('preview', 'Membuka source-native preview…');
      setTimeout(() => success('preview', 'Preview siap. Membuka portal…'), 260);
      setTimeout(() => { window.location.href = href; }, 620);
    }, { capture:true });

    const sourceBadge = document.getElementById('sourceBadge');
    const fetchMeta = document.getElementById('fetchMeta');
    const analysisStatus = document.getElementById('analysisStatus');
    const mappingBadge = document.getElementById('mappingBadge');
    const studioMessage = document.getElementById('studioMessage');

    const settleFetch = (text, el) => {
      if (!pending.has('fetch')) return;
      if (el?.classList.contains('bad') || el?.classList.contains('error') || negative(text)) error('fetch', text || 'Fetch Source gagal.');
      else if (el?.classList.contains('ok') || positive(text)) success('fetch', text || 'Source berhasil diambil.');
    };
    observe(sourceBadge, settleFetch);
    observe(fetchMeta, settleFetch);

    observe(analysisStatus, (text, el) => {
      if (!pending.has('analyze')) return;
      if (el.classList.contains('bad') || el.classList.contains('error') || negative(text)) error('analyze', text || 'Analyze Source gagal.');
      else if (el.classList.contains('ok') || positive(text)) success('analyze', text || 'Analysis selesai.');
    });

    observe(mappingBadge, (text, el) => {
      if (!pending.has('rebuild')) return;
      if (el.classList.contains('bad') || el.classList.contains('error') || negative(text)) error('rebuild', text || 'Generate Rebuild gagal.');
      else if (el.classList.contains('ok') || positive(text)) success('rebuild', text || 'Rebuild berhasil dibuat.');
    });

    observe(studioMessage, text => {
      if (!text || !negative(text)) return;
      if (pending.has('rebuild')) error('rebuild', text);
      else if (pending.has('analyze')) error('analyze', text);
      else if (pending.has('fetch')) error('fetch', text);
    });
  }

  window.StatusMotion = { bind, begin, success, error, pending };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { autoHub(); autoFetchStudio(); }, { once:true });
  else { autoHub(); autoFetchStudio(); }
})();