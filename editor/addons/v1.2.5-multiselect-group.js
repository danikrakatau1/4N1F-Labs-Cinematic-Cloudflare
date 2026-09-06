(() => {
  const frame=document.querySelector('#previewFrame');
  if(!frame)return;

  const VERSION='1.2.5';
  const brandVersion=document.querySelector('.brand span:last-child');
  if(brandVersion)brandVersion.textContent='LIVE EDITOR V'+VERSION;
  const exportTitle=document.querySelector('.export-title strong');
  if(exportTitle)exportTitle.textContent='EXPORT V'+VERSION;

  const anchor=document.querySelector('#alignControlsV124') || document.querySelector('#layerControlsV123') || document.querySelector('#layerInfo');
  if(anchor && !document.querySelector('#multiControlsV125')){
    const wrap=document.createElement('div');
    wrap.id='multiControlsV125';
    wrap.innerHTML=`
      <style>
        #multiControlsV125{margin:10px 0 14px;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.025)}
        #multiControlsV125 .m-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:10px;letter-spacing:.12em;color:#8d8d93}
        #multiControlsV125 .m-status{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:7px 8px;border-radius:8px;background:#0d0d0f;border:1px solid rgba(255,255,255,.07);font-size:10px;color:#8a8a91}
        #multiControlsV125 .m-status b{color:#7dffb2;font-size:12px}
        #multiControlsV125 .m-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
        #multiControlsV125 .m-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
        #multiControlsV125 button{min-width:0;padding:7px 6px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:#111;color:#d7d7dc;cursor:pointer;font-size:10px}
        #multiControlsV125 button:hover{border-color:rgba(125,255,178,.45);color:#fff}
        #multiControlsV125 button.primary{border-color:rgba(125,255,178,.28);color:#aaffcc}
        #multiControlsV125 .sep{height:1px;background:rgba(255,255,255,.07);margin:9px 0}
        #multiControlsV125 .note{margin-top:8px;font-size:10px;line-height:1.45;color:#68686e}
      </style>
      <div class="m-title"><span>MULTI SELECT + GROUP</span><span>V${VERSION}</span></div>
      <div class="m-status"><span>Selected</span><b id="multiCountV125">0</b></div>
      <div class="m-grid two"><button class="primary" data-m="select-siblings">Select Siblings</button><button data-m="clear">Clear Multi</button></div>
      <div class="sep"></div>
      <div class="m-grid"><button data-m="left">⟸ Left</button><button data-m="hcenter">↔ Center</button><button data-m="right">Right ⟹</button><button data-m="top">⇑ Top</button><button data-m="vcenter">↕ Middle</button><button data-m="bottom">Bottom ⇓</button></div>
      <div class="sep"></div>
      <div class="m-grid two"><button data-m="dist-h">Distribute H</button><button data-m="dist-v">Distribute V</button><button class="primary" data-m="group">Group Visual</button><button data-m="ungroup">Ungroup</button></div>
      <div class="note">Shift+click = tambah/kurangi pilihan. Group Visual tidak merusak DOM: Labs menyimpan grup logis dan menggerakkannya bersama.</div>`;
    anchor.insertAdjacentElement('afterend',wrap);
  }

  const countEl=document.querySelector('#multiCountV125');
  document.querySelector('#multiControlsV125')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-m]');if(!b)return;
    frame.contentWindow?.postMessage({source:'4n1f-v125-parent',type:'multi-command',command:b.dataset.m},'*');
  });
  addEventListener('message',e=>{
    if(e.source!==frame.contentWindow)return;
    const m=e.data;if(!m||m.source!=='4n1f-v125-frame')return;
    if(m.type==='multi-state'&&countEl)countEl.textContent=String(m.count||0);
  },false);

  function iframeAddon(){
    const S='__4n1f_v125';if(window[S])return;window[S]=true;
    const set=new Set();let groupSeq=0,gesture=null;
    const clean=el=>el&&el.nodeType===1&&el!==document.body&&el!==document.documentElement&&!el.closest?.('#__4n1f_box')&&!el.id?.startsWith('__4n1f_');
    const primary=()=>document.querySelector('.__4n1f_selected');
    const selectorFor=el=>{if(!el)return'';if(el.id)return '#'+CSS.escape(el.id);const p=[];let n=el;while(n&&n.nodeType===1&&n!==document.body&&p.length<5){let s=n.tagName.toLowerCase();const cls=[...n.classList].filter(c=>!c.startsWith('__4n1f_')).slice(0,2);if(cls.length)s+='.'+cls.map(CSS.escape).join('.');const par=n.parentElement;if(par){const same=[...par.children].filter(x=>x.tagName===n.tagName);if(same.length>1)s+=':nth-of-type('+(same.indexOf(n)+1)+')'}p.unshift(s);n=par}return p.join(' > ')};
    const values=el=>({x:Number(el.dataset.editorX||0),y:Number(el.dataset.editorY||0),scale:Number(el.dataset.editorScale||1),rotate:Number(el.dataset.editorRotate||0)});
    const apply=(el,x,y)=>{const v=values(el);x=Math.round(x*100)/100;y=Math.round(y*100)/100;el.dataset.editorX=String(x);el.dataset.editorY=String(y);el.style.transform='translate('+x+'px,'+y+'px) rotate('+v.rotate+'deg) scale('+v.scale+')'};
    const postState=()=>parent.postMessage({source:'4n1f-v125-frame',type:'multi-state',count:set.size},'*');
    const emit=(el,kind,extra={})=>{const sel=selectorFor(el),v=values(el),code=sel+' {\n  transform: translate('+v.x+'px, '+v.y+'px) rotate('+v.rotate+'deg) scale('+v.scale+');\n}';parent.postMessage({source:'4n1f-frame',type:'code',selector:sel,code,patch:{target:sel,element:sel,changes:{operation:kind,moveX:v.x,moveY:v.y,scale:v.scale,rotate:v.rotate,...extra}}},'*')};

    const style=document.createElement('style');style.id=S+'_style';style.textContent='.__4n1f_multi_selected{outline:2px solid rgba(108,167,255,.95)!important;outline-offset:5px!important}.__4n1f_multi_grouped{box-shadow:0 0 0 1px rgba(255,199,92,.38)!important}';document.head.appendChild(style);
    function paint(){document.querySelectorAll('.__4n1f_multi_selected').forEach(n=>n.classList.remove('__4n1f_multi_selected'));for(const n of [...set]){if(!n.isConnected){set.delete(n);continue}if(n!==primary())n.classList.add('__4n1f_multi_selected')}postState()}
    function syncPrimary(){const p=primary();if(p&&clean(p)&&!set.size)set.add(p);paint()}
    function toggle(el){if(!clean(el))return;if(set.has(el))set.delete(el);else set.add(el);paint()}
    function clear(){set.clear();paint()}
    function selectedItems(){const p=primary();if(p&&clean(p)&&!set.has(p))set.add(p);return [...set].filter(n=>n.isConnected&&clean(n))}

    document.addEventListener('click',e=>{
      if(!clean(e.target))return;
      if(e.shiftKey){e.preventDefault();e.stopPropagation();toggle(e.target);return}
      setTimeout(()=>{const p=primary();if(p&&clean(p)){set.clear();set.add(p);paint()}},0);
    },false);

    function selectSiblings(){const p=primary();if(!clean(p)||!p.parentElement)return;set.clear();[...p.parentElement.children].filter(n=>clean(n)&&getComputedStyle(n).display!=='none'&&getComputedStyle(n).visibility!=='hidden').forEach(n=>set.add(n));paint()}
    function bounds(items){const rs=items.map(n=>n.getBoundingClientRect());return {left:Math.min(...rs.map(r=>r.left)),right:Math.max(...rs.map(r=>r.right)),top:Math.min(...rs.map(r=>r.top)),bottom:Math.max(...rs.map(r=>r.bottom)),width:Math.max(...rs.map(r=>r.right))-Math.min(...rs.map(r=>r.left)),height:Math.max(...rs.map(r=>r.bottom))-Math.min(...rs.map(r=>r.top))}}
    function align(cmd){const items=selectedItems();if(items.length<2)return;const b=bounds(items);for(const n of items){const r=n.getBoundingClientRect(),v=values(n);let dx=0,dy=0;if(cmd==='left')dx=b.left-r.left;if(cmd==='hcenter')dx=(b.left+b.width/2)-(r.left+r.width/2);if(cmd==='right')dx=b.right-r.right;if(cmd==='top')dy=b.top-r.top;if(cmd==='vcenter')dy=(b.top+b.height/2)-(r.top+r.height/2);if(cmd==='bottom')dy=b.bottom-r.bottom;apply(n,v.x+dx,v.y+dy);emit(n,'multi-align-'+cmd)}paint()}
    function distribute(axis){const items=selectedItems();if(items.length<3)return;const sorted=items.slice().sort((a,b)=>{const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();return axis==='h'?ra.left-rb.left:ra.top-rb.top});const first=sorted[0].getBoundingClientRect(),last=sorted.at(-1).getBoundingClientRect(),total=sorted.reduce((s,n)=>{const r=n.getBoundingClientRect();return s+(axis==='h'?r.width:r.height)},0),span=axis==='h'?last.right-first.left:last.bottom-first.top,gap=(span-total)/(sorted.length-1);let cursor=axis==='h'?first.left:first.top;sorted.forEach((n,i)=>{const r=n.getBoundingClientRect(),v=values(n);if(i===0){cursor+=axis==='h'?r.width:r.height;return}const desired=cursor+gap,actual=axis==='h'?r.left:r.top,delta=desired-actual;apply(n,v.x+(axis==='h'?delta:0),v.y+(axis==='v'?delta:0));emit(n,axis==='h'?'multi-distribute-horizontal':'multi-distribute-vertical',{gap:Math.round(gap*100)/100});const nr=n.getBoundingClientRect();cursor=axis==='h'?nr.right:nr.bottom});paint()}
    function group(){const items=selectedItems();if(items.length<2)return;const id='g_'+Date.now().toString(36)+'_'+(++groupSeq);items.forEach(n=>{n.dataset.fourN1fGroup=id;n.classList.add('__4n1f_multi_grouped')});for(const n of items){const sel=selectorFor(n);const code="document.querySelector("+JSON.stringify(sel)+")?.setAttribute('data-4n1f-group',"+JSON.stringify(id)+");";parent.postMessage({source:'4n1f-frame',type:'code',selector:sel,code,patch:{target:sel,element:sel,changes:{operation:'visual-group',group:id}}},'*')}paint()}
    function ungroup(){const items=selectedItems();const ids=new Set(items.map(n=>n.dataset.fourN1fGroup).filter(Boolean));if(!ids.size)return;document.querySelectorAll('[data-4n1f-group]').forEach(n=>{if(ids.has(n.dataset.fourN1fGroup)){const old=n.dataset.fourN1fGroup;delete n.dataset.fourN1fGroup;n.classList.remove('__4n1f_multi_grouped');const sel=selectorFor(n),code="document.querySelector("+JSON.stringify(sel)+")?.removeAttribute('data-4n1f-group');";parent.postMessage({source:'4n1f-frame',type:'code',selector:sel,code,patch:{target:sel,element:sel,changes:{operation:'visual-ungroup',group:old}}},'*')}});paint()}

    document.addEventListener('pointerdown',e=>{const p=primary();if(!p||e.button!==0||e.target!==p)return;const gid=p.dataset.fourN1fGroup;if(!gid)return;const members=[...document.querySelectorAll('[data-4n1f-group="'+CSS.escape(gid)+'"]')].filter(n=>n!==p&&clean(n));if(!members.length)return;const pv=values(p);gesture={p,gid,startX:pv.x,startY:pv.y,members:members.map(n=>({n,v:values(n)}))}},true);
    addEventListener('pointermove',()=>{if(!gesture)return;requestAnimationFrame(()=>{if(!gesture)return;const pv=values(gesture.p),dx=pv.x-gesture.startX,dy=pv.y-gesture.startY;for(const m of gesture.members)apply(m.n,m.v.x+dx,m.v.y+dy)})},true);
    addEventListener('pointerup',()=>{if(!gesture)return;const g=gesture;gesture=null;for(const m of g.members)emit(m.n,'visual-group-move',{group:g.gid});paint()},true);

    addEventListener('message',e=>{const m=e.data;if(!m||m.source!=='4n1f-v125-parent'||m.type!=='multi-command')return;const c=m.command;if(c==='clear')clear();if(c==='select-siblings')selectSiblings();if(['left','hcenter','right','top','vcenter','bottom'].includes(c))align(c);if(c==='dist-h')distribute('h');if(c==='dist-v')distribute('v');if(c==='group')group();if(c==='ungroup')ungroup()},true);
    setTimeout(syncPrimary,600);
  }

  const prev=Object.getOwnPropertyDescriptor(frame,'srcdoc')||Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'srcdoc');
  if(prev?.set){const addon='('+iframeAddon.toString()+')();';Object.defineProperty(frame,'srcdoc',{configurable:true,get(){return prev.get?prev.get.call(this):''},set(v){const injected=String(v).replace(/<\/body>/i,'<script>'+addon.replace(/<\/script>/gi,'<\\/script>')+'<\/script></body>');prev.set.call(this,injected)}})}
})();