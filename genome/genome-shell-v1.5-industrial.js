(()=>{
  'use strict';
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* V1.5 deliberately does less. It removes decorative behavior and makes
     the existing module instrumentation read like one shared control surface. */
  document.querySelectorAll('.module.instrument-cell').forEach((el,index)=>{
    el.classList.add('industrial-cell');
    el.style.setProperty('--industrial-row',String(Math.floor(index/2)));
    const code=el.querySelector('.module-code');
    if(code) code.setAttribute('data-index',String(index+1).padStart(2,'0'));
  });

  const slots=[...document.querySelectorAll('.stack-item.telemetry-slot')];
  slots.forEach((slot,index)=>{
    slot.dataset.step=String(index+1).padStart(2,'0');
  });

  /* Cursor light only on the master workspace; no per-card glow chasing. */
  const workspace=document.querySelector('.workspace');
  if(workspace && !reduced){
    let raf=0;
    workspace.addEventListener('pointermove',e=>{
      if(raf) return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        const r=workspace.getBoundingClientRect();
        const x=((e.clientX-r.left)/Math.max(1,r.width))*100;
        const y=((e.clientY-r.top)/Math.max(1,r.height))*100;
        workspace.style.setProperty('--liq-x',`${Math.max(0,Math.min(100,x)).toFixed(1)}%`);
        workspace.style.setProperty('--liq-y',`${Math.max(0,Math.min(100,y)).toFixed(1)}%`);
      });
    },{passive:true});
  }

  root.classList.add('industrial-v15-ready');
})();
