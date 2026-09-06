(() => {
  const frame=document.querySelector('#previewFrame');
  if(!frame)return;

  const VERSION='1.2.3';
  const brandVersion=document.querySelector('.brand span:last-child');
  if(brandVersion)brandVersion.textContent='LIVE EDITOR V'+VERSION;
  const exportTitle=document.querySelector('.export-title strong');
  if(exportTitle)exportTitle.textContent='EXPORT V'+VERSION;

  const layerInfo=document.querySelector('#layerInfo');
  if(layerInfo && !document.querySelector('#layerControlsV123')){
    const wrap=document.createElement('div');
    wrap.id='layerControlsV123';
    wrap.innerHTML=`
      <style>
        #layerControlsV123{margin:10px 0 14px;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.025)}
        #layerControlsV123 .lc-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:10px;letter-spacing:.12em;color:#8d8d93}
        #layerControlsV123 .lc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        #layerControlsV123 button{min-width:0;padding:7px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:#111;color:#d7d7dc;cursor:pointer;font-size:11px}
        #layerControlsV123 button:hover{border-color:rgba(125,255,178,.45);color:#fff}
        #layerControlsV123 button.danger{border-color:rgba(255,92,92,.28);color:#ff9f9f}
        #layerControlsV123 button.warn{border-color:rgba(255,205,92,.25);color:#f3d78a}
        #layerControlsV123 .lc-tree{margin-top:9px;max-height:220px;overflow:auto;border-top:1px solid rgba(255,255,255,.07);padding-top:7px}
        #layerControlsV123 .lc-row{display:flex;gap:6px;align-items:center;width:100%;padding:6px 7px;margin:2px 0;border-radius:7px;background:transparent;border:0;text-align:left}
        #layerControlsV123 .lc-row.active{background:rgba(125,255,178,.09);outline:1px solid rgba(125,255,178,.18)}
        #layerControlsV123 .lc-row .depth{color:#555;font-family:monospace;white-space:pre}
        #layerControlsV123 .lc-row .name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
        #layerControlsV123 .lc-row .state{font-size:10px;color:#777}
        #layerControlsV123 .lc-help{margin-top:7px;font-size:10px;line-height:1.45;color:#68686e}
      </style>
      <div class="lc-title"><span>LAYER CONTROL</span><span>V${VERSION}</span></div>
      <div class="lc-grid">
        <button data-layer-cmd="parent">↑ Parent</button>
        <button data-layer-cmd="child">↓ First Child</button>
        <button data-layer-cmd="prev">← Prev Layer</button>
        <button data-layer-cmd="next">Next Layer →</button>
        <button class="warn" data-layer-cmd="lock">🔒 Lock / Unlock</button>
        <button class="danger" data-layer-cmd="delete">⌫ Delete Physical</button>
        <button data-layer-cmd="restore">↶ Restore Last</button>
        <button data-layer-cmd="refresh">↻ Refresh Tree</button>
      </div>
      <div id="layerTreeV123" class="lc-tree"><div class="empty">Pilih elemen untuk melihat hierarchy.</div></div>
      <div class="lc-help">Alt+click = tembus layer • klik kanan = stack • Delete melepas node dari DOM draft.</div>`;
    layerInfo.insertAdjacentElement('afterend',wrap);
  }

  const tree=document.querySelector('#layerTreeV123');
  const send=(type,payload={})=>frame.contentWindow?.postMessage({source:'4n1f-v123-parent',type,...payload},'*');
  document.querySelector('#layerControlsV123')?.addEventListener('click',e=>{const b=e.target.closest('[data-layer-cmd]');if(b)send('layer-command',{command:b.dataset.layerCmd})});
  tree?.addEventListener('click',e=>{const b=e.target.closest('[data-layer-id]');if(b)send('layer-select',{id:b.dataset.layerId})});
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  addEventListener('message',e=>{if(e.source!==frame.contentWindow)return;const m=e.data;if(!m||m.source!=='4n1f-v123-frame')return;if(m.type==='layer-tree'&&tree){const rows=m.rows||[];tree.innerHTML=rows.length?rows.map(r=>`<button class="lc-row ${r.selected?'active':''}" data-layer-id="${esc(r.id)}"><span class="depth">${'· '.repeat(Math.max(0,r.depth||0))}</span><span class="name">${esc(r.name)}</span><span class="state">${r.locked?'🔒':''}</span></button>`).join(''):'<div class="empty">Hierarchy kosong.</div>'}},false);

  function iframeAddon(){
    const S='__4n1f_v123';if(window[S])return;window[S]=true;
    const ids=new WeakMap(),byId=new Map();let seq=0,active=false,lastDeleted=[],cycleKey='',cycle=0;
    const idFor=el=>{if(!ids.has(el)){const id='l_'+(++seq);ids.set(el,id);byId.set(id,el)}return ids.get(el)};
    const clean=el=>el&&el.nodeType===1&&el!==document.body&&el!==document.documentElement&&!el.closest?.('#__4n1f_box')&&!el.closest?.('#'+S+'_stack');
    const selected=()=>document.querySelector('.__4n1f_selected');
    const post=(type,payload={})=>parent.postMessage({source:'4n1f-v123-frame',type,...payload},'*');
    const selectorFor=el=>{if(!el)return'';if(el.id)return '#'+CSS.escape(el.id);const p=[];let n=el;while(n&&n.nodeType===1&&n!==document.body&&p.length<5){let s=n.tagName.toLowerCase();const cls=[...n.classList].filter(c=>!c.startsWith('__4n1f_')&&!c.startsWith(S)).slice(0,2);if(cls.length)s+='.'+cls.map(CSS.escape).join('.');const par=n.parentElement;if(par){const same=[...par.children].filter(x=>x.tagName===n.tagName);if(same.length>1)s+=':nth-of-type('+(same.indexOf(n)+1)+')'}p.unshift(s);n=par}return p.join(' > ')};
    const labelFor=el=>{if(!el)return'element';const id=el.id?'#'+el.id:'';const cls=[...el.classList].filter(c=>!c.startsWith('__4n1f_')&&!c.startsWith(S)).slice(0,2).map(c=>'.'+c).join('');return el.tagName.toLowerCase()+id+cls};

    const style=document.createElement('style');style.id=S+'_style';style.textContent='#'+S+'_guide_v,#'+S+'_guide_h{position:fixed;z-index:2147483644;pointer-events:none;display:none;background:#58ffad}#'+S+'_guide_v{top:0;bottom:0;width:1px}#'+S+'_guide_h{left:0;right:0;height:1px}#'+S+'_measure{position:fixed;z-index:2147483645;pointer-events:none;display:none;font:700 10px/1.2 monospace;color:#08110c;background:#7dffb2;border-radius:5px;padding:4px 6px;white-space:nowrap}#'+S+'_stack{position:fixed;z-index:2147483647;display:none;min-width:240px;max-width:min(420px,calc(100vw - 24px));max-height:300px;overflow:auto;padding:6px;border:1px solid #343434;border-radius:10px;background:#0b0b0bf2;color:#eee;font:12px/1.35 system-ui}#'+S+'_stack button{display:block;width:100%;text-align:left;border:0;border-radius:7px;background:transparent;color:#ddd;padding:8px;cursor:pointer}#'+S+'_stack button:hover{background:#1d1d1d;color:#fff}.'+S+'_decorative,.'+S+'_locked{pointer-events:none!important}[data-4n1f-locked="1"]{outline:1px dashed rgba(255,204,92,.35)!important}';document.head.appendChild(style);
    const mk=id=>{const n=document.createElement('div');n.id=id;document.documentElement.appendChild(n);return n};const gv=mk(S+'_guide_v'),gh=mk(S+'_guide_h'),measure=mk(S+'_measure'),stack=mk(S+'_stack');

    function clickSelect(el){if(!clean(el))return;const old=el.style.pointerEvents;el.style.pointerEvents='auto';el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:1,clientY:1}));el.style.pointerEvents=old;setTimeout(refreshTree,0)}
    function lineage(el){const a=[];let n=el;while(clean(n)&&a.length<7){a.unshift(n);n=n.parentElement}return a}
    function refreshTree(){const s=selected();if(!s){post('layer-tree',{rows:[]});return}const chain=lineage(s),rows=[];chain.forEach((n,i)=>rows.push({id:idFor(n),name:labelFor(n),depth:i,selected:n===s,locked:n.dataset.fourN1fLocked==='1'}));[...s.children].filter(clean).slice(0,12).forEach(n=>rows.push({id:idFor(n),name:labelFor(n),depth:chain.length,selected:false,locked:n.dataset.fourN1fLocked==='1'}));post('layer-tree',{rows})}

    const candidates=(x,y)=>document.elementsFromPoint(x,y).filter(clean).filter(n=>n.dataset.fourN1fLocked!=='1');
    function showStack(x,y,list){stack._list=list;stack.innerHTML=list.slice(0,14).map((n,i)=>'<button data-i="'+i+'"><b>'+labelFor(n).replace(/[<>]/g,'')+'</b><small style="display:block;color:#777;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+selectorFor(n).replace(/[<>]/g,'')+'</small></button>').join('');stack.style.left=Math.max(8,Math.min(x+10,innerWidth-430))+'px';stack.style.top=Math.max(8,Math.min(y+10,innerHeight-320))+'px';stack.style.display='block'}
    stack.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation()});stack.addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(!b)return;const n=stack._list?.[Number(b.dataset.i)];stack.style.display='none';clickSelect(n)});
    document.addEventListener('pointerdown',e=>{if(e.altKey){const list=candidates(e.clientX,e.clientY);if(list.length>1){const k=Math.round(e.clientX/6)+':'+Math.round(e.clientY/6);cycle=k===cycleKey?(cycle+1)%list.length:1;cycleKey=k;e.preventDefault();e.stopImmediatePropagation();clickSelect(list[cycle]||list[1])}}else if(e.button===2){const list=candidates(e.clientX,e.clientY);if(list.length>1){e.preventDefault();e.stopImmediatePropagation();showStack(e.clientX,e.clientY,list)}}},true);document.addEventListener('contextmenu',e=>{if(stack.style.display==='block'){e.preventDefault();e.stopImmediatePropagation()}},true);

    const hideGuides=()=>{gv.style.display=gh.style.display=measure.style.display='none'};
    function showMeasure(s){const r=s.getBoundingClientRect(),p=s.parentElement?.getBoundingClientRect?.()||{left:0,top:0,right:innerWidth,bottom:innerHeight};let gap=Infinity;[...(s.parentElement?.children||[])].filter(n=>n!==s&&clean(n)&&getComputedStyle(n).display!=='none').forEach(n=>{const q=n.getBoundingClientRect();const g=Math.min(r.left>=q.right?r.left-q.right:q.left>=r.right?q.left-r.right:Infinity,r.top>=q.bottom?r.top-q.bottom:q.top>=r.bottom?q.top-r.bottom:Infinity);gap=Math.min(gap,g)});const vals=['W '+Math.round(r.width)+'px','H '+Math.round(r.height)+'px','L '+Math.round(r.left-p.left)+'px','R '+Math.round(p.right-r.right)+'px','T '+Math.round(r.top-p.top)+'px','B '+Math.round(p.bottom-r.bottom)+'px'];if(isFinite(gap))vals.push('Gap '+Math.round(gap)+'px');measure.textContent=vals.join(' • ');measure.style.display='block';measure.style.left=Math.max(6,Math.min(innerWidth-310,r.left))+'px';measure.style.top=Math.max(6,r.top-30)+'px'}
    function snapGuide(s){const r=s.getBoundingClientRect(),p=s.parentElement?.getBoundingClientRect?.()||{left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight},t=7;let dx=0,dy=0,vx=null,hy=null;const cx=r.left+r.width/2,cy=r.top+r.height/2,pcx=p.left+p.width/2,pcy=p.top+p.height/2;for(const [a,b] of [[cx,innerWidth/2],[cx,pcx],[r.left,p.left],[r.right,p.right]])if(Math.abs(a-b)<=t){dx=b-a;vx=b;break}for(const [a,b] of [[cy,innerHeight/2],[cy,pcy],[r.top,p.top],[r.bottom,p.bottom]])if(Math.abs(a-b)<=t){dy=b-a;hy=b;break}for(const n of [...(s.parentElement?.children||[])].filter(n=>n!==s&&clean(n)&&getComputedStyle(n).display!=='none')){const q=n.getBoundingClientRect();if(vx===null)for(const [a,b] of [[r.left,q.left],[r.right,q.right],[cx,q.left+q.width/2],[r.left,q.right],[r.right,q.left]])if(Math.abs(a-b)<=t){dx=b-a;vx=b;break}if(hy===null)for(const [a,b] of [[r.top,q.top],[r.bottom,q.bottom],[cy,q.top+q.height/2],[r.top,q.bottom],[r.bottom,q.top]])if(Math.abs(a-b)<=t){dy=b-a;hy=b;break}}if(dx||dy){const x=Math.round((Number(s.dataset.editorX||0)+dx)*100)/100,y=Math.round((Number(s.dataset.editorY||0)+dy)*100)/100,sc=Math.round(Number(s.dataset.editorScale||1)*10000)/10000,rot=Math.round(Number(s.dataset.editorRotate||0)*100)/100;s.dataset.editorX=String(x);s.dataset.editorY=String(y);s.dataset.editorScale=String(sc);s.dataset.editorRotate=String(rot);s.style.transform='translate('+x+'px,'+y+'px) rotate('+rot+'deg) scale('+sc+')'}if(vx!==null){gv.style.left=vx+'px';gv.style.display='block'}else gv.style.display='none';if(hy!==null){gh.style.top=hy+'px';gh.style.display='block'}else gh.style.display='none';showMeasure(s)}
    document.addEventListener('pointerdown',e=>{const s=selected();active=!!s&&(e.target===s||e.target.closest?.('#__4n1f_box'));if(active)hideGuides()},true);addEventListener('pointermove',()=>{if(active){const s=selected();if(s)snapGuide(s)}},true);addEventListener('pointerup',()=>{if(active){active=false;setTimeout(hideGuides,300);refreshTree()}},true);

    function emitOperation(target,operation,code,extra={}){parent.postMessage({source:'4n1f-frame',type:'code',selector:target,code,patch:{target,element:extra.element||target,changes:{operation,...extra}}},'*')}
    function doDelete(){const s=selected();if(!s||!clean(s))return;const target=selectorFor(s),parentEl=s.parentElement,next=s.nextElementSibling,outer=s.outerHTML,parentSel=selectorFor(parentEl),nextSel=next?selectorFor(next):'';lastDeleted.push({el:s,parent:parentEl,next,target,parentSel,nextSel,outer});s.classList.remove('__4n1f_selected');s.remove();document.querySelector('#__4n1f_box')?.style.setProperty('display','none');emitOperation(target,'delete','document.querySelector('+JSON.stringify(target)+')?.remove();',{parent:parentSel});post('layer-tree',{rows:[]})}
    function doRestore(){const d=lastDeleted.pop();if(!d)return;if(d.next&&d.next.parentElement===d.parent)d.parent.insertBefore(d.el,d.next);else d.parent.appendChild(d.el);clickSelect(d.el);const code='if(!document.querySelector('+JSON.stringify(d.target)+')){const t=document.createElement("template");t.innerHTML='+JSON.stringify(d.outer)+';const n=t.content.firstElementChild,p=document.querySelector('+JSON.stringify(d.parentSel)+'),r='+(d.nextSel?'document.querySelector('+JSON.stringify(d.nextSel)+')':'null')+';if(p&&n)p.insertBefore(n,r&&r.parentElement===p?r:null);}';emitOperation(d.target,'restore',code,{parent:d.parentSel});refreshTree()}
    function toggleLock(){const s=selected();if(!s)return;const on=s.dataset.fourN1fLocked!=='1';s.dataset.fourN1fLocked=on?'1':'0';s.classList.toggle(S+'_locked',on);refreshTree()}
    function navigate(cmd){const s=selected();if(!s)return;let n=null;if(cmd==='parent')n=clean(s.parentElement)?s.parentElement:null;if(cmd==='child')n=[...s.children].find(clean);if(cmd==='prev'){let p=s.previousElementSibling;while(p&&!clean(p))p=p.previousElementSibling;n=p}if(cmd==='next'){let p=s.nextElementSibling;while(p&&!clean(p))p=p.nextElementSibling;n=p}if(n)clickSelect(n)}
    addEventListener('message',e=>{const m=e.data;if(!m||m.source!=='4n1f-v123-parent')return;if(m.type==='layer-select'){const n=byId.get(m.id);if(n&&n.isConnected)clickSelect(n)}if(m.type==='layer-command'){const c=m.command;if(['parent','child','prev','next'].includes(c))navigate(c);if(c==='lock')toggleLock();if(c==='delete')doDelete();if(c==='restore')doRestore();if(c==='refresh')refreshTree()}},true);document.addEventListener('click',()=>setTimeout(refreshTree,0),false);
    function decorative(){document.querySelectorAll('[data-decorative],.aurora-grain,.aurora-vignette,.aurora-bloom,.particle-layer,.noise,.grain,.vignette').forEach(n=>n.classList.add(S+'_decorative'));document.querySelectorAll('canvas').forEach(n=>{const cs=getComputedStyle(n);if(cs.position==='absolute'||cs.position==='fixed')n.classList.add(S+'_decorative')})}setTimeout(decorative,300);setTimeout(decorative,1300);setTimeout(refreshTree,500);
  }
  const addon='('+iframeAddon.toString()+')();';
  const desc=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'srcdoc');
  if(desc?.set)Object.defineProperty(frame,'srcdoc',{configurable:true,get(){return desc.get.call(this)},set(v){const safe=addon.replace(/<\/script>/gi,'<\\/script>');desc.set.call(this,String(v).replace(/<\/body>/i,'<script>'+safe+'<\/script></body>'))}});
})();