(()=>{
  'use strict';

  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const selectors=[
    '.workspace','.hero-status','.tool-nav','.target-input',
    '.preset','.module','.stack-item','.shell-lock','.plan-output'
  ];
  const surfaces=[...document.querySelectorAll(selectors.join(','))];

  const addLayer=(el,cls)=>{
    if(el.querySelector(`:scope > .${cls}`)) return;
    const span=document.createElement('span');
    span.className=cls;
    span.setAttribute('aria-hidden','true');
    el.insertBefore(span,el.firstChild);
  };

  surfaces.forEach((el,index)=>{
    el.classList.add('pearl-chamber');
    el.style.setProperty('--pearl-delay',`${-(index%7)*1.37}s`);
    addLayer(el,'pearl-reservoir');
    addLayer(el,'pearl-specular');
    addLayer(el,'pearl-lip');
    addLayer(el,'pearl-orbit-reflection');

    if(!reduced){
      el.addEventListener('pointerenter',()=>el.classList.add('pearl-hot'),{passive:true});
      el.addEventListener('pointerleave',()=>{
        el.classList.remove('pearl-hot');
        el.style.removeProperty('--pearl-x');
        el.style.removeProperty('--pearl-y');
      },{passive:true});
      el.addEventListener('pointermove',event=>{
        const r=el.getBoundingClientRect();
        const x=((event.clientX-r.left)/Math.max(1,r.width))*100;
        const y=((event.clientY-r.top)/Math.max(1,r.height))*100;
        el.style.setProperty('--pearl-x',`${Math.max(0,Math.min(100,x)).toFixed(1)}%`);
        el.style.setProperty('--pearl-y',`${Math.max(0,Math.min(100,y)).toFixed(1)}%`);
      },{passive:true});
    }
  });

  if(!reduced){
    let frame=0,lastX=innerWidth*.5,lastY=innerHeight*.18;
    const updateGlobal=(x,y)=>{
      lastX=x;lastY=y;
      if(frame) return;
      frame=requestAnimationFrame(()=>{
        frame=0;
        const px=Math.max(0,Math.min(100,lastX/Math.max(1,innerWidth)*100));
        const py=Math.max(0,Math.min(100,lastY/Math.max(1,innerHeight)*100));
        root.style.setProperty('--pearl-x',`${px.toFixed(2)}%`);
        root.style.setProperty('--pearl-y',`${py.toFixed(2)}%`);
      });
    };
    addEventListener('pointermove',e=>updateGlobal(e.clientX,e.clientY),{passive:true});
  }

  const pressTargets=[...document.querySelectorAll('.module,.preset,.target-input button,.tool-nav a')];
  pressTargets.forEach(el=>{
    el.addEventListener('pointerdown',event=>{
      if(reduced) return;
      const host=el.closest('.pearl-chamber')||el;
      const r=host.getBoundingClientRect();
      const wave=document.createElement('span');
      wave.className='pearl-press-wave';
      wave.setAttribute('aria-hidden','true');
      wave.style.left=`${event.clientX-r.left}px`;
      wave.style.top=`${event.clientY-r.top}px`;
      host.appendChild(wave);
      wave.addEventListener('animationend',()=>wave.remove(),{once:true});
      setTimeout(()=>wave.remove(),900);
    },{passive:true});
  });

  /* Give each panel family a tiny timing offset so reflections feel like one
     moving light source crossing physical material rather than cloned cards. */
  document.querySelectorAll('.pearl-orbit-reflection').forEach((el,index)=>{
    const duration=10.8+(index%5)*1.15;
    const delay=-(index%8)*1.43;
    el.style.animationDuration=`${duration.toFixed(2)}s`;
    el.style.animationDelay=`${delay.toFixed(2)}s`;
  });

  document.addEventListener('visibilitychange',()=>{
    root.dataset.pearlPaused=document.hidden?'1':'0';
  });

  root.classList.add('pearl-v13-ready');
})();
