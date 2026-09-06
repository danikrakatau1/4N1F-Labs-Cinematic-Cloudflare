(() => {
  'use strict';

  const input = document.getElementById('previewIdInput');
  const loadButton = document.getElementById('loadPreviewBtn');
  const backButton = document.getElementById('backPreviewBtn');
  const stageStatus = document.getElementById('stageStatus');

  function routedPreviewId() {
    const match = decodeURIComponent(location.pathname).match(/^\/editor\/(p_[a-f0-9]{32})\/?$/i);
    return match ? match[1].toLowerCase() : '';
  }

  function currentPreviewId() {
    const routed = routedPreviewId();
    if (routed) return routed;
    const typed = String(input?.value || '').trim().toLowerCase();
    return /^p_[a-f0-9]{32}$/.test(typed) ? typed : '';
  }

  function syncBackButton() {
    if (!backButton) return;
    const id = currentPreviewId();
    backButton.disabled = !id;
    backButton.title = id ? `Kembali ke ${id}` : 'Preview ID belum tersedia';
  }

  backButton?.addEventListener('click', () => {
    const id = currentPreviewId();
    if (id) location.href = `/${encodeURIComponent(id)}`;
  });

  input?.addEventListener('input', syncBackButton);

  const routeId = routedPreviewId();
  if (!routeId || !input || !loadButton) {
    syncBackButton();
    return;
  }

  input.value = routeId;
  syncBackButton();
  if (stageStatus) stageStatus.textContent = `Auto-loading ${routeId}`;

  requestAnimationFrame(() => {
    setTimeout(() => loadButton.click(), 0);
  });
})();
