(() => {
  const frame=document.querySelector('#previewFrame');
  if(!frame)return;

  const VERSION='1.2.4';
  const brandVersion=document.querySelector('.brand span:last-child');
  if(brandVersion)brandVersion.textContent='LIVE EDITOR V'+VERSION;
  const exportTitle=document.querySelector('.export-title strong');
  if(exportTitle)exportTitle.textContent='EXPORT V'+VERSION;

  const anchor=document.querySelector('#layerControlsV123') || document.querySelector('#layerInfo');
  if(anchor && !document.querySelector('#alignControlsV124')){
    const wrap=document.createElement('div');
    wrap.id='alignControlsV124';
    wrap.innerHTML=`
      <style>
        #alignControlsV124{margin:10px 0 14px;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.025)}
        #alignControlsV124 .a-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:10px;letter-spacing:.12em;color:#8d8d93}
        #alignControlsV124 .a-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
        #alignControlsV124 button,#alignControlsV124 select{min-width:0;padding:7px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:#111;color:#d7d7dc;font-size:11px}
        #alignControlsV124 button{cursor:pointer}#alignControlsV124 button:hover{border-color:rgba(125,255,178,.45);color:#fff}
        #alignControlsV124 .sep{height:1px;background:rgba(255,255,255,.07);margin:9px 0}
        #alignControlsV124 .scope{display:grid;grid-template-columns:1fr 1.25fr;gap:6px;align-items:center}
        #alignControlsV124 .scope span{font-size:10px;color:#777}
        #alignControlsV124 .note{margin-top:8px;font-size:10px;line-height:1.45;color:#68686e}
      </style>
      <div class="a-title"><span>ALIGN + RESPONSIVE</span><span>V${VERSION}</span></div>
      <div class="a-grid">
        <button data-a="left">⟸ Left</button><button data-a="hcenter">↔ Center</button><button data-a="right">Right ⟹</button>
        <button data-a="top">⇑ Top</button><button data-a="vcenter">↕ Middle</button><button data-a="bottom">Bottom ⇓</button>
      </div>
      <div class="sep"></div>
      <div class="a-grid">
        <button data-a="space-h">Equal H Gap</button><button data-a="space-v">Equal V Gap</button><button data-a="reset-pos">Reset Pos</button>
      </div>
      <div class="sep"></div>
      <div class="scope"><span>Transform scope</span><select id="scopeV124"><option value="all">All widths</option><option value="desktop">Desktop ≥1024</option><option value="tablet">Tablet 600–1023</option><option value="mobile">Mobile ≤599</option></select></div>
      <div class="note">Align bekerja ke parent. Equal Gap memakai sibling visible. Scope dipakai untuk kode transform hasil command ini.</div>`;
    anchor.insertAdjacentElement('afterend',wrap);
  }

  const scopeEl=document.querySelector('#scopeV124');
  const currentScope=()=>scopeEl?.value||'all';
  document.querySelector('#alignControlsV124')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-a]'); if(!b)return;
    frame.contentWindow?.postMessage({source:'4n1f-v124-parent',type:'align-command',command:b.dataset.a,scope:currentScope()},'*');
  });

  function iframeAddon(){
    const S='__4n1f_v124'; if(window[S])return; window[S]=true;
    const selected=()=>document.querySelector('.__4n1f_selected');
    const clean=el=>el&&el.nodeType===1&&el!==document.body&&el!==document.documentElement&&!el.closest?.('#__4n1f_box')&&!el.id?.startsWith('__4n1f_');
    const selectorFor=el=>{if(!el)return'';if(el.id)return '#'+CSS.escape(el.id);const p=[];let n=el;while(n&&n.nodeType===1&&n!==document.body&&p.length<5){let s=n.tagName.toLowerCase();const cls=[...n.classList].filter(c=>!c.startsWith('__4n1f_')).slice(0,2);if(cls.length)s+='.'+cls.map(CSS.escape).join('.');const par=n.parentElement;if(par){const same=[...par.children].filter(x=>x.tagName===n.tagName);if(same.length>1)s+=':nth-of-type('+(same.indexOf(n)+1)+')'}p.unshift(s);n=par}return p.join(' > ')};
    const values=el=>({x:Number(el.dataset.editorX||0),y:Number(el.dataset.editorY||0),scale:Number(el.dataset.editorScale||1),rotate:Number(el.dataset.editorRotate||0)});
    const apply=(el,x,y)=>{const v=values(el);x=Math.round(x*100)/100;y=Math.round(y*100)/100;el.dataset.editorX=String(x);el.dataset.editorY=String(y);el.style.transform='translate('+x+'px,'+y+'px) rotate('+v.rotate+'deg) scale('+v.scale+')'};
    const mediaFor=scope=>scope==='desktop'?'@media (min-width:1024px)':scope==='tablet'?'@media (min-width:600px) and (max-width:1023px)':scope==='mobile'?'@media (max-width:599px)':'';
    function emit(el,scope,kind){const sel=selectorFor(el),v=values(el),body=sel+' {\n  transform: translate('+v.x+'px, '+v.y+'px) rotate('+v.rotate+'deg) scale('+v.scale+');\n}';const media=mediaFor(scope),code=media?media+' {\n'+body.split('\n').map(x=>'  '+x).join('\n')+'\n}':body;parent.postMessage({source:'4n1f-frame',type:'code',selector:sel,code,patch:{target:sel,element:sel,changes:{operation:kind,scope,moveX:v.x,moveY:v.y,scale:v.scale,rotate:v.rotate}}},'*')}
    const refreshCore=el=>{if(!el)return;el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:1,clientY:1}))};

    function align(cmd,scope){
      const s=selected(); if(!clean(s)||!clean(s.parentElement))return;
      const r=s.getBoundingClientRect(),p=s.parentElement.getBoundingClientRect(),v=values(s); let dx=0,dy=0;
      if(cmd==='left')dx=p.left-r.left;
      if(cmd==='hcenter')dx=(p.left+p.width/2)-(r.left+r.width/2);
      if(cmd==='right')dx=p.right-r.right;
      if(cmd==='top')dy=p.top-r.top;
      if(cmd==='vcenter')dy=(p.top+p.height/2)-(r.top+r.height/2);
      if(cmd==='bottom')dy=p.bottom-r.bottom;
      if(cmd==='reset-pos'){apply(s,0,0);emit(s,scope,'reset-position');refreshCore(s);return}
      apply(s,v.x+dx,v.y+dy);emit(s,scope,'align-'+cmd);refreshCore(s);
    }

    function equalGap(axis,scope){
      const s=selected(); if(!clean(s)||!clean(s.parentElement))return;
      const items=[...s.parentElement.children].filter(n=>clean(n)&&getComputedStyle(n).display!=='none'&&getComputedStyle(n).visibility!=='hidden');
      if(items.length<3)return;
      const sorted=items.slice().sort((a,b)=>{const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();return axis==='h'?ra.left-rb.left:ra.top-rb.top});
      const first=sorted[0].getBoundingClientRect(),last=sorted.at(-1).getBoundingClientRect();
      const totalSize=sorted.reduce((sum,n)=>{const r=n.getBoundingClientRect();return sum+(axis==='h'?r.width:r.height)},0);
      const span=axis==='h'?(last.right-first.left):(last.bottom-first.top);
      const gap=(span-totalSize)/(sorted.length-1);
      let cursor=axis==='h'?first.left:first.top;
      sorted.forEach((n,i)=>{const r=n.getBoundingClientRect(),v=values(n);if(i===0){cursor+=(axis==='h'?r.width:r.height);return}const desired=cursor+gap;const actual=axis==='h'?r.left:r.top;const delta=desired-actual;apply(n,v.x+(axis==='h'?delta:0),v.y+(axis==='v'?delta:0));emit(n,scope,axis==='h'?'equal-gap-horizontal':'equal-gap-vertical');const nr=n.getBoundingClientRect();cursor=(axis==='h'?nr.right:nr.bottom)});
      refreshCore(s);
    }

    addEventListener('message',e=>{const m=e.data;if(!m||m.source!=='4n1f-v124-parent'||m.type!=='align-command')return;const c=m.command,scope=m.scope||'all';if(['left','hcenter','right','top','vcenter','bottom','reset-pos'].includes(c))align(c,scope);if(c==='space-h')equalGap('h',scope);if(c==='space-v')equalGap('v',scope)},true);

    const dismiss=()=>{const m=document.getElementById('__4n1f_v123_stack');if(m){m.style.display='none';m._list=null}};
    document.addEventListener('wheel',dismiss,{capture:true,passive:true});
    document.addEventListener('scroll',dismiss,true);
    document.addEventListener('pointerdown',e=>{const m=document.getElementById('__4n1f_v123_stack');if(m&&m.style.display==='block'&&!e.target.closest('#__4n1f_v123_stack'))dismiss()},true);
    addEventListener('resize',dismiss,{passive:true}); addEventListener('blur',dismiss); document.addEventListener('keydown',e=>{if(e.key==='Escape')dismiss()},true);
  }

  const prev=Object.getOwnPropertyDescriptor(frame,'srcdoc')||Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'srcdoc');
  if(prev?.set){
    const addon='('+iframeAddon.toString()+')();';
    Object.defineProperty(frame,'srcdoc',{configurable:true,get(){return prev.get?prev.get.call(this):''},set(v){const injected=String(v).replace(/<\/body>/i,'<script>'+addon.replace(/<\/script>/gi,'<\\/script>')+'<\/script></body>');prev.set.call(this,injected)}});
  }
})();