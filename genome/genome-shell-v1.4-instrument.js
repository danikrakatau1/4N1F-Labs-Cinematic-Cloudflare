(()=>{
  'use strict';

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const moduleVisuals={
    fetch:'<i></i><i></i><i></i><i></i><i></i><i></i>',
    xray:'',
    dna:'<i></i><i></i><i></i>',
    components:'<i></i><i></i><i></i>',
    responsive:'<i></i><i></i><i></i>',
    assets:'<i></i><i></i><i></i>',
    behavior:'',
    routes:'<i></i><i></i><i></i>',
    diff:'',
    twin:''
  };

  const modules=[...document.querySelectorAll('.module[data-module]')];
  modules.forEach((el,index)=>{
    const key=(el.dataset.module||'').toLowerCase();
    el.classList.add('instrument-cell');
    if(!el.querySelector(':scope > .instrument-visual')){
      const visual=document.createElement('span');
      visual.className='instrument-visual';
      visual.setAttribute('aria-hidden','true');
      visual.innerHTML=moduleVisuals[key]??'';
      el.appendChild(visual);
    }
    el.style.setProperty('--instrument-phase',`${-(index%5)*1.4}s`);
  });

  const slots=[...document.querySelectorAll('.stack-item')];
  slots.forEach((slot,index)=>{
    slot.classList.add('telemetry-slot');
    if(index===0||slot.querySelector('code')?.textContent?.toLowerCase().includes('core')){
      slot.classList.add('telemetry-active');
    }
  });

  if(!reduced){
    modules.forEach(el=>{
      el.addEventListener('pointerenter',()=>el.classList.add('instrument-hot'),{passive:true});
      el.addEventListener('pointerleave',()=>el.classList.remove('instrument-hot'),{passive:true});
    });
  }

  document.documentElement.classList.add('instrument-v14-ready');
})();
