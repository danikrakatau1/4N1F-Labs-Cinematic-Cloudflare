(()=>{
  'use strict';
  const root=document.documentElement;
  const target=document.getElementById('targetUrl');
  const planBtn=document.getElementById('planBtn');
  const plan=document.getElementById('planOutput');
  const depthScore=document.getElementById('depthScore');
  const depthFill=document.getElementById('depthFill');
  const stack=document.getElementById('stackList');
  const targetCopy=document.querySelector('.target-copy small');
  const modules={
    fetch:document.querySelector('.module[data-module="fetch"]'),
    xray:document.querySelector('.module[data-module="xray"]'),
    dna:document.querySelector('.module[data-module="dna"]')
  };
  if(!target||!planBtn||!plan||!stack) return;

  if(targetCopy) targetCopy.textContent='Engine Phase 1 · public/authorized URL · read-only';
  planBtn.textContent='Run Quick Genome ↗';

  const consent=document.createElement('label');
  consent.className='genome-engine-consent';
  consent.innerHTML='<input id="genomeAuthorized" type="checkbox"><span>I confirm this target is <strong>public or authorized</strong> for analysis.</span>';
  document.querySelector('.target-bar')?.appendChild(consent);
  const auth=document.getElementById('genomeAuthorized');

  const result=document.createElement('section');
  result.className='engine-result';
  result.hidden=true;
  result.innerHTML='<div class="engine-result-head"><span>QUICK GENOME OUTPUT</span><b id="engineResultState">READY</b></div><div id="engineResultBody"></div>';
  plan.parentElement?.appendChild(result);
  const resultBody=document.getElementById('engineResultBody');
  const resultState=document.getElementById('engineResultState');
  let lastData=null;
  let running=false;

  const pct=(n)=>{if(depthScore)depthScore.textContent=`${n}%`;if(depthFill)depthFill.style.width=`${n}%`};
  const stageLabel={fetch:'Fetch Engine',xray:'Source X-Ray',dna:'Design DNA'};
  const stageState=(id,state)=>{
    const el=modules[id]; if(!el) return;
    el.classList.remove('engine-stage-running','engine-stage-done','engine-stage-error');
    el.classList.add(`engine-stage-${state}`);
    const em=el.querySelector('em');
    if(em) em.textContent=state==='running'?'RUNNING':state==='done'?'DONE':state==='error'?'ERROR':em.textContent;
  };
  const renderStack=(states)=>{
    stack.innerHTML=['fetch','xray','dna'].map((id,i)=>{
      const state=states[id]||'queued';
      const cls=state==='running'?'engine-live':state==='done'?'engine-done':state==='error'?'engine-error':'';
      const code=state==='running'?'RUN':state==='done'?'DONE':state==='error'?'ERR':'QUEUE';
      return `<div class="stack-item telemetry-slot ${cls}"><span>${String(i+1).padStart(2,'0')} · ${stageLabel[id]}</span><code>${code}</code></div>`;
    }).join('');
  };
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const download=(name,data)=>{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
  const renderResult=(data)=>{
    lastData=data;
    const g=data.site_genome||{},d=data.design_tokens?.observed||{},s=g.structure||{};
    const tech=(g.technology||[]).slice(0,5);
    const colors=(d.colors||[]).slice(0,6).map(x=>x.value||x);
    result.hidden=false;
    resultState.textContent='COMPLETE';
    resultBody.innerHTML=`
      <div class="engine-result-grid">
        <div class="engine-metric"><span>Target</span><strong title="${esc(g.target)}">${esc(g.target)}</strong></div>
        <div class="engine-metric"><span>Fetched</span><strong>${Number(g.fetched_bytes||0).toLocaleString()} bytes</strong></div>
        <div class="engine-metric"><span>DOM Structure</span><strong>${Number(s.elements||0).toLocaleString()} elements · ${Number(s.sections||0)} sections</strong></div>
        <div class="engine-metric"><span>Assets</span><strong>${Number(s.images||0)} images · ${Number(s.scripts||0)} scripts · ${Number(s.stylesheets||0)} CSS</strong></div>
        <div class="engine-metric"><span>Design DNA</span><strong>${(d.colors||[]).length} colors · ${(d.font_families||[]).length} fonts · ${Number(d.gradients||0)} gradients</strong></div>
        <div class="engine-metric"><span>Timing</span><strong>${Number(data.timings_ms?.total||0)} ms total</strong></div>
      </div>
      <div class="engine-token-row">${tech.map(v=>`<span class="engine-token">${esc(v)}</span>`).join('')}${colors.map(v=>`<span class="engine-token">${esc(v)}</span>`).join('')}</div>
      <div class="engine-actions"><button type="button" data-engine-download="genome">site-genome.json</button><button type="button" data-engine-download="tokens">design-tokens.json</button></div>`;
    resultBody.querySelector('[data-engine-download="genome"]')?.addEventListener('click',()=>download('site-genome.json',data.site_genome));
    resultBody.querySelector('[data-engine-download="tokens"]')?.addEventListener('click',()=>download('design-tokens.json',data.design_tokens));
  };
  const fail=(message,stage='adapter')=>{
    ['fetch','xray','dna'].forEach(id=>{if(id===stage)stageState(id,'error')});
    result.hidden=false; resultState.textContent='ERROR';
    resultBody.innerHTML=`<div class="engine-error-box">${esc(message)}</div>`;
    plan.textContent=`QUICK GENOME ERROR · ${message}`;
  };

  planBtn.addEventListener('click',async()=>{
    if(running) return;
    const raw=String(target.value||'').trim();
    if(!raw){fail('Target URL wajib diisi.');target.focus();return;}
    if(!auth?.checked){fail('Centang konfirmasi public/authorized target sebelum menjalankan Quick Genome.');return;}
    running=true; root.classList.add('engine-running'); planBtn.disabled=true; result.hidden=true; lastData=null;
    ['fetch','xray','dna'].forEach(id=>{const em=modules[id]?.querySelector('em');if(em)em.textContent=id==='fetch'?'CORE':'READY';modules[id]?.classList.remove('engine-stage-running','engine-stage-done','engine-stage-error')});
    renderStack({fetch:'running',xray:'queued',dna:'queued'}); stageState('fetch','running'); pct(12); plan.textContent='FETCHING · source acquisition through locked Fetch Engine adapter…';
    try{
      const request=fetch('/api/genome-quick',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({url:raw,authorized:true})});
      await new Promise(r=>setTimeout(r,260));
      stageState('fetch','done');stageState('xray','running');renderStack({fetch:'done',xray:'running',dna:'queued'});pct(45);plan.textContent='X-RAY · mapping structure, metadata, assets, and technology signals…';
      await new Promise(r=>setTimeout(r,260));
      stageState('xray','done');stageState('dna','running');renderStack({fetch:'done',xray:'done',dna:'running'});pct(76);plan.textContent='DESIGN DNA · extracting observed colors, typography, spacing, radius, depth…';
      const response=await request;
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.success) throw Object.assign(new Error(data?.message||`Genome adapter gagal (${response.status}).`),{stage:data?.stage||'adapter'});
      stageState('dna','done');renderStack({fetch:'done',xray:'done',dna:'done'});pct(100);
      plan.textContent=`READY · ${data.site_genome?.target||raw} · Fetch → X-Ray → Design DNA · read-only · no KV persistence.`;
      renderResult(data);
    }catch(error){fail(error?.message||'Quick Genome gagal.',error?.stage||'adapter');}
    finally{running=false;root.classList.remove('engine-running');planBtn.disabled=false;}
  });

  root.classList.add('genome-engine-phase1-ready');
})();
