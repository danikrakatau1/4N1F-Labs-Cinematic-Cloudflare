(()=>{
  'use strict';
  const presets={
    quick:['fetch','xray','dna'],
    deep:['fetch','xray','dna','components','responsive','assets','behavior','routes'],
    twin:['fetch','xray','dna','components','responsive','assets','behavior','routes','diff','twin']
  };
  const labels={fetch:'Fetch Engine',xray:'Source X-Ray',dna:'Design DNA',components:'Components',responsive:'Responsive DNA',assets:'Asset Intelligence',behavior:'Behavior Map',routes:'Route Graph',diff:'Visual Diff',twin:'Twin Mode'};
  const modules=[...document.querySelectorAll('.module')],presetButtons=[...document.querySelectorAll('.preset')],count=document.getElementById('moduleCount'),presetLabel=document.getElementById('presetLabel'),depthScore=document.getElementById('depthScore'),depthFill=document.getElementById('depthFill'),stack=document.getElementById('stackList'),plan=document.getElementById('planOutput'),target=document.getElementById('targetUrl'),planBtn=document.getElementById('planBtn');
  let activePreset='quick';
  const enabled=()=>modules.filter(m=>m.classList.contains('enabled')).map(m=>m.dataset.module);
  function render(){
    const list=enabled();
    const pct=Math.round(list.length/modules.length*100);
    count.textContent=`${list.length} / ${modules.length} selected`;
    depthScore.textContent=`${pct}%`;depthFill.style.width=`${pct}%`;
    stack.innerHTML=list.map((id,i)=>`<div class="stack-item"><span>${String(i+1).padStart(2,'0')} · ${labels[id]}</span><code>${id==='fetch'?'CORE':'MODULE'}</code></div>`).join('');
    presetLabel.textContent=`${activePreset.toUpperCase()} GENOME`;
  }
  function applyPreset(name){activePreset=name;presetButtons.forEach(b=>b.classList.toggle('active',b.dataset.preset===name));modules.forEach(m=>m.classList.toggle('enabled',presets[name].includes(m.dataset.module)));plan.textContent=`${name.toUpperCase()} pipeline staged · ${presets[name].map(id=>labels[id]).join(' → ')}`;render()}
  presetButtons.forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset)));
  modules.forEach(m=>m.addEventListener('click',()=>{if(m.dataset.module==='fetch')return;m.classList.toggle('enabled');activePreset='custom';presetButtons.forEach(b=>b.classList.remove('active'));plan.textContent='CUSTOM pipeline staged · shell only, no network request.';render()}));
  planBtn.addEventListener('click',()=>{const host=String(target.value||'').trim()||'website-authorized.com';plan.textContent=`PLAN READY · ${host} · ${enabled().map(id=>labels[id]).join(' → ')} · execution disabled in Shell V1.`});
  target.addEventListener('keydown',e=>{if(e.key==='Enter')planBtn.click()});

  /* 4N1F Genome Motion V2 — visual only, no network/core mutation. */
  const motion=document.createElement('style');
  motion.dataset.genomeMotion='v2';
  motion.textContent=`
    :root{--gx:50%;--gy:20%;--gx2:20%;--gy2:65%;--rainbow-speed:12s}
    body::before,body::after{content:"";position:fixed;inset:-24%;pointer-events:none;z-index:0;mix-blend-mode:screen;will-change:transform,filter,opacity}
    body::before{background:conic-gradient(from 165deg at var(--gx) var(--gy),transparent 0 9%,rgba(151,91,255,.18) 15%,rgba(80,185,255,.22) 23%,rgba(63,255,207,.18) 31%,transparent 42% 58%,rgba(255,91,176,.15) 66%,rgba(255,188,88,.12) 74%,transparent 88%);filter:blur(70px) saturate(165%);opacity:.58;animation:genomeSpectrumOrbit 18s cubic-bezier(.45,.05,.55,.95) infinite}
    body::after{background:radial-gradient(28% 24% at 18% 35%,rgba(139,92,246,.28),transparent 72%),radial-gradient(30% 26% at 78% 38%,rgba(34,211,238,.25),transparent 72%),radial-gradient(24% 22% at 62% 78%,rgba(52,211,153,.19),transparent 74%),radial-gradient(22% 20% at 40% 76%,rgba(244,114,182,.16),transparent 74%);filter:blur(85px) saturate(170%);opacity:.50;animation:genomeAuroraMorph 13s ease-in-out infinite alternate}
    .genome-page{position:relative;z-index:2}
    .genome-page::before{content:"";position:fixed;left:-15vw;top:11vh;width:130vw;height:18vh;pointer-events:none;z-index:-1;background:linear-gradient(90deg,transparent 0%,rgba(139,92,246,.06) 15%,rgba(59,130,246,.10) 34%,rgba(34,211,238,.11) 48%,rgba(52,211,153,.09) 61%,rgba(244,114,182,.07) 78%,transparent 100%);filter:blur(28px);transform:rotate(-7deg) translate3d(-10%,0,0);animation:genomeRibbonDrift 15s ease-in-out infinite alternate}
    .hero h1{background:linear-gradient(105deg,#fff 2%,#eef7ff 17%,#b9b5ff 32%,#81e6ff 48%,#a7f3d0 63%,#f9a8d4 78%,#fff 94%)!important;background-size:260% 100%!important;-webkit-background-clip:text!important;background-clip:text!important;color:transparent!important;animation:genomeTitleSpectrum 9s ease-in-out infinite}
    .kicker span{background:linear-gradient(90deg,#8b5cf6,#22d3ee,#34d399,#f472b6)!important;background-size:240% 100%!important;animation:genomeGradientRun 5s linear infinite}
    .workspace{animation:genomeGlassBreath 7.5s ease-in-out infinite!important}
    .workspace::before{background-size:180% 180%!important;animation:genomeGlassCaustic 11s ease-in-out infinite alternate!important}
    .tool-nav a.active{animation:genomeActiveTab 5.5s ease-in-out infinite!important}
    .tool-nav a.active .tool-icon{border-color:rgba(128,225,255,.34)!important;color:#b9f5ff!important;box-shadow:0 0 18px rgba(34,211,238,.10),inset 0 0 14px rgba(139,92,246,.08);animation:genomeIconHue 6s linear infinite}
    .hero-status,.shell-tag{animation:genomeStatusGlow 6s ease-in-out infinite}
    .pulse,.module.enabled::after,.genome-footer i{animation:genomePulseDot 2.4s ease-in-out infinite!important}
    .preset.active{animation:genomePresetGlow 4.8s ease-in-out infinite!important}
    .module.enabled{animation:genomeModuleGlow 6.2s ease-in-out infinite!important}
    .module.enabled:nth-child(2n){animation-delay:-1.4s!important}.module.enabled:nth-child(3n){animation-delay:-2.6s!important}
    .module.enabled::before,.preset.active::before,.stack-item::before{background-size:180% 180%!important;animation:genomeCardCaustic 7s ease-in-out infinite alternate!important}
    .depth-track i{background:linear-gradient(90deg,#8b5cf6,#3b82f6,#22d3ee,#34d399,#f472b6,#8b5cf6)!important;background-size:260% 100%!important;animation:genomeGradientRun 4.5s linear infinite!important;box-shadow:0 0 18px rgba(34,211,238,.24),0 0 28px rgba(139,92,246,.12)!important}
    .module-code{transition:box-shadow .3s ease,border-color .3s ease,color .3s ease,transform .3s ease!important}
    .module.enabled .module-code{border-color:rgba(108,228,255,.24)!important;color:#bff6ff!important;box-shadow:inset 0 0 16px rgba(34,211,238,.05),0 0 18px rgba(139,92,246,.05)}
    .module:hover .module-code{transform:translateY(-1px) scale(1.04)}
    .chromatic-burst{animation:genomeClickBurst .72s cubic-bezier(.16,1,.3,1)!important}
    .chromatic-burst::before{opacity:1!important;filter:saturate(190%) brightness(1.18)!important}
    @keyframes genomeSpectrumOrbit{0%{transform:translate3d(-4%,-2%,0) rotate(0deg) scale(1)}50%{transform:translate3d(4%,2%,0) rotate(11deg) scale(1.08)}100%{transform:translate3d(-4%,-2%,0) rotate(360deg) scale(1)}}
    @keyframes genomeAuroraMorph{0%{transform:translate3d(-3%,-1%,0) scale(1);filter:blur(85px) saturate(150%) hue-rotate(0deg)}50%{transform:translate3d(4%,3%,0) scale(1.10);filter:blur(92px) saturate(185%) hue-rotate(26deg)}100%{transform:translate3d(-1%,5%,0) scale(1.04);filter:blur(84px) saturate(170%) hue-rotate(-18deg)}}
    @keyframes genomeRibbonDrift{0%{transform:rotate(-7deg) translate3d(-12%,0,0);opacity:.42}100%{transform:rotate(-4deg) translate3d(11%,8vh,0);opacity:.78}}
    @keyframes genomeTitleSpectrum{0%,100%{background-position:0% 50%;filter:drop-shadow(0 0 0 rgba(34,211,238,0))}50%{background-position:100% 50%;filter:drop-shadow(0 0 18px rgba(34,211,238,.07))}}
    @keyframes genomeGradientRun{0%{background-position:0% 50%}100%{background-position:260% 50%}}
    @keyframes genomeGlassBreath{0%,100%{box-shadow:0 42px 120px rgba(0,0,0,.48),0 10px 34px rgba(0,0,0,.25),0 0 38px rgba(139,92,246,.035),inset 0 1px 0 rgba(255,255,255,.18),inset 0 -1px 0 rgba(0,0,0,.34)}33%{box-shadow:0 46px 130px rgba(0,0,0,.52),0 12px 38px rgba(0,0,0,.27),0 0 54px rgba(34,211,238,.055),inset 0 1px 0 rgba(255,255,255,.21),inset 0 -1px 0 rgba(0,0,0,.34)}66%{box-shadow:0 44px 125px rgba(0,0,0,.50),0 12px 36px rgba(0,0,0,.26),0 0 52px rgba(52,211,153,.045),inset 0 1px 0 rgba(255,255,255,.20),inset 0 -1px 0 rgba(0,0,0,.34)}}
    @keyframes genomeGlassCaustic{0%{background-position:0% 0%;filter:hue-rotate(0deg)}50%{background-position:100% 45%;filter:hue-rotate(16deg)}100%{background-position:15% 100%;filter:hue-rotate(-10deg)}}
    @keyframes genomeActiveTab{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.13),0 8px 20px rgba(0,0,0,.12),0 0 0 rgba(34,211,238,0)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 10px 24px rgba(0,0,0,.14),0 0 24px rgba(34,211,238,.07)}}
    @keyframes genomeIconHue{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
    @keyframes genomeStatusGlow{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 10px 28px rgba(0,0,0,.10),0 0 0 rgba(34,211,238,0)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 12px 32px rgba(0,0,0,.12),0 0 28px rgba(34,211,238,.055)}}
    @keyframes genomePulseDot{0%,100%{transform:scale(.82);opacity:.62;filter:hue-rotate(0deg);box-shadow:0 0 7px rgba(157,241,207,.30)}50%{transform:scale(1.22);opacity:1;filter:hue-rotate(42deg);box-shadow:0 0 18px rgba(34,211,238,.58),0 0 30px rgba(139,92,246,.22)}}
    @keyframes genomePresetGlow{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.13),0 10px 28px rgba(0,0,0,.12),0 0 16px rgba(139,92,246,.025)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 14px 32px rgba(0,0,0,.15),0 0 28px rgba(34,211,238,.075),0 0 42px rgba(139,92,246,.035)}}
    @keyframes genomeModuleGlow{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.10),inset 0 -1px 0 rgba(0,0,0,.16),0 10px 28px rgba(0,0,0,.10),0 0 0 rgba(34,211,238,0)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -1px 0 rgba(0,0,0,.16),0 13px 31px rgba(0,0,0,.12),0 0 22px rgba(34,211,238,.045),0 0 38px rgba(139,92,246,.025)}}
    @keyframes genomeCardCaustic{0%{background-position:0% 0%;filter:hue-rotate(0deg)}100%{background-position:100% 100%;filter:hue-rotate(24deg)}}
    @keyframes genomeClickBurst{0%{transform:scale(1)}38%{transform:scale(.985)}70%{transform:scale(1.018);filter:saturate(155%) brightness(1.08)}100%{transform:scale(1)}}
    @media(max-width:620px){body::before{opacity:.38}body::after{opacity:.36}.module.enabled{animation-duration:7.5s!important}}
    @media(prefers-reduced-motion:reduce){body::before,body::after,.genome-page::before,.hero h1,.kicker span,.workspace,.workspace::before,.tool-nav a.active,.tool-nav a.active .tool-icon,.hero-status,.shell-tag,.pulse,.module.enabled,.module.enabled::before,.preset.active,.preset.active::before,.stack-item::before,.depth-track i,.genome-footer i{animation:none!important}}
  `;
  document.head.appendChild(motion);

  const interactive=[...document.querySelectorAll('.workspace,.module,.preset,.stack-item,.hero-status,.tool-nav')];
  let raf=0,lastX=innerWidth*.5,lastY=innerHeight*.2;
  function paintPointer(){
    raf=0;
    const root=document.documentElement;
    root.style.setProperty('--gx',`${(lastX/innerWidth*100).toFixed(2)}%`);
    root.style.setProperty('--gy',`${(lastY/innerHeight*100).toFixed(2)}%`);
    const ws=document.querySelector('.workspace');
    if(ws){const r=ws.getBoundingClientRect();ws.style.setProperty('--liq-x',`${Math.max(0,Math.min(100,(lastX-r.left)/r.width*100)).toFixed(1)}%`);ws.style.setProperty('--liq-y',`${Math.max(0,Math.min(100,(lastY-r.top)/r.height*100)).toFixed(1)}%`)}
  }
  addEventListener('pointermove',e=>{lastX=e.clientX;lastY=e.clientY;if(!raf)raf=requestAnimationFrame(paintPointer)},{passive:true});
  interactive.forEach(el=>{
    el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--px',`${((e.clientX-r.left)/r.width*100).toFixed(1)}%`);el.style.setProperty('--py',`${((e.clientY-r.top)/r.height*100).toFixed(1)}%`)},{passive:true});
  });
  [...modules,...presetButtons].forEach(el=>el.addEventListener('click',()=>{el.classList.remove('chromatic-burst');void el.offsetWidth;el.classList.add('chromatic-burst');setTimeout(()=>el.classList.remove('chromatic-burst'),760)}));
  paintPointer();
  render();
})();
