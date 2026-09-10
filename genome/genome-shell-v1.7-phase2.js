(()=>{
  'use strict';
  const root=document.documentElement;
  const target=document.getElementById('targetUrl');
  const oldBtn=document.getElementById('planBtn');
  const plan=document.getElementById('planOutput');
  const depthScore=document.getElementById('depthScore');
  const depthFill=document.getElementById('depthFill');
  const stack=document.getElementById('stackList');
  const result=document.querySelector('.engine-result');
  const resultBody=document.getElementById('engineResultBody');
  const resultState=document.getElementById('engineResultState');
  const auth=document.getElementById('genomeAuthorized');
  if(!target||!oldBtn||!plan||!stack||!result||!resultBody||!resultState) return;

  const planBtn=oldBtn.cloneNode(true); oldBtn.replaceWith(planBtn);
  const allIds=['fetch','xray','dna','components','responsive','assets','behavior','routes'];
  const labels={fetch:'Fetch Engine',xray:'Source X-Ray',dna:'Design DNA',components:'Components',responsive:'Responsive DNA',assets:'Asset Intelligence',behavior:'Behavior Map',routes:'Route Graph'};
  const modules=Object.fromEntries(allIds.map(id=>[id,document.querySelector(`.module[data-module="${id}"]`)]));
  let running=false,lastData=null;

  const normalizeRaw=(value)=>String(value||'').trim().replace(/^https?:\/\/https?:\/\//i,'https://');
  const normalizedUrl=()=>{const raw=normalizeRaw(target.value);return /^https?:\/\//i.test(raw)?raw:`https://${raw}`};
  const syncPrefix=()=>{const box=target.closest('.target-input');box?.classList.toggle('full-url',/^https?:\/\//i.test(String(target.value||'').trim()))};
  target.addEventListener('input',syncPrefix,{passive:true});
  target.addEventListener('paste',()=>setTimeout(()=>{target.value=normalizeRaw(target.value);syncPrefix()},0));
  target.addEventListener('blur',()=>{target.value=normalizeRaw(target.value);syncPrefix()});
  syncPrefix();

  const activeMode=()=>document.querySelector('.preset.active')?.dataset.preset||'quick';
  const updateButton=()=>{const mode=activeMode();planBtn.textContent=mode==='deep'?'Run Deep Genome ↗':mode==='twin'?'Twin Mode Staged':'Run Quick Genome ↗'};
  document.querySelectorAll('.preset').forEach(b=>b.addEventListener('click',()=>setTimeout(updateButton,0)));
  updateButton();

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct=n=>{if(depthScore)depthScore.textContent=`${n}%`;if(depthFill)depthFill.style.width=`${n}%`};
  const stateModule=(id,state)=>{const el=modules[id];if(!el)return;el.classList.remove('engine-stage-running','engine-stage-done','engine-stage-error');if(state)el.classList.add(`engine-stage-${state}`);const em=el.querySelector('em');if(em)em.textContent=state==='running'?'RUNNING':state==='done'?'DONE':state==='error'?'ERROR':(id==='fetch'?'CORE':'STAGED')};
  const renderStack=(ids,states)=>{stack.innerHTML=ids.map((id,i)=>{const state=states[id]||'queued';const cls=state==='running'?'engine-live':state==='done'?'engine-done':state==='error'?'engine-error':'';const code=state==='running'?'RUN':state==='done'?'DONE':state==='error'?'ERR':'QUEUE';return `<div class="stack-item telemetry-slot ${cls}"><span>${String(i+1).padStart(2,'0')} · ${labels[id]}</span><code>${code}</code></div>`}).join('')};
  const download=(name,data)=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  const token=v=>`<span class="engine-token">${esc(v)}</span>`;
  const colorToken=v=>`<span class="engine-token engine-color-token"><i style="background:${esc(v)}"></i>${esc(v)}</span>`;
  const rows=obj=>Object.entries(obj||{}).map(([k,v])=>`<div class="engine-list-row"><span>${esc(k.replaceAll('_',' '))}</span><strong>${esc(typeof v==='object'?JSON.stringify(v):v)}</strong></div>`).join('');

  function renderInspector(data,mode){
    lastData=data;result.hidden=false;resultState.textContent=mode==='deep'?'DEEP COMPLETE':'COMPLETE';resultState.classList.toggle('engine-deep-badge',mode==='deep');
    const g=data.site_genome||{},d=data.design_tokens?.observed||{},s=g.structure||{},deep=data.deep||{};
    const tech=g.technology||[],colors=(d.colors||[]).map(x=>x.value||x),fonts=(d.font_families||[]).map(x=>x.value||x);
    const overview=`<div class="engine-result-grid"><div class="engine-metric"><span>Target</span><strong>${esc(g.target||'—')}</strong></div><div class="engine-metric"><span>Fetched</span><strong>${Number(g.fetched_bytes||0).toLocaleString()} bytes</strong></div><div class="engine-metric"><span>DOM</span><strong>${Number(s.elements||0).toLocaleString()} elements · ${Number(s.sections||0)} sections</strong></div><div class="engine-metric"><span>Timing</span><strong>${Number(data.timings_ms?.total||0)} ms total</strong></div></div><div class="engine-token-row">${tech.map(token).join('')}${colors.slice(0,6).map(colorToken).join('')}</div>`;
    const structure=`<div class="engine-list">${rows(s)}</div>`;
    const design=`<div class="engine-list"><div class="engine-list-row"><span>Fonts</span><div class="engine-token-row">${fonts.slice(0,12).map(token).join('')||'—'}</div></div><div class="engine-list-row"><span>Colors</span><div class="engine-token-row">${colors.slice(0,18).map(colorToken).join('')||'—'}</div></div>${rows({gradients:d.gradients,box_shadows:d.box_shadows,css_variables:d.css_variables,media_queries:d.media_queries})}</div>`;
    const technology=`<div class="engine-token-row">${tech.map(token).join('')||'<span class="engine-stage-note">No obvious framework signal detected in static source.</span>'}</div>`;
    const assets=mode==='deep'?`<div class="engine-list">${rows(deep.assets?.by_type||{})}<div class="engine-list-row"><span>Hosts</span><div class="engine-token-row">${(deep.assets?.hosts||[]).map(token).join('')}</div></div></div>`:`<div class="engine-list">${rows({images:s.images,scripts:s.scripts,stylesheets:s.stylesheets})}</div>`;
    const deepPane=mode==='deep'?`<div class="engine-list"><div class="engine-list-row"><span>Components</span><strong>${esc(JSON.stringify(deep.components?.semantic_counts||{}))}</strong></div><div class="engine-list-row"><span>Responsive</span><strong>${Number(deep.responsive?.media_query_count||0)} media queries · ${Number(deep.responsive?.srcset_count||0)} srcset · viewport ${deep.responsive?.viewport_meta?'yes':'no'}</strong></div><div class="engine-list-row"><span>Behavior</span><strong>${Number(deep.behavior?.inline_event_handlers||0)} inline handlers · ${Number(deep.behavior?.animation_mentions||0)} animations · ${Number(deep.behavior?.transition_mentions||0)} transitions</strong></div></div>`:'';
    const tabs=[['overview','Overview'],['structure','Structure'],['design','Design DNA'],['tech','Tech'],['assets','Assets']];if(mode==='deep')tabs.push(['deep','Deep Map']);
    resultBody.innerHTML=`<div class="engine-inspector-tabs">${tabs.map(([id,label],i)=>`<button class="engine-inspector-tab ${i===0?'active':''}" data-pane="${id}" type="button">${label}</button>`).join('')}</div><div class="engine-pane active" data-pane-body="overview">${overview}</div><div class="engine-pane" data-pane-body="structure">${structure}</div><div class="engine-pane" data-pane-body="design">${design}</div><div class="engine-pane" data-pane-body="tech">${technology}</div><div class="engine-pane" data-pane-body="assets">${assets}</div>${mode==='deep'?`<div class="engine-pane" data-pane-body="deep">${deepPane}</div>`:''}<div class="engine-actions"><button data-dl="genome" type="button">site-genome.json</button><button data-dl="tokens" type="button">design-tokens.json</button>${mode==='deep'?'<button data-dl="deep" type="button">deep-observation.json</button>':''}</div>`;
    resultBody.querySelectorAll('.engine-inspector-tab').forEach(btn=>btn.addEventListener('click',()=>{resultBody.querySelectorAll('.engine-inspector-tab').forEach(x=>x.classList.toggle('active',x===btn));resultBody.querySelectorAll('.engine-pane').forEach(x=>x.classList.toggle('active',x.dataset.paneBody===btn.dataset.pane))}));
    resultBody.querySelector('[data-dl="genome"]')?.addEventListener('click',()=>download('site-genome.json',data.site_genome));
    resultBody.querySelector('[data-dl="tokens"]')?.addEventListener('click',()=>download('design-tokens.json',data.design_tokens));
    resultBody.querySelector('[data-dl="deep"]')?.addEventListener('click',()=>download('deep-observation.json',data.deep));
  }

  const fail=(message,stage)=>{if(stage&&modules[stage])stateModule(stage,'error');result.hidden=false;resultState.textContent='ERROR';resultBody.innerHTML=`<div class="engine-error-box">${esc(message)}</div>`;plan.textContent=`GENOME ERROR · ${message}`};

  planBtn.addEventListener('click',async()=>{
    if(running)return;
    const mode=activeMode();
    if(mode==='twin'){plan.textContent='TWIN MODE · staged for a later reconstruction/diff phase. No request sent.';return;}
    const raw=normalizeRaw(target.value);if(!raw){fail('Target URL wajib diisi.');target.focus();return}if(!auth?.checked){fail('Centang konfirmasi public/authorized target terlebih dahulu.');return}
    target.value=raw;syncPrefix();
    const ids=mode==='deep'?allIds.slice(0,7):allIds.slice(0,3);
    const endpoint=mode==='deep'?'/api/genome-deep':'/api/genome-quick';
    running=true;root.classList.add('engine-running');planBtn.disabled=true;result.hidden=true;lastData=null;
    allIds.forEach(id=>stateModule(id,null));renderStack(ids,Object.fromEntries(ids.map(id=>[id,'queued'])));pct(0);
    const states=Object.fromEntries(ids.map(id=>[id,'queued']));
    try{
      const request=fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({url:normalizedUrl(),authorized:true})});
      for(let i=0;i<ids.length;i++){
        const id=ids[i];states[id]='running';renderStack(ids,states);stateModule(id,'running');pct(Math.max(8,Math.round(i/ids.length*88)));plan.textContent=`${labels[id].toUpperCase()} · ${mode==='deep'?'Deep Phase 2':'Quick Phase 1'} read-only analysis…`;
        await new Promise(r=>setTimeout(r,mode==='deep'?150:220));
        states[id]='done';stateModule(id,'done');renderStack(ids,states);
      }
      const response=await request;const data=await response.json().catch(()=>null);if(!response.ok||!data?.success)throw Object.assign(new Error(data?.message||`Genome adapter gagal (${response.status}).`),{stage:data?.stage||'fetch'});
      pct(100);plan.textContent=`READY · ${data.site_genome?.target||normalizedUrl()} · ${mode.toUpperCase()} · read-only · no KV persistence.`;renderInspector(data,mode);
    }catch(error){fail(error?.message||'Genome gagal.',error?.stage||'fetch')}
    finally{running=false;root.classList.remove('engine-running');planBtn.disabled=false;updateButton()}
  });
  target.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();planBtn.click()}});
  root.classList.add('genome-engine-phase2-ready');
})();
