(()=>{
  'use strict';

  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* V1.3B SELECTIVE PEARL
     Keep V1.2 as the structural baseline. Pearl physics only lives on hero controls,
     not on the dense module grid / analysis rail. */
  const heroSelectors=[
    '.hero-status',
    '.tool-nav',
    '.target-input',
    '.preset'
  ];
  const heroSurfaces=[...document.querySelectorAll(heroSelectors.join(','))];

  const addLayer=(el,cls)=>{
    if(el.querySelector(`:scope > .${cls}`)) return;
    const span=document.createElement('span');
    span.className=cls;
    span.setAttribute('aria-hidden','true');
    el.insertBefore(span,el.firstChild);
  };

  heroSurfaces.forEach((el,index)=>{
    el.classList.add('pearl-chamber','pearl-selective');
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

  /* Dense content stays V1.2 chamber language. Explicit cleanup also makes this
     safe across hot reload / cached DOM states. */
  document.querySelectorAll('.workspace,.module,.stack-item,.shell-lock,.plan-output').forEach(el=>{
    el.classList.remove('pearl-chamber','pearl-hot','pearl-selective');
    el.querySelectorAll(':scope > .pearl-reservoir,:scope > .pearl-specular,:scope > .pearl-lip,:scope > .pearl-orbit-reflection,:scope > .pearl-press-wave').forEach(node=>node.remove());
    el.style.removeProperty('--pearl-x');
    el.style.removeProperty('--pearl-y');
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

  const pressTargets=[...document.querySelectorAll('.preset,.target-input button,.tool-nav a')];
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

  document.querySelectorAll('.pearl-orbit-reflection').forEach((el,index)=>{
    const duration=11.6+(index%4)*1.35;
    const delay=-(index%6)*1.55;
    el.style.animationDuration=`${duration.toFixed(2)}s`;
    el.style.animationDelay=`${delay.toFixed(2)}s`;
  });

  document.addEventListener('visibilitychange',()=>{
    root.dataset.pearlPaused=document.hidden?'1':'0';
  });

  root.classList.add('pearl-v13-ready','pearl-v13b-selective-ready');
})();
