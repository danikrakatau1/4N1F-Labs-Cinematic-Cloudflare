(()=>{
  'use strict';
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mountEnergyField(){
    if(document.querySelector('.genome-energy-field')) return;
    const field=document.createElement('div');
    field.className='genome-energy-field';
    field.setAttribute('aria-hidden','true');
    field.innerHTML='<div class="genome-energy-core"></div><div class="genome-energy-ring ring-a"></div><div class="genome-energy-ring ring-b"></div><div class="genome-energy-ring ring-c"></div><div class="genome-energy-flare"></div><div class="genome-energy-dust"></div>';
    document.body.prepend(field);
  }

  function decorateModules(){
    document.querySelectorAll('.module').forEach(card=>{
      if(card.querySelector('.chamber-rail')) return;
      const rail=document.createElement('i');rail.className='chamber-rail';rail.setAttribute('aria-hidden','true');
      const node=document.createElement('i');node.className='chamber-node';node.setAttribute('aria-hidden','true');
      const corner=document.createElement('i');corner.className='chamber-corner';corner.setAttribute('aria-hidden','true');
      card.append(rail,node,corner);
    });
    document.querySelectorAll('.stack-item').forEach(item=>{
      if(item.querySelector('.stack-scan')) return;
      const scan=document.createElement('i');scan.className='stack-scan';scan.setAttribute('aria-hidden','true');item.append(scan);
    });
  }

  function bindParallax(){
    if(reduce) return;
    const field=document.querySelector('.genome-energy-field');
    const core=document.querySelector('.genome-energy-core');
    const rings=[...document.querySelectorAll('.genome-energy-ring')];
    let tx=0,ty=0,cx=0,cy=0,raf=0;
    const tick=()=>{
      cx+=(tx-cx)*.055; cy+=(ty-cy)*.055;
      if(field) field.style.setProperty('--g12mx',cx.toFixed(2));
      if(core) core.style.marginLeft=`${(cx*12).toFixed(2)}px`,core.style.marginTop=`${(cy*8).toFixed(2)}px`;
      rings.forEach((ring,i)=>{ring.style.marginLeft=`${(cx*(i+1)*3).toFixed(2)}px`;ring.style.marginTop=`${(cy*(i+1)*2).toFixed(2)}px`;});
      raf=requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove',e=>{tx=(e.clientX/window.innerWidth-.5)*2;ty=(e.clientY/window.innerHeight-.5)*2},{passive:true});
    window.addEventListener('pointerleave',()=>{tx=0;ty=0},{passive:true});
    raf=requestAnimationFrame(tick);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf)}else{raf=requestAnimationFrame(tick)}});
  }

  function bindLocalLight(){
    const targets=document.querySelectorAll('.module,.preset,.stack-item,.target-input,.hero-status,.tool-nav');
    targets.forEach(el=>{
      el.addEventListener('pointermove',e=>{
        const r=el.getBoundingClientRect();
        el.style.setProperty('--px',`${((e.clientX-r.left)/r.width*100).toFixed(1)}%`);
        el.style.setProperty('--py',`${((e.clientY-r.top)/r.height*100).toFixed(1)}%`);
      },{passive:true});
    });
  }

  function burstAt(x,y){
    if(reduce) return;
    const b=document.createElement('span');b.className='g12-burst';b.style.left=`${x}px`;b.style.top=`${y}px`;document.body.append(b);setTimeout(()=>b.remove(),620);
  }

  function bindBurst(){
    document.addEventListener('pointerdown',e=>{
      const hit=e.target.closest('.module,.preset,.target-input button,.tool-nav a');
      if(hit) burstAt(e.clientX,e.clientY);
    },{passive:true});
  }

  function boot(){
    mountEnergyField();
    decorateModules();
    bindParallax();
    bindLocalLight();
    bindBurst();
    document.documentElement.dataset.genomeVisual='v1.2-orbit-chamber';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
