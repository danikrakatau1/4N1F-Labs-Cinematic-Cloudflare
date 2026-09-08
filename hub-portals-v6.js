(() => {
  'use strict';

  const EXP_STYLE_ID = 'hub-expandable-tabs-borderbeam-exp-v1';

  const EXP_CSS = `
/* 4N1F EXPERIMENT — ExpandableTabs + BorderBeam native port.
   Prototype only. Existing IDs, routing, KV, Fetch and editor semantics stay intact. */
@property --exp-beam-angle{syntax:"<angle>";inherits:false;initial-value:0deg}

.hub.exp-tabs-beam{
  --exp-violet:150,104,255;
  --exp-cyan:104,220,255;
  --exp-mint:156,232,194;
  --exp-rose:255,143,164;
  --exp-ease:cubic-bezier(.16,1,.3,1);
}

.hub.exp-tabs-beam .hub-body{
  padding:15px 18px 15px!important;
}

.hub.exp-tabs-beam .hub-gates{
  display:flex!important;
  grid-template-columns:none!important;
  width:max-content!important;
  max-width:100%!important;
  align-items:center!important;
  justify-content:center!important;
  gap:4px!important;
  margin:0 auto 15px!important;
  padding:4px!important;
  border:1px solid rgba(255,255,255,.075)!important;
  border-radius:19px!important;
  background:linear-gradient(180deg,rgba(9,12,20,.76),rgba(3,6,12,.64))!important;
  box-shadow:inset 0 1px rgba(255,255,255,.035),0 10px 28px rgba(0,0,0,.18)!important;
  backdrop-filter:blur(16px) saturate(112%);
  -webkit-backdrop-filter:blur(16px) saturate(112%);
}

.hub.exp-tabs-beam .hub-gate{
  position:relative!important;
  isolation:isolate!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:0!important;
  min-height:42px!important;
  height:42px!important;
  width:42px!important;
  padding:0!important;
  border:0!important;
  border-radius:15px!important;
  background:transparent!important;
  box-shadow:none!important;
  overflow:visible!important;
  color:#82909f!important;
  text-decoration:none!important;
  transition:
    width .46s var(--exp-ease),
    transform .2s var(--exp-ease),
    color .24s ease,
    background .28s ease,
    box-shadow .28s ease!important;
}

.hub.exp-tabs-beam .hub-gate::after{
  content:""!important;
  position:absolute!important;
  inset:0!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  height:auto!important;
  z-index:-2!important;
  border-radius:15px!important;
  background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.014))!important;
  box-shadow:inset 0 1px rgba(255,255,255,.025)!important;
  opacity:0!important;
  transition:opacity .24s ease!important;
}

.hub.exp-tabs-beam .hub-gate-package{
  width:224px!important;
  justify-content:flex-start!important;
  gap:8px!important;
  padding:0 13px!important;
  color:#edf6fb!important;
  background:linear-gradient(180deg,rgba(255,255,255,.058),rgba(255,255,255,.028))!important;
  box-shadow:inset 0 1px rgba(255,255,255,.055),0 2px 8px rgba(0,0,0,.18)!important;
}

.hub.exp-tabs-beam .hub-gate-package::after{opacity:1!important}

.hub.exp-tabs-beam .hub-gate-package::before{
  display:block!important;
  content:""!important;
  position:absolute!important;
  inset:-1px!important;
  z-index:-1!important;
  pointer-events:none!important;
  padding:1px!important;
  border-radius:16px!important;
  opacity:.36!important;
  background:conic-gradient(
    from var(--exp-beam-angle),
    transparent 0deg,
    transparent 258deg,
    rgba(var(--exp-violet),.18) 278deg,
    rgba(var(--exp-cyan),.74) 308deg,
    rgba(var(--exp-mint),.84) 332deg,
    rgba(255,255,255,.40) 346deg,
    transparent 360deg
  )!important;
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)!important;
  -webkit-mask-composite:xor!important;
  mask-composite:exclude!important;
  animation:expBorderBeam 7.6s linear infinite!important;
  filter:drop-shadow(0 0 5px rgba(var(--exp-cyan),.10));
  transition:opacity .24s ease,filter .24s ease!important;
}

.hub.exp-tabs-beam .hub-gate-fetch:hover,
.hub.exp-tabs-beam .hub-gate-fetch:focus-visible{
  width:92px!important;
  color:#dce9f1!important;
  background:rgba(255,255,255,.035)!important;
}

.hub.exp-tabs-beam .exp-tab-icon{
  display:grid;
  place-items:center;
  flex:0 0 24px;
  width:24px;
  height:24px;
  border:1px solid rgba(255,255,255,.075);
  border-radius:9px;
  background:rgba(0,0,0,.16);
  color:#8da2b1;
  font:660 9px/1 var(--mono);
  letter-spacing:.02em;
  box-shadow:inset 0 1px rgba(255,255,255,.025);
  transition:color .24s ease,border-color .24s ease,background .24s ease,box-shadow .24s ease,transform .2s var(--exp-ease);
}

.hub.exp-tabs-beam .hub-gate-package .exp-tab-icon{
  color:#aef0cf;
  border-color:rgba(var(--exp-mint),.15);
  background:rgba(var(--exp-mint),.035);
  box-shadow:0 0 14px rgba(var(--exp-mint),.045),inset 0 1px rgba(255,255,255,.03);
}

.hub.exp-tabs-beam .exp-tab-label{
  display:block;
  min-width:0;
  overflow:hidden;
  white-space:nowrap;
  color:inherit;
  font:620 10.5px/1 var(--sans);
  letter-spacing:.008em;
  opacity:0;
  max-width:0;
  transform:translateX(-4px);
  filter:blur(2px);
  transition:max-width .42s var(--exp-ease),opacity .2s ease,transform .34s var(--exp-ease),filter .2s ease;
}

.hub.exp-tabs-beam .hub-gate-package .exp-tab-label,
.hub.exp-tabs-beam .hub-gate-fetch:hover .exp-tab-label,
.hub.exp-tabs-beam .hub-gate-fetch:focus-visible .exp-tab-label{
  max-width:150px;
  opacity:1;
  transform:translateX(0);
  filter:blur(0);
  margin-left:7px;
}

.hub.exp-tabs-beam .hub-gate-package .exp-tab-label{
  color:#dfe9ee;
  flex:1;
}

.hub.exp-tabs-beam .exp-tab-chevron{
  display:grid;
  place-items:center;
  width:18px;
  height:18px;
  flex:0 0 18px;
  color:#748493;
  font:700 12px/1 var(--sans);
  transform:rotate(0deg);
  transition:transform .34s var(--exp-ease),color .2s ease;
}

.hub.exp-tabs-beam[data-exp-open="false"] .exp-tab-chevron{transform:rotate(-90deg)}
.hub.exp-tabs-beam[data-exp-open="false"] .hub-gate-package{width:174px!important;color:#c9d4dc!important}

.hub.exp-tabs-beam .exp-panel-shell{
  display:grid;
  grid-template-rows:1fr;
  opacity:1;
  transform:translateY(0) scale(1);
  transform-origin:50% 0;
  transition:grid-template-rows .48s var(--exp-ease),opacity .28s ease,transform .48s var(--exp-ease);
}

.hub.exp-tabs-beam .exp-panel-inner{
  min-height:0;
  overflow:hidden;
}

.hub.exp-tabs-beam[data-exp-open="false"] .exp-panel-shell{
  grid-template-rows:0fr;
  opacity:0;
  transform:translateY(-6px) scale(.985);
  pointer-events:none;
}

.hub.exp-tabs-beam .label{
  margin-top:2px!important;
}

.hub.exp-tabs-beam .row{
  position:relative!important;
}

/* BorderBeam wakes up with interaction instead of becoming a permanent neon ring. */
body:has(.hub.exp-tabs-beam #sourceInput:focus) .hub.exp-tabs-beam .hub-gate-package::before,
body:has(.hub.exp-tabs-beam #generateBtn:hover) .hub.exp-tabs-beam .hub-gate-package::before{
  opacity:.82!important;
  animation-duration:3.4s!important;
  filter:drop-shadow(0 0 8px rgba(var(--exp-cyan),.18))!important;
}

body:has(.hub.exp-tabs-beam #sourceInput:focus) .hub.exp-tabs-beam .hub-gate-package{
  box-shadow:inset 0 1px rgba(255,255,255,.07),0 5px 18px rgba(0,0,0,.16),0 0 24px rgba(var(--exp-cyan),.035)!important;
}

body:has(.hub.exp-tabs-beam #generateBtn[aria-busy="true"]) .hub.exp-tabs-beam .hub-gate-package::before{
  opacity:1!important;
  animation-duration:1.35s!important;
  filter:drop-shadow(0 0 10px rgba(var(--exp-cyan),.23)) drop-shadow(0 0 14px rgba(var(--exp-violet),.10))!important;
}

.hub.exp-tabs-beam.exp-success .hub-gate-package::before{
  opacity:1!important;
  animation:expSuccessBeam .78s var(--exp-ease) 1 both!important;
  background:conic-gradient(from var(--exp-beam-angle),transparent 0deg,transparent 244deg,rgba(var(--exp-cyan),.12) 270deg,rgba(var(--exp-mint),.95) 314deg,rgba(255,255,255,.56) 338deg,transparent 360deg)!important;
}

.hub.exp-tabs-beam.exp-error .hub-gate-package::before{
  opacity:1!important;
  animation:expErrorBeam .62s ease-out 1 both!important;
  background:conic-gradient(from var(--exp-beam-angle),transparent 0deg,transparent 252deg,rgba(var(--exp-violet),.16) 280deg,rgba(var(--exp-rose),.88) 320deg,rgba(255,220,226,.48) 340deg,transparent 360deg)!important;
}

.hub.exp-tabs-beam.exp-ignite .hub-gate-package{
  animation:expTabIgnite .82s var(--exp-ease) both;
}

.hub.exp-tabs-beam.exp-ignite .hub-gate-package::before{
  opacity:1!important;
  animation:expIgniteBeam .88s var(--exp-ease) 1 both!important;
}

@keyframes expBorderBeam{to{--exp-beam-angle:360deg}}
@keyframes expIgniteBeam{
  0%{--exp-beam-angle:205deg;opacity:0;filter:brightness(.8)}
  38%{opacity:1;filter:brightness(1.35)}
  100%{--exp-beam-angle:565deg;opacity:.36;filter:brightness(1)}
}
@keyframes expSuccessBeam{
  0%{--exp-beam-angle:180deg;opacity:.15;filter:brightness(.9)}
  48%{opacity:1;filter:brightness(1.38)}
  100%{--exp-beam-angle:540deg;opacity:.32;filter:brightness(1)}
}
@keyframes expErrorBeam{
  0%{--exp-beam-angle:190deg;opacity:.15}
  44%{opacity:1;filter:brightness(1.25)}
  100%{--exp-beam-angle:500deg;opacity:.28;filter:brightness(1)}
}
@keyframes expTabIgnite{
  0%{transform:scale(.985);filter:brightness(.86)}
  58%{transform:scale(1.008);filter:brightness(1.10)}
  100%{transform:scale(1);filter:brightness(1)}
}

@media(max-width:620px){
  .hub.exp-tabs-beam .hub-body{padding:13px!important}
  .hub.exp-tabs-beam .hub-gates{width:100%!important;margin-bottom:13px!important}
  .hub.exp-tabs-beam .hub-gate-fetch{flex:0 0 42px!important}
  .hub.exp-tabs-beam .hub-gate-fetch:hover,.hub.exp-tabs-beam .hub-gate-fetch:focus-visible{width:42px!important}
  .hub.exp-tabs-beam .hub-gate-fetch .exp-tab-label{display:none!important}
  .hub.exp-tabs-beam .hub-gate-package{width:auto!important;flex:1 1 auto!important;min-width:0!important}
  .hub.exp-tabs-beam[data-exp-open="false"] .hub-gate-package{width:auto!important}
  .hub.exp-tabs-beam .hub-gate-package .exp-tab-label{font-size:10px!important}
}

@media(prefers-reduced-motion:reduce){
  .hub.exp-tabs-beam .hub-gate,
  .hub.exp-tabs-beam .exp-tab-label,
  .hub.exp-tabs-beam .exp-tab-chevron,
  .hub.exp-tabs-beam .exp-panel-shell,
  .hub.exp-tabs-beam .exp-tab-icon{transition:none!important}
  .hub.exp-tabs-beam .hub-gate-package,
  .hub.exp-tabs-beam .hub-gate-package::before{animation:none!important}
  .hub.exp-tabs-beam .hub-gate-package::before{opacity:.42!important}
}
`;

  function installStyle() {
    if (document.getElementById(EXP_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = EXP_STYLE_ID;
    style.textContent = EXP_CSS;
    document.head.appendChild(style);
  }

  function mountBaseGates() {
    const hubBody = document.querySelector('.hub-body');
    const label = hubBody?.querySelector('.label');
    const input = document.getElementById('sourceInput');
    if (!hubBody || !label) return null;

    let gates = hubBody.querySelector('.hub-gates');
    if (!gates) {
      gates = document.createElement('div');
      gates.className = 'hub-gates';
      gates.setAttribute('aria-label', '4N1F tool entry points');
      gates.innerHTML = `
        <a class="hub-gate hub-gate-fetch" href="/fetch/">
          <span class="hub-gate-copy"><strong>FETCH</strong><small>URL → Source Graph V3 → Native Editor V2.26</small></span>
          <span class="hub-gate-icon" aria-hidden="true">↗</span>
        </a>
        <button class="hub-gate hub-gate-package active" type="button" aria-current="page">
          <span class="hub-gate-copy"><strong>PREVIEW KEY / EDITOR SESSION</strong><small>4N1F_ opens preview-only · p_ opens Live Editor</small></span>
          <span class="hub-gate-icon" aria-hidden="true">KV</span>
        </button>`;
      hubBody.insertBefore(gates, label);
      gates.querySelector('.hub-gate-package')?.addEventListener('click', () => input?.focus());
    }
    return gates;
  }

  function mountExperiment() {
    const hub = document.querySelector('.hub');
    const hubBody = hub?.querySelector('.hub-body');
    const gates = mountBaseGates();
    const input = document.getElementById('sourceInput');
    const state = document.getElementById('state');
    const label = hubBody?.querySelector('.label');
    const row = hubBody?.querySelector('.row');
    const result = hubBody?.querySelector('.result');
    if (!hub || !hubBody || !gates || !input || !label || !row || !result || hub.classList.contains('exp-tabs-beam')) return;

    installStyle();
    hub.classList.add('exp-tabs-beam', 'exp-ignite');
    hub.dataset.expOpen = 'true';

    const fetchGate = gates.querySelector('.hub-gate-fetch');
    const previewGate = gates.querySelector('.hub-gate-package');
    if (!fetchGate || !previewGate) return;

    fetchGate.setAttribute('aria-label', 'Fetch — URL ke Source Graph V3 ke Native Editor V2.26');
    fetchGate.setAttribute('title', 'Fetch');
    fetchGate.innerHTML = '<span class="exp-tab-icon" aria-hidden="true">↗</span><span class="exp-tab-label">FETCH</span>';

    previewGate.removeAttribute('onclick');
    previewGate.setAttribute('aria-label', 'Preview Key / Editor Session — 4N1F preview-only, p_ editable');
    previewGate.setAttribute('aria-expanded', 'true');
    previewGate.setAttribute('aria-controls', 'expPreviewPanel');
    previewGate.innerHTML = '<span class="exp-tab-icon" aria-hidden="true">KV</span><span class="exp-tab-label">PREVIEW / EDITOR</span><span class="exp-tab-chevron" aria-hidden="true">⌄</span>';

    const shell = document.createElement('div');
    shell.className = 'exp-panel-shell';
    shell.id = 'expPreviewPanel';
    const inner = document.createElement('div');
    inner.className = 'exp-panel-inner';
    shell.appendChild(inner);
    inner.append(label, row, result);
    gates.insertAdjacentElement('afterend', shell);

    const setOpen = (open, focus = false) => {
      hub.dataset.expOpen = open ? 'true' : 'false';
      previewGate.setAttribute('aria-expanded', String(open));
      if (open && focus) window.setTimeout(() => input.focus(), 120);
    };

    previewGate.addEventListener('click', () => {
      const isOpen = hub.dataset.expOpen !== 'false';
      setOpen(!isOpen, isOpen ? false : true);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && hub.dataset.expOpen !== 'false') setOpen(false, false);
    });

    const replayState = (kind) => {
      const className = kind === 'success' ? 'exp-success' : 'exp-error';
      hub.classList.remove('exp-success', 'exp-error');
      void hub.offsetWidth;
      hub.classList.add(className);
      window.setTimeout(() => hub.classList.remove(className), kind === 'success' ? 900 : 760);
    };

    if (state) {
      let lastKind = '';
      const watchState = () => {
        const nextKind = state.classList.contains('error') ? 'error' : state.classList.contains('ok') ? 'success' : '';
        if (nextKind && nextKind !== lastKind) replayState(nextKind);
        lastKind = nextKind;
      };
      new MutationObserver(watchState).observe(state, { attributes: true, attributeFilter: ['class'] });
    }

    window.setTimeout(() => hub.classList.remove('exp-ignite'), 980);
  }

  const start = () => {
    mountBaseGates();
    mountExperiment();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
