(() => {
  'use strict';
  const LAB_KEY = '4N1F_LAB_BALI01';
  const LAB_PREVIEW_ID = 'p_5a261fd0a07697fb2c7d2a9a053679c3';
  const LAB_ROUTE = `/${LAB_PREVIEW_ID}`;

  const input = document.getElementById('sourceInput');
  const button = document.getElementById('generateBtn');
  const state = document.getElementById('state');
  const stateText = document.getElementById('stateText');
  const resultBox = document.getElementById('resultBox');
  const resultId = document.getElementById('resultId');
  const copyBtn = document.getElementById('copyBtn');
  const openBtn = document.getElementById('openBtn');
  if (!input || !button || !state || !stateText || !resultBox || !resultId) return;

  let active = false;
  const isLabKey = value => String(value || '').trim().toUpperCase() === LAB_KEY;
  const isLabPreview = value => String(value || '').trim().toLowerCase() === LAB_PREVIEW_ID;
  const setState = (message, kind='') => {
    state.className = `state${kind ? ` ${kind}` : ''}`;
    stateText.textContent = message;
  };
  const show = () => {
    active = true;
    input.value = LAB_PREVIEW_ID;
    resultId.textContent = LAB_PREVIEW_ID;
    resultBox.classList.add('show');
    setState(`Experimental preview ready · ${LAB_PREVIEW_ID}`, 'ok');
  };
  const open = () => window.open(LAB_ROUTE, '_blank', 'noopener');

  button.addEventListener('click', event => {
    const value = String(input.value || '').trim();
    if (!isLabKey(value) && !isLabPreview(value)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled = true;
    const previous = button.textContent;
    button.textContent = 'Generating…';
    setState('Preparing isolated Bali Candi Bentar Lab preview…');
    setTimeout(() => {
      show();
      button.disabled = false;
      button.textContent = previous;
      open();
    }, 220);
  }, { capture: true });

  copyBtn?.addEventListener('click', event => {
    if (!active && !isLabPreview(input.value)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigator.clipboard?.writeText(LAB_PREVIEW_ID)
      .then(() => setState('Experimental Preview ID disalin.', 'ok'))
      .catch(() => setState('Browser tidak mengizinkan clipboard.', 'error'));
  }, { capture: true });

  openBtn?.addEventListener('click', event => {
    if (!active && !isLabPreview(input.value)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open();
  }, { capture: true });
})();
