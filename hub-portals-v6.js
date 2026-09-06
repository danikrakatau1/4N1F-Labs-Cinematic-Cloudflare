(() => {
  'use strict';
  const mount = () => {
    const hubBody = document.querySelector('.hub-body');
    const label = hubBody?.querySelector('.label');
    const input = document.getElementById('sourceInput');
    if (!hubBody || !label || document.querySelector('.hub-gates')) return;

    const gates = document.createElement('div');
    gates.className = 'hub-gates';
    gates.setAttribute('aria-label','4N1F tool entry points');
    gates.innerHTML = `
      <a class="hub-gate hub-gate-fetch" href="/fetch/">
        <span class="hub-gate-copy"><strong>FETCH</strong><small>URL → Source Graph V3 → Native Editor V2.26</small></span>
        <span class="hub-gate-icon" aria-hidden="true">↗</span>
      </a>
      <button class="hub-gate hub-gate-package active" type="button" aria-current="page">
        <span class="hub-gate-copy"><strong>PACKAGE KEY / PREVIEW ID</strong><small>Open package or resume an existing Preview session</small></span>
        <span class="hub-gate-icon" aria-hidden="true">KV</span>
      </button>`;
    hubBody.insertBefore(gates,label);
    gates.querySelector('.hub-gate-package')?.addEventListener('click',()=>input?.focus());
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
